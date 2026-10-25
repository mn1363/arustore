'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  CartItemType,
  CreateOrderPayload,
  Locale,
  Order,
  Product,
  ProductColorOption,
  ProductReview,
  ServerCartSummary,
  ServerOrder,
  UserProfile,
} from '@/types'
import {
  DEFAULT_ALUMINUM_FINISH,
  isProductAvailable,
} from '@/lib/data/catalog'
import {
  ApiError,
  aruApi,
  clearInMemoryAccessToken,
  getInMemoryAccessToken,
  registerAuthSyncCallbacks,
} from '@/lib/api/client'
import {
  addServerCartItem,
  addServerWishlistItem,
  applyServerCartPromo,
  buildCartLineIdentityKey,
  clearServerCart,
  fetchServerCart,
  fetchServerWishlist,
  removeServerCartItem,
  removeServerWishlistItem,
  resolveValidatedProductOptions,
  updateServerCartItemQuantity,
} from '@/lib/api/cart'
import {
  computeCheckoutCartFingerprint,
  computeCheckoutPayloadFingerprint,
  createServerOrder,
  fetchServerOrders,
  generateCheckoutIdempotencyKey,
} from '@/lib/api/orders'

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

export interface ToastMessage {
  id: string
  title: string
  description?: string
  type: 'success' | 'info' | 'error'
}

const LEGACY_DEMO_ORDER_IDS = new Set(['ord-1001', 'ord-1002'])
const LEGACY_DEMO_ORDER_NUMBERS = new Set(['ARU-84920', 'ARU-85104'])
const LEGACY_MOCK_CART_ITEM_IDS = new Set(['1-silver-champagne-3-tier'])

export function sanitizePersistedOrders(rawOrders: unknown): Order[] {
  if (!Array.isArray(rawOrders)) {
    return []
  }
  return rawOrders.filter((entry): entry is Order => {
    if (!entry || typeof entry !== 'object') return false
    const candidate = entry as Partial<Order>
    if (candidate.id && LEGACY_DEMO_ORDER_IDS.has(String(candidate.id))) {
      return false
    }
    if (
      candidate.orderNumber &&
      LEGACY_DEMO_ORDER_NUMBERS.has(String(candidate.orderNumber))
    ) {
      return false
    }
    return Boolean(candidate.id && candidate.orderNumber)
  })
}

export function sanitizePersistedGuestCart(rawCart: unknown): CartItemType[] {
  if (!Array.isArray(rawCart)) {
    return []
  }
  return rawCart.filter((entry): entry is CartItemType => {
    if (!entry || typeof entry !== 'object') return false
    const candidate = entry as Partial<CartItemType>
    if (!candidate.id || LEGACY_MOCK_CART_ITEM_IDS.has(String(candidate.id))) {
      return false
    }
    // Never hydrate server-owned cart items into guest storage
    if (typeof candidate.serverItemId === 'number') {
      return false
    }
    if (
      !candidate.product ||
      typeof candidate.product !== 'object' ||
      typeof candidate.product.id !== 'number' ||
      typeof candidate.quantity !== 'number' ||
      candidate.quantity < 1
    ) {
      return false
    }
    return true
  })
}

export function sanitizePersistedGuestWishlistIds(
  rawIds: unknown
): number[] {
  if (!Array.isArray(rawIds)) {
    return []
  }
  return Array.from(
    new Set(
      rawIds.filter(
        (id): id is number =>
          typeof id === 'number' && Number.isInteger(id) && id > 0
      )
    )
  )
}

export interface PendingCartMergeIntent {
  userId: number
  lineKey: string
  baselineServerQuantity: number
  guestQuantitySnapshot: number
  targetQuantity: number
}

export function sanitizePersistedMergeIntents(
  rawIntents: unknown,
  activeGuestCart: CartItemType[]
): Record<string, PendingCartMergeIntent> {
  if (!rawIntents || typeof rawIntents !== 'object' || Array.isArray(rawIntents)) {
    return {}
  }

  const activeLineKeys = new Set(
    activeGuestCart.map((item) =>
      buildCartLineIdentityKey(
        item.product,
        item.selectedColor,
        item.selectedEdition
      )
    )
  )

  const sanitized: Record<string, PendingCartMergeIntent> = {}
  for (const [key, rawVal] of Object.entries(
    rawIntents as Record<string, unknown>
  )) {
    if (!rawVal || typeof rawVal !== 'object' || Array.isArray(rawVal)) {
      continue
    }
    const candidate = rawVal as Partial<PendingCartMergeIntent>
    if (
      typeof candidate.userId !== 'number' ||
      !Number.isInteger(candidate.userId) ||
      candidate.userId <= 0 ||
      typeof candidate.lineKey !== 'string' ||
      !candidate.lineKey.trim() ||
      typeof candidate.baselineServerQuantity !== 'number' ||
      !Number.isInteger(candidate.baselineServerQuantity) ||
      candidate.baselineServerQuantity < 0 ||
      typeof candidate.guestQuantitySnapshot !== 'number' ||
      !Number.isInteger(candidate.guestQuantitySnapshot) ||
      candidate.guestQuantitySnapshot < 1 ||
      typeof candidate.targetQuantity !== 'number' ||
      !Number.isInteger(candidate.targetQuantity) ||
      candidate.targetQuantity <= candidate.baselineServerQuantity
    ) {
      continue
    }

    const expectedKey = `${candidate.userId}::${candidate.lineKey}`
    if (key !== expectedKey || !activeLineKeys.has(candidate.lineKey)) {
      continue
    }

    sanitized[expectedKey] = {
      userId: candidate.userId,
      lineKey: candidate.lineKey,
      baselineServerQuantity: candidate.baselineServerQuantity,
      guestQuantitySnapshot: candidate.guestQuantitySnapshot,
      targetQuantity: candidate.targetQuantity,
    }
  }

  return sanitized
}

function pruneMergeIntentsForGuestCart(
  intents: Record<string, PendingCartMergeIntent>,
  guestCart: CartItemType[]
): Record<string, PendingCartMergeIntent> {
  if (!intents || Object.keys(intents).length === 0) {
    return {}
  }
  return sanitizePersistedMergeIntents(intents, guestCart)
}

export interface PendingCheckoutAttempt {
  userId: number
  idempotencyKey: string
  payloadFingerprint: string
  cartFingerprint: string
}

export function sanitizePersistedCheckoutAttempt(
  rawAttempt: unknown
): PendingCheckoutAttempt | null {
  if (!rawAttempt || typeof rawAttempt !== 'object' || Array.isArray(rawAttempt)) {
    return null
  }
  const candidate = rawAttempt as Partial<PendingCheckoutAttempt>
  const key =
    typeof candidate.idempotencyKey === 'string'
      ? candidate.idempotencyKey.trim()
      : ''
  if (
    typeof candidate.userId !== 'number' ||
    !Number.isInteger(candidate.userId) ||
    candidate.userId <= 0 ||
    !key ||
    key.length > 128 ||
    typeof candidate.payloadFingerprint !== 'string' ||
    !/^[0-9a-f]{16}$/i.test(candidate.payloadFingerprint) ||
    typeof candidate.cartFingerprint !== 'string' ||
    !/^[0-9a-f]{16}$/i.test(candidate.cartFingerprint)
  ) {
    return null
  }
  return {
    userId: candidate.userId,
    idempotencyKey: key,
    payloadFingerprint: candidate.payloadFingerprint.toLowerCase(),
    cartFingerprint: candidate.cartFingerprint.toLowerCase(),
  }
}

export interface PersistedAppSlice {
  locale: Locale
  hasSessionHint: boolean
  guestCart: CartItemType[]
  guestWishlistIds: number[]
  pendingCartMergeIntents: Record<string, PendingCartMergeIntent>
  pendingCheckoutAttempt: PendingCheckoutAttempt | null
  orders: Order[]
}

export function migratePersistedStoreState(
  persistedState: unknown,
  version: number
): Partial<PersistedAppSlice> {
  if (!persistedState || typeof persistedState !== 'object') {
    return {
      locale: 'fa',
      hasSessionHint: false,
      guestCart: [],
      guestWishlistIds: [],
      pendingCartMergeIntents: {},
      pendingCheckoutAttempt: null,
      orders: [],
    }
  }

  const raw = persistedState as Record<string, unknown>
  const preservedLocale: Locale = raw.locale === 'en' ? 'en' : 'fa'
  const cleanedOrders = sanitizePersistedOrders(raw.orders)

  // Version < 2 may hold legacy demo admin state (`DEFAULT_USER`, `INITIAL_ORDERS`).
  // Version < 3 stored `cart` / `wishlistIds` directly rather than isolated `guestCart` / `guestWishlistIds`.
  const migratedGuestCart = sanitizePersistedGuestCart(
    version >= 3 ? raw.guestCart : raw.cart
  )
  const migratedGuestWishlist =
    version >= 3 ? sanitizePersistedGuestWishlistIds(raw.guestWishlistIds) : []
  const migratedMergeIntents =
    version >= 3
      ? sanitizePersistedMergeIntents(
          raw.pendingCartMergeIntents,
          migratedGuestCart
        )
      : {}
  const migratedCheckoutAttempt =
    version >= 3
      ? sanitizePersistedCheckoutAttempt(raw.pendingCheckoutAttempt)
      : null

  return {
    locale: preservedLocale,
    hasSessionHint: version >= 2 ? Boolean(raw.hasSessionHint) : false,
    guestCart: migratedGuestCart,
    guestWishlistIds: migratedGuestWishlist,
    pendingCartMergeIntents: migratedMergeIntents,
    pendingCheckoutAttempt: migratedCheckoutAttempt,
    orders: cleanedOrders,
  }
}

export interface PromoApplyResult {
  ok: boolean
  error?: string
}

export interface OrderSubmitResult {
  ok: boolean
  order?: ServerOrder
  error?: string
  requiresAuth?: boolean
}

interface AppState {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLocale: () => void

  products: Product[]
  upsertCatalogProducts: (incoming: Product[]) => void
  addProductReview: (
    productId: number,
    review: Omit<ProductReview, 'id' | 'created_at'>
  ) => void
  toggleProductFeatured: (productId: number) => void
  updateProductStock: (productId: number, stock: number) => void

  // Active effective cart view (`authCartSummary.items` when authenticated, `guestCart` when guest)
  cart: CartItemType[]
  guestCart: CartItemType[]
  pendingCartMergeIntents: Record<string, PendingCartMergeIntent>
  authCartSummary: ServerCartSummary | null
  authPromoCode: string | null
  cartLoading: boolean
  cartError: string | null
  mergeError: string | null

  isCartDrawerOpen: boolean
  setCartDrawerOpen: (open: boolean) => void
  loadServerCart: () => Promise<ServerCartSummary | null>
  addToCart: (
    product: Product,
    quantity?: number,
    color?: ProductColorOption,
    edition?: string
  ) => Promise<boolean>
  removeFromCart: (itemId: string) => Promise<boolean>
  updateCartQuantity: (itemId: string, quantity: number) => Promise<boolean>
  clearCart: () => Promise<boolean>

  promoCode: string | null
  promoPercent: number
  applyPromoCode: (code: string) => Promise<PromoApplyResult>
  removePromoCode: () => Promise<void>

  // Active effective wishlist view (`authWishlistIds` when authenticated, `guestWishlistIds` when guest)
  wishlistIds: number[]
  guestWishlistIds: number[]
  authWishlistIds: number[]
  authWishlistProducts: Product[]
  wishlistLoading: boolean
  wishlistError: string | null
  loadServerWishlist: () => Promise<Product[]>
  toggleWishlist: (productId: number, productHint?: Product) => Promise<boolean>
  isInWishlist: (productId: number) => boolean

  syncAuthenticatedState: () => Promise<void>

  quickViewProduct: Product | null
  setQuickViewProduct: (product: Product | null) => void

  orders: Order[]
  authOrders: ServerOrder[]
  ordersLoading: boolean
  ordersError: string | null
  orderSubmitting: boolean
  orderSubmitError: string | null
  pendingCheckoutAttempt: PendingCheckoutAttempt | null
  loadServerOrders: () => Promise<ServerOrder[]>
  submitCheckoutOrder: (payload: CreateOrderPayload) => Promise<OrderSubmitResult>
  placeOrder: (orderData: {
    customerName: string
    shippingAddress: string
  }) => Order
  updateOrderStatus: (orderId: string, status: Order['status']) => void

  user: UserProfile | null
  authStatus: AuthStatus
  hasSessionHint: boolean
  loginUser: (emailOrUsername: string, password: string) => Promise<UserProfile>
  registerUser: (data: {
    email: string
    full_name: string
    password: string
    phone?: string
  }) => Promise<UserProfile>
  logoutUser: () => Promise<void>
  bootstrapAuth: (forceServerCheck?: boolean) => Promise<UserProfile | null>
  verifyAdminAccess: () => Promise<
    'authorized' | 'unauthenticated' | 'forbidden'
  >

  toasts: ToastMessage[]
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void
  dismissToast: (id: string) => void
}

let inFlightBootstrap: Promise<UserProfile | null> | null = null
let inFlightAccountSync: Promise<void> | null = null
let inFlightOrderSubmission: Promise<OrderSubmitResult> | null = null

// Prevents duplicate concurrent wishlist toggle requests per productId.
const inFlightWishlistProductIds = new Set<number>()

export function resetCartWishlistRuntimeLocks(): void {
  inFlightBootstrap = null
  inFlightAccountSync = null
  inFlightOrderSubmission = null
  inFlightWishlistProductIds.clear()
}

function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.message) return err.message
  if (err instanceof Error && err.message) return err.message
  return fallback
}

function resolveNumericServerItemId(
  items: CartItemType[],
  itemId: string
): number | null {
  const matched = items.find(
    (item) => item.id === itemId || String(item.serverItemId) === String(itemId)
  )
  if (matched && typeof matched.serverItemId === 'number') {
    return matched.serverItemId
  }
  const parsed = Number(itemId)
  if (Number.isInteger(parsed) && parsed > 0) {
    return parsed
  }
  return null
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      locale: 'fa',
      setLocale: (locale) => set({ locale }),
      toggleLocale: () =>
        set((state) => ({ locale: state.locale === 'fa' ? 'en' : 'fa' })),

      products: [],
      upsertCatalogProducts: (incoming) =>
        set((state) => {
          if (!incoming.length) return state
          const merged = new Map<number, Product>()
          for (const existing of state.products) {
            merged.set(existing.id, existing)
          }
          for (const item of incoming) {
            merged.set(item.id, item)
          }
          return { products: Array.from(merged.values()) }
        }),
      addProductReview: (productId, reviewData) => {
        const newReview: ProductReview = {
          ...reviewData,
          id: Date.now(),
          created_at: new Date().toISOString().slice(0, 10),
        }
        set((state) => ({
          products: state.products.map((p) => {
            if (p.id !== productId) return p
            const updatedReviews = [newReview, ...p.reviews]
            const newCount = p.rating_count + 1
            const newAvg = Number(
              (
                (p.rating_avg * p.rating_count + reviewData.rating) /
                newCount
              ).toFixed(2)
            )
            return {
              ...p,
              reviews: updatedReviews,
              rating_count: newCount,
              rating_avg: newAvg,
            }
          }),
        }))
      },
      toggleProductFeatured: (productId) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, is_featured: !p.is_featured } : p
          ),
        })),
      updateProductStock: (productId, stock) =>
        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId
              ? { ...p, stock_quantity: Math.max(0, stock) }
              : p
          ),
        })),

      cart: [],
      guestCart: [],
      pendingCartMergeIntents: {},
      authCartSummary: null,
      authPromoCode: null,
      cartLoading: false,
      cartError: null,
      mergeError: null,

      isCartDrawerOpen: false,
      setCartDrawerOpen: (open) => set({ isCartDrawerOpen: open }),

      loadServerCart: async () => {
        const { user, authPromoCode } = get()
        if (!user || !getInMemoryAccessToken()) {
          return null
        }
        set({ cartLoading: true, cartError: null })
        try {
          let summary: ServerCartSummary
          try {
            summary = await fetchServerCart(authPromoCode)
          } catch (promoErr) {
            if (authPromoCode && promoErr instanceof ApiError && promoErr.status < 500) {
              set({ authPromoCode: null, promoCode: null, promoPercent: 0 })
              summary = await fetchServerCart(null)
            } else {
              throw promoErr
            }
          }
          get().upsertCatalogProducts(summary.items.map((i) => i.product))
          set({
            authCartSummary: summary,
            cart: summary.items,
            promoCode: summary.promoCode,
            promoPercent: summary.promoPercent,
            cartLoading: false,
            cartError: null,
          })
          return summary
        } catch (err) {
          const msg = extractMessage(err, 'Unable to load cart')
          set({ cartLoading: false, cartError: msg })
          return null
        }
      },

      addToCart: async (product, quantity = 1, color, edition) => {
        const locale = get().locale
        if (!Number.isInteger(quantity) || quantity < 1) {
          const msg =
            locale === 'fa' ? 'تعداد نامعتبر است' : 'Invalid quantity'
          set({ cartError: msg })
          get().pushToast({ title: msg, type: 'error' })
          return false
        }

        let validatedOptions: ReturnType<typeof resolveValidatedProductOptions>
        try {
          validatedOptions = resolveValidatedProductOptions(
            product,
            color,
            edition
          )
        } catch (optErr) {
          const msg = extractMessage(optErr, 'Invalid product options')
          set({ cartError: msg })
          get().pushToast({ title: msg, type: 'error' })
          return false
        }

        // Authenticated Path — Backend is strictly authoritative
        if (get().user && getInMemoryAccessToken()) {
          set({ cartLoading: true, cartError: null })
          try {
            let summary = await addServerCartItem({
              product_id: product.id,
              quantity,
              selected_color: validatedOptions.colorPayload,
              selected_edition: validatedOptions.edition ?? null,
            })

            const activePromo = get().authPromoCode
            if (activePromo && summary.itemCount > 0) {
              try {
                summary = await fetchServerCart(activePromo)
              } catch {
                set({ authPromoCode: null })
              }
            }

            get().upsertCatalogProducts(summary.items.map((i) => i.product))
            set({
              authCartSummary: summary,
              cart: summary.items,
              promoCode: summary.promoCode,
              promoPercent: summary.promoPercent,
              isCartDrawerOpen: true,
              cartLoading: false,
              cartError: null,
            })
            get().pushToast({
              title:
                locale === 'fa'
                  ? `${product.name_fa} به سبد خرید اضافه شد`
                  : `${product.name} added to bag`,
              description:
                locale === 'fa'
                  ? validatedOptions.color.name_fa
                  : validatedOptions.color.name,
              type: 'success',
            })
            return true
          } catch (err) {
            const msg = extractMessage(
              err,
              locale === 'fa'
                ? 'امکان افزودن محصول به سبد خرید وجود ندارد'
                : 'Unable to add item to bag'
            )
            set({ cartLoading: false, cartError: msg })
            get().pushToast({ title: msg, type: 'error' })
            return false
          }
        }

        // Guest Path — Validate availability & cumulative stock against backend-loaded product
        if (!isProductAvailable(product)) {
          const msg =
            locale === 'fa'
              ? 'این محصول در حال حاضر ناموجود است'
              : 'This product is currently out of stock'
          set({ cartError: msg })
          get().pushToast({ title: msg, type: 'error' })
          return false
        }

        const currentGuest = get().guestCart
        const existingProductTotal = currentGuest
          .filter((item) => item.product.id === product.id)
          .reduce((acc, item) => acc + item.quantity, 0)

        if (existingProductTotal + quantity > product.stock_quantity) {
          const msg =
            locale === 'fa'
              ? `تعداد درخواستی بیشتر از موجودی انبار (${product.stock_quantity} عدد) است`
              : `Requested quantity exceeds available stock (${product.stock_quantity} available)`
          set({ cartError: msg })
          get().pushToast({ title: msg, type: 'error' })
          return false
        }

        const lineKey = buildCartLineIdentityKey(
          product,
          validatedOptions.color,
          validatedOptions.edition
        )

        const nextGuestCart = (() => {
          const existingIdx = currentGuest.findIndex(
            (item) =>
              buildCartLineIdentityKey(
                item.product,
                item.selectedColor,
                item.selectedEdition
              ) === lineKey
          )
          if (existingIdx >= 0) {
            return currentGuest.map((item, idx) =>
              idx === existingIdx
                ? {
                    ...item,
                    product,
                    quantity: item.quantity + quantity,
                  }
                : item
            )
          }
          return [
            ...currentGuest,
            {
              id: `guest::${lineKey}`,
              product,
              quantity,
              selectedColor: validatedOptions.color,
              selectedEdition: validatedOptions.edition,
            },
          ]
        })()

        set({
          guestCart: nextGuestCart,
          cart: nextGuestCart,
          isCartDrawerOpen: true,
          cartError: null,
        })

        get().pushToast({
          title:
            locale === 'fa'
              ? `${product.name_fa} به سبد خرید اضافه شد`
              : `${product.name} added to bag`,
          description:
            locale === 'fa'
              ? validatedOptions.color.name_fa
              : validatedOptions.color.name,
          type: 'success',
        })
        return true
      },

      updateCartQuantity: async (itemId, quantity) => {
        const locale = get().locale
        if (!Number.isInteger(quantity) || quantity < 0) {
          const msg =
            locale === 'fa' ? 'تعداد نامعتبر است' : 'Invalid quantity'
          set({ cartError: msg })
          get().pushToast({ title: msg, type: 'error' })
          return false
        }

        // Authenticated Path
        if (get().user && getInMemoryAccessToken()) {
          const currentItems = get().authCartSummary?.items || []
          const serverItemId = resolveNumericServerItemId(currentItems, itemId)
          if (!serverItemId) {
            const msg =
              locale === 'fa'
                ? 'آیتم سبد خرید یافت نشد'
                : 'Cart item not found'
            set({ cartError: msg })
            return false
          }

          set({ cartLoading: true, cartError: null })
          try {
            let summary = await updateServerCartItemQuantity(
              serverItemId,
              quantity
            )
            const activePromo = get().authPromoCode
            if (activePromo) {
              if (summary.itemCount === 0) {
                set({ authPromoCode: null })
              } else {
                try {
                  summary = await fetchServerCart(activePromo)
                } catch {
                  set({ authPromoCode: null })
                }
              }
            }

            get().upsertCatalogProducts(summary.items.map((i) => i.product))
            set({
              authCartSummary: summary,
              cart: summary.items,
              promoCode: summary.promoCode,
              promoPercent: summary.promoPercent,
              cartLoading: false,
              cartError: null,
            })
            return true
          } catch (err) {
            const msg = extractMessage(
              err,
              locale === 'fa'
                ? 'خطا در بروزرسانی تعداد محصول'
                : 'Unable to update quantity'
            )
            set({ cartLoading: false, cartError: msg })
            get().pushToast({ title: msg, type: 'error' })
            return false
          }
        }

        // Guest Path
        const currentGuest = get().guestCart
        const target = currentGuest.find((item) => item.id === itemId)
        if (!target) {
          return false
        }

        if (quantity === 0) {
          const nextGuest = currentGuest.filter((item) => item.id !== itemId)
          set((state) => ({
            guestCart: nextGuest,
            cart: nextGuest,
            pendingCartMergeIntents: pruneMergeIntentsForGuestCart(
              state.pendingCartMergeIntents,
              nextGuest
            ),
            cartError: null,
          }))
          return true
        }

        if (!isProductAvailable(target.product)) {
          const msg =
            locale === 'fa'
              ? 'این محصول ناموجود شده است'
              : 'This product is no longer in stock'
          set({ cartError: msg })
          get().pushToast({ title: msg, type: 'error' })
          return false
        }

        const otherLinesQty = currentGuest
          .filter(
            (item) =>
              item.product.id === target.product.id && item.id !== target.id
          )
          .reduce((acc, item) => acc + item.quantity, 0)

        if (otherLinesQty + quantity > target.product.stock_quantity) {
          const msg =
            locale === 'fa'
              ? `تعداد درخواستی بیشتر از موجودی انبار (${target.product.stock_quantity} عدد) است`
              : `Requested quantity exceeds available stock (${target.product.stock_quantity} available)`
          set({ cartError: msg })
          get().pushToast({ title: msg, type: 'error' })
          return false
        }

        const nextGuest = currentGuest.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        )
        set({ guestCart: nextGuest, cart: nextGuest, cartError: null })
        return true
      },

      removeFromCart: async (itemId) => {
        const locale = get().locale
        if (get().user && getInMemoryAccessToken()) {
          const currentItems = get().authCartSummary?.items || []
          const serverItemId = resolveNumericServerItemId(currentItems, itemId)
          if (!serverItemId) {
            return false
          }

          set({ cartLoading: true, cartError: null })
          try {
            let summary = await removeServerCartItem(serverItemId)
            const activePromo = get().authPromoCode
            if (activePromo) {
              if (summary.itemCount === 0) {
                set({ authPromoCode: null })
              } else {
                try {
                  summary = await fetchServerCart(activePromo)
                } catch {
                  set({ authPromoCode: null })
                }
              }
            }
            get().upsertCatalogProducts(summary.items.map((i) => i.product))
            set({
              authCartSummary: summary,
              cart: summary.items,
              promoCode: summary.promoCode,
              promoPercent: summary.promoPercent,
              cartLoading: false,
              cartError: null,
            })
            return true
          } catch (err) {
            const msg = extractMessage(
              err,
              locale === 'fa'
                ? 'خطا در حذف آیتم از سبد خرید'
                : 'Unable to remove item'
            )
            set({ cartLoading: false, cartError: msg })
            get().pushToast({ title: msg, type: 'error' })
            return false
          }
        }

        const nextGuest = get().guestCart.filter((item) => item.id !== itemId)
        set((state) => ({
          guestCart: nextGuest,
          cart: nextGuest,
          pendingCartMergeIntents: pruneMergeIntentsForGuestCart(
            state.pendingCartMergeIntents,
            nextGuest
          ),
          cartError: null,
        }))
        return true
      },

      clearCart: async () => {
        const locale = get().locale
        if (get().user && getInMemoryAccessToken()) {
          set({ cartLoading: true, cartError: null })
          try {
            await clearServerCart()
            set({ authPromoCode: null })
            const emptySummary = await fetchServerCart(null)
            set({
              authCartSummary: emptySummary,
              cart: emptySummary.items,
              promoCode: null,
              promoPercent: 0,
              cartLoading: false,
              cartError: null,
            })
            return true
          } catch (err) {
            const msg = extractMessage(
              err,
              locale === 'fa'
                ? 'خطا در خالی کردن سبد خرید'
                : 'Unable to clear bag'
            )
            set({ cartLoading: false, cartError: msg })
            get().pushToast({ title: msg, type: 'error' })
            return false
          }
        }

        set({
          guestCart: [],
          cart: [],
          pendingCartMergeIntents: {},
          promoCode: null,
          promoPercent: 0,
          cartError: null,
        })
        return true
      },

      promoCode: null,
      promoPercent: 0,

      applyPromoCode: async (code) => {
        const locale = get().locale
        const trimmed = code.trim()
        if (!trimmed) {
          return {
            ok: false,
            error:
              locale === 'fa'
                ? 'کد تخفیف را وارد کنید'
                : 'Please enter a promo code',
          }
        }

        // Never fake-validate guest promo codes on the client
        if (!get().user || !getInMemoryAccessToken()) {
          const msg =
            locale === 'fa'
              ? 'برای بررسی و اعمال کد تخفیف، لطفاً وارد حساب کاربری شوید'
              : 'Please sign in to validate and apply a promo code'
          set({ cartError: msg })
          return { ok: false, error: msg }
        }

        set({ cartLoading: true, cartError: null })
        try {
          const summary = await applyServerCartPromo(trimmed)
          get().upsertCatalogProducts(summary.items.map((i) => i.product))
          set({
            authPromoCode: summary.promoCode,
            authCartSummary: summary,
            cart: summary.items,
            promoCode: summary.promoCode,
            promoPercent: summary.promoPercent,
            cartLoading: false,
            cartError: null,
          })
          return { ok: true }
        } catch (err) {
          // Preserve current cart intact when promo validation fails
          const msg = extractMessage(
            err,
            locale === 'fa' ? 'کد تخفیف معتبر نیست' : 'Invalid promo code'
          )
          set({ cartLoading: false, cartError: msg })
          return { ok: false, error: msg }
        }
      },

      removePromoCode: async () => {
        set({
          authPromoCode: null,
          promoCode: null,
          promoPercent: 0,
          cartError: null,
        })
        if (get().user && getInMemoryAccessToken()) {
          set({ cartLoading: true })
          try {
            const summary = await fetchServerCart(null)
            set({
              authCartSummary: summary,
              cart: summary.items,
              promoCode: summary.promoCode,
              promoPercent: summary.promoPercent,
              cartLoading: false,
            })
          } catch (err) {
            set({
              cartLoading: false,
              cartError: extractMessage(err, 'Unable to recalculate cart'),
            })
          }
        }
      },

      wishlistIds: [],
      guestWishlistIds: [],
      authWishlistIds: [],
      authWishlistProducts: [],
      wishlistLoading: false,
      wishlistError: null,

      loadServerWishlist: async () => {
        if (!get().user || !getInMemoryAccessToken()) {
          return []
        }
        set({ wishlistLoading: true, wishlistError: null })
        try {
          const items = await fetchServerWishlist()
          const ids = items.map((p) => p.id)
          get().upsertCatalogProducts(items)
          set({
            authWishlistProducts: items,
            authWishlistIds: ids,
            wishlistIds: ids,
            wishlistLoading: false,
            wishlistError: null,
          })
          return items
        } catch (err) {
          const msg = extractMessage(err, 'Unable to load wishlist')
          set({ wishlistLoading: false, wishlistError: msg })
          return []
        }
      },

      toggleWishlist: async (productId, productHint) => {
        if (!Number.isInteger(productId) || productId <= 0) {
          return false
        }
        if (inFlightWishlistProductIds.has(productId)) {
          return false
        }

        const locale = get().locale
        const knownProduct =
          productHint || get().products.find((p) => p.id === productId)

        // Authenticated Path — Server-backed wishlist
        if (get().user && getInMemoryAccessToken()) {
          inFlightWishlistProductIds.add(productId)
          set({ wishlistLoading: true, wishlistError: null })
          const currentlySaved = get().authWishlistIds.includes(productId)
          try {
            if (currentlySaved) {
              try {
                await removeServerWishlistItem(productId)
              } catch (remErr) {
                if (!(remErr instanceof ApiError && remErr.status === 404)) {
                  throw remErr
                }
              }
            } else {
              await addServerWishlistItem(productId)
            }

            const freshItems = await fetchServerWishlist()
            const freshIds = freshItems.map((p) => p.id)
            get().upsertCatalogProducts(freshItems)
            set({
              authWishlistProducts: freshItems,
              authWishlistIds: freshIds,
              wishlistIds: freshIds,
              wishlistLoading: false,
              wishlistError: null,
            })

            const displayProduct =
              knownProduct || freshItems.find((p) => p.id === productId)
            get().pushToast({
              title: currentlySaved
                ? locale === 'fa'
                  ? 'از لیست علاقه‌مندی‌ها حذف شد'
                  : 'Removed from wishlist'
                : locale === 'fa'
                ? 'به لیست علاقه‌مندی‌ها اضافه شد'
                : 'Saved to wishlist',
              description: displayProduct
                ? locale === 'fa'
                  ? displayProduct.name_fa
                  : displayProduct.name
                : undefined,
              type: 'info',
            })
            return true
          } catch (err) {
            const msg = extractMessage(
              err,
              locale === 'fa'
                ? 'خطا در بروزرسانی لیست علاقه‌مندی‌ها'
                : 'Unable to update wishlist'
            )
            set({ wishlistLoading: false, wishlistError: msg })
            get().pushToast({ title: msg, type: 'error' })
            return false
          } finally {
            inFlightWishlistProductIds.delete(productId)
          }
        }

        // Guest Path — Local guest wishlist
        const exists = get().guestWishlistIds.includes(productId)
        const nextIds = exists
          ? get().guestWishlistIds.filter((id) => id !== productId)
          : [...get().guestWishlistIds, productId]

        set({
          guestWishlistIds: nextIds,
          wishlistIds: nextIds,
          wishlistError: null,
        })
        if (knownProduct) {
          get().pushToast({
            title: exists
              ? locale === 'fa'
                ? 'از لیست علاقه‌مندی‌ها حذف شد'
                : 'Removed from wishlist'
              : locale === 'fa'
              ? 'به لیست علاقه‌مندی‌ها اضافه شد'
              : 'Saved to wishlist',
            description:
              locale === 'fa' ? knownProduct.name_fa : knownProduct.name,
            type: 'info',
          })
        }
        return true
      },

      isInWishlist: (productId) => get().wishlistIds.includes(productId),

      syncAuthenticatedState: async () => {
        if (inFlightAccountSync) {
          return inFlightAccountSync
        }

        const currentUser = get().user
        if (!currentUser || !getInMemoryAccessToken()) {
          return
        }

        inFlightAccountSync = (async () => {
          set({
            cartLoading: true,
            wishlistLoading: true,
            cartError: null,
            wishlistError: null,
            mergeError: null,
          })

          const mergeWarnings: string[] = []
          let serverCart: ServerCartSummary | null = null
          let serverWishlist: Product[] | null = null

          // 1. Load current server cart & server wishlist
          try {
            serverCart = await fetchServerCart(get().authPromoCode)
          } catch (err) {
            if (
              get().authPromoCode &&
              err instanceof ApiError &&
              err.status < 500
            ) {
              set({ authPromoCode: null, promoCode: null, promoPercent: 0 })
              try {
                serverCart = await fetchServerCart(null)
              } catch (innerErr) {
                set({
                  cartError: extractMessage(innerErr, 'Unable to load cart'),
                })
              }
            } else {
              set({ cartError: extractMessage(err, 'Unable to load cart') })
            }
          }

          try {
            serverWishlist = await fetchServerWishlist()
          } catch (err) {
            set({
              wishlistError: extractMessage(
                err,
                'Unable to load wishlist'
              ),
            })
          }

          // 2. Idempotent Guest Cart Merge (only if serverCart baseline was loaded)
          if (serverCart && get().guestCart.length > 0) {
            const snapshotGuestCart = [...get().guestCart]
            let mutatedCart = false

            for (const guestItem of snapshotGuestCart) {
              const lineKey = buildCartLineIdentityKey(
                guestItem.product,
                guestItem.selectedColor,
                guestItem.selectedEdition
              )
              const intentKey = `${currentUser.id}::${lineKey}`

              const existingServerItem = serverCart.items.find(
                (si) =>
                  buildCartLineIdentityKey(
                    si.product,
                    si.selectedColor,
                    si.selectedEdition
                  ) === lineKey
              )
              const currentServerQty = existingServerItem
                ? existingServerItem.quantity
                : 0

              const existingIntent = get().pendingCartMergeIntents[intentKey]
              let effectiveGuestQtyToMerge = guestItem.quantity

              if (
                existingIntent &&
                existingIntent.userId === currentUser.id &&
                existingIntent.lineKey === lineKey &&
                currentServerQty === existingIntent.targetQuantity
              ) {
                // Prior merge mutation for this user + variant already committed on the server!
                const remainingDelta =
                  guestItem.quantity - existingIntent.guestQuantitySnapshot

                if (remainingDelta <= 0) {
                  // Confirmed in reloaded serverCart: remove guest entry and clear intent without re-sending!
                  set((state) => {
                    const nextGuestCart = state.guestCart.filter(
                      (g) => g.id !== guestItem.id
                    )
                    const nextIntents = { ...state.pendingCartMergeIntents }
                    delete nextIntents[intentKey]
                    return {
                      guestCart: nextGuestCart,
                      pendingCartMergeIntents: pruneMergeIntentsForGuestCart(
                        nextIntents,
                        nextGuestCart
                      ),
                    }
                  })
                  continue
                }

                // Guest legitimately added extra units after the committed snapshot:
                // reconcile the confirmed portion out of guestCart before merging the remaining delta.
                effectiveGuestQtyToMerge = remainingDelta
                set((state) => ({
                  guestCart: state.guestCart.map((g) =>
                    g.id === guestItem.id
                      ? { ...g, quantity: remainingDelta }
                      : g
                  ),
                }))
              }

              const targetQty = currentServerQty + effectiveGuestQtyToMerge

              // Durably persist merge intent BEFORE issuing the server POST/PATCH
              const nextIntent: PendingCartMergeIntent = {
                userId: currentUser.id,
                lineKey,
                baselineServerQuantity: currentServerQty,
                guestQuantitySnapshot: effectiveGuestQtyToMerge,
                targetQuantity: targetQty,
              }
              set((state) => ({
                pendingCartMergeIntents: {
                  ...state.pendingCartMergeIntents,
                  [intentKey]: nextIntent,
                },
              }))

              try {
                if (existingServerItem && existingServerItem.serverItemId) {
                  if (existingServerItem.quantity !== targetQty) {
                    serverCart = await updateServerCartItemQuantity(
                      existingServerItem.serverItemId,
                      targetQty
                    )
                    mutatedCart = true
                  }
                } else {
                  const colorPayload =
                    guestItem.selectedColor &&
                    guestItem.selectedColor.id !== DEFAULT_ALUMINUM_FINISH.id
                      ? {
                          id: guestItem.selectedColor.id,
                          name: guestItem.selectedColor.name,
                          name_fa: guestItem.selectedColor.name_fa,
                          hex: guestItem.selectedColor.hex,
                          accentHex: guestItem.selectedColor.accentHex,
                        }
                      : null

                  serverCart = await addServerCartItem({
                    product_id: guestItem.product.id,
                    quantity: targetQty,
                    selected_color: colorPayload,
                    selected_edition:
                      guestItem.selectedEdition === 'default'
                        ? null
                        : guestItem.selectedEdition ?? null,
                  })
                  mutatedCart = true
                }

                // Confirmed on server: remove ONLY this guest cart entry and clear its merge intent
                set((state) => {
                  const nextGuestCart = state.guestCart.filter(
                    (g) => g.id !== guestItem.id
                  )
                  const nextIntents = { ...state.pendingCartMergeIntents }
                  delete nextIntents[intentKey]
                  return {
                    guestCart: nextGuestCart,
                    pendingCartMergeIntents: pruneMergeIntentsForGuestCart(
                      nextIntents,
                      nextGuestCart
                    ),
                  }
                })
              } catch (mergeErr) {
                // Deterministic 4xx validation error means server did NOT commit;
                // clear durable intent so future edits recalculate cleanly, while preserving guest item!
                if (
                  mergeErr instanceof ApiError &&
                  mergeErr.status >= 400 &&
                  mergeErr.status < 500
                ) {
                  set((state) => {
                    const nextIntents = { ...state.pendingCartMergeIntents }
                    delete nextIntents[intentKey]
                    return { pendingCartMergeIntents: nextIntents }
                  })
                }
                mergeWarnings.push(
                  extractMessage(
                    mergeErr,
                    `Could not merge ${guestItem.product.name}`
                  )
                )
              }
            }

            // Reload authoritative server cart after mutations
            if (mutatedCart) {
              try {
                serverCart = await fetchServerCart(get().authPromoCode)
              } catch {
                // Keep latest `serverCart` returned by last successful mutation if reload fails
              }
            }
          }

          // 3. Idempotent Guest Wishlist Merge (only if serverWishlist baseline was loaded)
          if (serverWishlist && get().guestWishlistIds.length > 0) {
            const existingWishSet = new Set(serverWishlist.map((p) => p.id))
            const snapshotWishIds = [...get().guestWishlistIds]
            let mutatedWishlist = false

            for (const prodId of snapshotWishIds) {
              try {
                if (!existingWishSet.has(prodId)) {
                  await addServerWishlistItem(prodId)
                  mutatedWishlist = true
                }
                set((state) => ({
                  guestWishlistIds: state.guestWishlistIds.filter(
                    (id) => id !== prodId
                  ),
                }))
              } catch (wishErr) {
                mergeWarnings.push(
                  extractMessage(
                    wishErr,
                    `Could not merge wishlist item #${prodId}`
                  )
                )
              }
            }

            if (mutatedWishlist) {
              try {
                serverWishlist = await fetchServerWishlist()
              } catch {
                // Preserve baseline if reload fails
              }
            }
          }

          // 4. Commit authoritative server state if user is still authenticated
          if (!get().user || get().user?.id !== currentUser.id) {
            set({ cartLoading: false, wishlistLoading: false })
            return
          }

          const catalogBatch: Product[] = []
          if (serverCart) {
            catalogBatch.push(...serverCart.items.map((i) => i.product))
          }
          if (serverWishlist) {
            catalogBatch.push(...serverWishlist)
          }
          if (catalogBatch.length > 0) {
            get().upsertCatalogProducts(catalogBatch)
          }

          set((state) => ({
            authCartSummary: serverCart ?? state.authCartSummary,
            cart: serverCart ? serverCart.items : state.authCartSummary?.items || [],
            promoCode: serverCart ? serverCart.promoCode : state.promoCode,
            promoPercent: serverCart
              ? serverCart.promoPercent
              : state.promoPercent,
            authWishlistProducts: serverWishlist ?? state.authWishlistProducts,
            authWishlistIds: serverWishlist
              ? serverWishlist.map((p) => p.id)
              : state.authWishlistIds,
            wishlistIds: serverWishlist
              ? serverWishlist.map((p) => p.id)
              : state.authWishlistIds,
            cartLoading: false,
            wishlistLoading: false,
            mergeError:
              mergeWarnings.length > 0 ? mergeWarnings.join(' • ') : null,
          }))

          if (mergeWarnings.length > 0) {
            const locale = get().locale
            get().pushToast({
              title:
                locale === 'fa'
                  ? 'برخی اقلام مهمان به دلیل محدودیت موجودی منتقل نشدند'
                  : 'Some guest items could not be merged',
              description: mergeWarnings[0],
              type: 'error',
            })
          }
        })()

        try {
          await inFlightAccountSync
        } finally {
          inFlightAccountSync = null
        }
      },

      quickViewProduct: null,
      setQuickViewProduct: (product) => set({ quickViewProduct: product }),

      orders: [],
      authOrders: [],
      ordersLoading: false,
      ordersError: null,
      orderSubmitting: false,
      orderSubmitError: null,
      pendingCheckoutAttempt: null,

      loadServerOrders: async () => {
        const { user } = get()
        if (!user || !getInMemoryAccessToken()) {
          set({ authOrders: [], ordersLoading: false })
          return []
        }
        set({ ordersLoading: true, ordersError: null })
        try {
          const orders = await fetchServerOrders()
          if (get().user?.id === user.id) {
            set({
              authOrders: orders,
              ordersLoading: false,
              ordersError: null,
            })
          }
          return orders
        } catch (err) {
          const msg = extractMessage(
            err,
            get().locale === 'fa'
              ? 'امکان دریافت فهرست سفارش‌ها وجود ندارد'
              : 'Unable to load orders'
          )
          set({ ordersLoading: false, ordersError: msg })
          return get().authOrders
        }
      },

      submitCheckoutOrder: async (rawPayload) => {
        const locale = get().locale
        if (inFlightOrderSubmission || get().orderSubmitting) {
          return {
            ok: false,
            error:
              locale === 'fa'
                ? 'درخواست ثبت سفارش در حال ارسال است. لطفاً شکیبا باشید.'
                : 'Order submission is already in progress. Please wait.',
          }
        }

        const currentUser = get().user
        if (!currentUser || !getInMemoryAccessToken()) {
          const authMsg =
            locale === 'fa'
              ? 'برای ثبت سفارش ابتدا وارد حساب کاربری خود شوید.'
              : 'Please sign in to submit your order.'
          set({ orderSubmitError: authMsg })
          return {
            ok: false,
            requiresAuth: true,
            error: authMsg,
          }
        }

        const effectivePromo =
          rawPayload.promo_code !== undefined
            ? rawPayload.promo_code
            : get().authPromoCode ?? get().promoCode ?? null

        const cleanPayload: CreateOrderPayload = {
          customer_name: (rawPayload.customer_name || '').trim(),
          customer_phone: rawPayload.customer_phone?.trim() || null,
          shipping_address: (rawPayload.shipping_address || '').trim(),
          postal_code: rawPayload.postal_code?.trim() || null,
          notes: rawPayload.notes?.trim() || null,
          promo_code: effectivePromo?.trim() || null,
        }

        if (cleanPayload.customer_name.length < 2) {
          const msg =
            locale === 'fa'
              ? 'نام و نام خانوادگی تحویل‌گیرنده را وارد کنید.'
              : 'Please enter the recipient full name.'
          set({ orderSubmitError: msg })
          return { ok: false, error: msg }
        }
        if (cleanPayload.shipping_address.length < 5) {
          const msg =
            locale === 'fa'
              ? 'نشانی کامل تحویل را وارد کنید.'
              : 'Please enter a complete shipping address.'
          set({ orderSubmitError: msg })
          return { ok: false, error: msg }
        }

        const currentItems = get().authCartSummary?.items || []
        const payloadFingerprint =
          computeCheckoutPayloadFingerprint(cleanPayload)
        const cartFingerprint = computeCheckoutCartFingerprint(currentItems)

        const existingAttempt = get().pendingCheckoutAttempt
        const canReuseExistingKey =
          existingAttempt !== null &&
          existingAttempt.userId === currentUser.id &&
          existingAttempt.payloadFingerprint === payloadFingerprint &&
          (existingAttempt.cartFingerprint === cartFingerprint ||
            currentItems.length === 0)

        if (!canReuseExistingKey && currentItems.length === 0) {
          const emptyMsg =
            locale === 'fa'
              ? 'سبد خرید شما خالی است و امکان ثبت سفارش وجود ندارد.'
              : 'Cannot place an order with an empty bag.'
          set({ orderSubmitError: emptyMsg })
          return { ok: false, error: emptyMsg }
        }

        const idempotencyKey = canReuseExistingKey
          ? existingAttempt.idempotencyKey
          : generateCheckoutIdempotencyKey()

        const nextAttempt: PendingCheckoutAttempt = {
          userId: currentUser.id,
          idempotencyKey,
          payloadFingerprint,
          cartFingerprint: canReuseExistingKey
            ? existingAttempt.cartFingerprint
            : cartFingerprint,
        }

        // Persist non-PII attempt metadata BEFORE issuing POST /orders/ so retries
        // across network interruptions or page reloads reuse the exact same Idempotency-Key.
        set({
          pendingCheckoutAttempt: nextAttempt,
          orderSubmitting: true,
          orderSubmitError: null,
        })

        inFlightOrderSubmission = (async (): Promise<OrderSubmitResult> => {
          try {
            const createdOrder = await createServerOrder(
              cleanPayload,
              idempotencyKey
            )

            // Definitive success: clear pendingCheckoutAttempt & promo state, update orders, and sync authoritative server cart/orders
            set((state) => {
              const dedupedOrders = [
                createdOrder,
                ...state.authOrders.filter((o) => o.id !== createdOrder.id),
              ]
              return {
                pendingCheckoutAttempt: null,
                orderSubmitting: false,
                orderSubmitError: null,
                authPromoCode: null,
                promoCode: null,
                promoPercent: 0,
                authOrders: dedupedOrders,
                authCartSummary: {
                  items: [],
                  itemCount: 0,
                  subtotalUsd: 0,
                  subtotalToman: 0,
                  discountUsd: 0,
                  discountToman: 0,
                  totalUsd: 0,
                  totalToman: 0,
                  promoCode: null,
                  promoPercent: 0,
                },
                cart: [],
              }
            })

            await Promise.all([
              get().loadServerCart(),
              get().loadServerOrders(),
            ])

            return { ok: true, order: createdOrder }
          } catch (err) {
            const msg = extractMessage(
              err,
              locale === 'fa'
                ? 'ثبت سفارش با خطا مواجه شد. سبد خرید شما بدون تغییر حفظ شده است.'
                : 'Order submission failed. Your shopping bag remains unchanged.'
            )

            // Definitive 4xx (validation / empty cart / 409 conflict): clear attempt key so user's next fixed submission gets a fresh key.
            // Network timeout or 5xx: preserve pendingCheckoutAttempt so retrying reuses the exact same Idempotency-Key!
            const shouldClearAttempt =
              err instanceof ApiError && err.status >= 400 && err.status < 500

            set((state) => ({
              orderSubmitting: false,
              orderSubmitError: msg,
              pendingCheckoutAttempt: shouldClearAttempt
                ? null
                : state.pendingCheckoutAttempt,
            }))
            get().pushToast({ title: msg, type: 'error' })
            return { ok: false, error: msg }
          } finally {
            inFlightOrderSubmission = null
          }
        })()

        return inFlightOrderSubmission
      },

      placeOrder: () => {
        throw new Error(
          'Simulated client-side order placement is disabled; use submitCheckoutOrder via backend API.'
        )
      },
      updateOrderStatus: (orderId, status) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status } : o
          ),
        })),

      user: null,
      authStatus: 'idle',
      hasSessionHint: false,

      loginUser: async (emailOrUsername, password) => {
        set({ authStatus: 'loading' })
        try {
          const { user } = await aruApi.auth.login(emailOrUsername, password)
          set((state) => ({
            user,
            authStatus: 'authenticated',
            hasSessionHint: true,
            authOrders: [],
            ordersError: null,
            pendingCheckoutAttempt:
              state.pendingCheckoutAttempt?.userId === user.id
                ? state.pendingCheckoutAttempt
                : null,
          }))
          await get().syncAuthenticatedState()
          return user
        } catch (err) {
          clearInMemoryAccessToken()
          set((state) => ({
            user: null,
            authStatus: 'unauthenticated',
            hasSessionHint: false,
            authCartSummary: null,
            authPromoCode: null,
            authWishlistProducts: [],
            authWishlistIds: [],
            authOrders: [],
            ordersError: null,
            cart: state.guestCart,
            wishlistIds: state.guestWishlistIds,
          }))
          throw err
        }
      },

      registerUser: async (data) => {
        set({ authStatus: 'loading' })
        try {
          const { user } = await aruApi.auth.register(data)
          set({
            user,
            authStatus: 'authenticated',
            hasSessionHint: true,
            authOrders: [],
            ordersError: null,
            pendingCheckoutAttempt: null,
          })
          await get().syncAuthenticatedState()
          return user
        } catch (err) {
          clearInMemoryAccessToken()
          set((state) => ({
            user: null,
            authStatus: 'unauthenticated',
            hasSessionHint: false,
            authCartSummary: null,
            authPromoCode: null,
            authWishlistProducts: [],
            authWishlistIds: [],
            authOrders: [],
            ordersError: null,
            cart: state.guestCart,
            wishlistIds: state.guestWishlistIds,
          }))
          throw err
        }
      },

      logoutUser: async () => {
        await aruApi.auth.logout()
        inFlightWishlistProductIds.clear()
        inFlightOrderSubmission = null
        set({
          user: null,
          authStatus: 'unauthenticated',
          hasSessionHint: false,
          authCartSummary: null,
          authPromoCode: null,
          authWishlistProducts: [],
          authWishlistIds: [],
          authOrders: [],
          ordersLoading: false,
          ordersError: null,
          orderSubmitting: false,
          orderSubmitError: null,
          pendingCheckoutAttempt: null,
          guestCart: [],
          guestWishlistIds: [],
          pendingCartMergeIntents: {},
          cart: [],
          wishlistIds: [],
          promoCode: null,
          promoPercent: 0,
          cartError: null,
          wishlistError: null,
          mergeError: null,
        })
      },

      bootstrapAuth: async (forceServerCheck = false) => {
        if (inFlightBootstrap) {
          return inFlightBootstrap
        }

        const { user, hasSessionHint, authStatus } = get()
        if (!forceServerCheck && user && getInMemoryAccessToken()) {
          if (authStatus !== 'authenticated') {
            set({ authStatus: 'authenticated' })
          }
          if (!get().authCartSummary) {
            await get().syncAuthenticatedState()
          }
          return user
        }

        if (!forceServerCheck && !hasSessionHint && !getInMemoryAccessToken()) {
          set((state) => ({
            user: null,
            authStatus: 'unauthenticated',
            cart: state.guestCart,
            wishlistIds: state.guestWishlistIds,
          }))
          return null
        }

        set({ authStatus: 'loading' })
        inFlightBootstrap = (async () => {
          try {
            if (getInMemoryAccessToken()) {
              const verified = await aruApi.users.me()
              set({
                user: verified,
                authStatus: 'authenticated',
                hasSessionHint: true,
              })
              await get().syncAuthenticatedState()
              return verified
            }

            const refreshed = await aruApi.auth.refresh()
            if (refreshed) {
              set({
                user: refreshed,
                authStatus: 'authenticated',
                hasSessionHint: true,
              })
              await get().syncAuthenticatedState()
              return refreshed
            }

            set((state) => ({
              user: null,
              authStatus: 'unauthenticated',
              hasSessionHint: false,
              authCartSummary: null,
              authPromoCode: null,
              authWishlistProducts: [],
              authWishlistIds: [],
              cart: state.guestCart,
              wishlistIds: state.guestWishlistIds,
            }))
            return null
          } catch {
            clearInMemoryAccessToken()
            set((state) => ({
              user: null,
              authStatus: 'unauthenticated',
              hasSessionHint: false,
              authCartSummary: null,
              authPromoCode: null,
              authWishlistProducts: [],
              authWishlistIds: [],
              cart: state.guestCart,
              wishlistIds: state.guestWishlistIds,
            }))
            return null
          } finally {
            inFlightBootstrap = null
          }
        })()

        return inFlightBootstrap
      },

      verifyAdminAccess: async () => {
        set({ authStatus: 'loading' })
        try {
          if (!getInMemoryAccessToken()) {
            const refreshed = await aruApi.auth.refresh()
            if (!refreshed || !getInMemoryAccessToken()) {
              set((state) => ({
                user: null,
                authStatus: 'unauthenticated',
                hasSessionHint: false,
                authCartSummary: null,
                authWishlistProducts: [],
                authWishlistIds: [],
                cart: state.guestCart,
                wishlistIds: state.guestWishlistIds,
              }))
              return 'unauthenticated'
            }
          }

          // Authoritative server-side verification: never trust cached role state.
          const verifiedUser = await aruApi.users.me()
          set({
            user: verifiedUser,
            authStatus: 'authenticated',
            hasSessionHint: true,
          })
          return verifiedUser.is_admin ? 'authorized' : 'forbidden'
        } catch (err) {
          if (err instanceof ApiError && err.status === 403) {
            return 'forbidden'
          }
          clearInMemoryAccessToken()
          set((state) => ({
            user: null,
            authStatus: 'unauthenticated',
            hasSessionHint: false,
            authCartSummary: null,
            authWishlistProducts: [],
            authWishlistIds: [],
            cart: state.guestCart,
            wishlistIds: state.guestWishlistIds,
          }))
          return 'unauthenticated'
        }
      },

      toasts: [],
      pushToast: (toast) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        set((state) => ({
          toasts: [...state.toasts.slice(-3), { ...toast, id }],
        }))
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id),
          }))
        }, 3600)
      },
      dismissToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'arustore-aluminum-v3',
      version: 3,
      migrate: (persistedState, version) =>
        migratePersistedStoreState(persistedState, version),
      partialize: (state): PersistedAppSlice => ({
        locale: state.locale,
        hasSessionHint: state.hasSessionHint,
        guestCart: state.guestCart,
        guestWishlistIds: state.guestWishlistIds,
        pendingCartMergeIntents: state.pendingCartMergeIntents,
        pendingCheckoutAttempt: state.pendingCheckoutAttempt,
        // Never persist server orders or demo orders into localStorage
        orders: [],
      }),
      merge: (persistedState, currentState) => {
        const raw =
          persistedState && typeof persistedState === 'object'
            ? (persistedState as Record<string, unknown>)
            : {}
        const hydratedGuestCart = sanitizePersistedGuestCart(
          raw.guestCart ?? raw.cart
        )
        const hydratedGuestWishlistIds = sanitizePersistedGuestWishlistIds(
          raw.guestWishlistIds
        )
        const hydratedMergeIntents = sanitizePersistedMergeIntents(
          raw.pendingCartMergeIntents,
          hydratedGuestCart
        )
        const hydratedCheckoutAttempt = sanitizePersistedCheckoutAttempt(
          raw.pendingCheckoutAttempt
        )
        return {
          ...currentState,
          locale: raw.locale === 'en' ? 'en' : currentState.locale,
          hasSessionHint: Boolean(raw.hasSessionHint),
          guestCart: hydratedGuestCart,
          guestWishlistIds: hydratedGuestWishlistIds,
          pendingCartMergeIntents: hydratedMergeIntents,
          pendingCheckoutAttempt: hydratedCheckoutAttempt,
          cart: hydratedGuestCart,
          wishlistIds: hydratedGuestWishlistIds,
          orders: sanitizePersistedOrders(raw.orders),
          // Never hydrate `user`, `is_admin`, or authenticated server cart/wishlist/orders from localStorage.
          user: null,
          authStatus: 'idle',
          authCartSummary: null,
          authPromoCode: null,
          authWishlistProducts: [],
          authWishlistIds: [],
          authOrders: [],
          ordersLoading: false,
          ordersError: null,
          orderSubmitting: false,
          orderSubmitError: null,
          promoCode: null,
          promoPercent: 0,
        }
      },
    }
  )
)

registerAuthSyncCallbacks({
  onUserUpdated: (user) => {
    useStore.setState({
      user,
      authStatus: 'authenticated',
      hasSessionHint: true,
    })
  },
  onSessionCleared: () => {
    useStore.setState((state) => ({
      user: null,
      authStatus: 'unauthenticated',
      hasSessionHint: false,
      authCartSummary: null,
      authPromoCode: null,
      authWishlistProducts: [],
      authWishlistIds: [],
      authOrders: [],
      ordersLoading: false,
      ordersError: null,
      orderSubmitting: false,
      orderSubmitError: null,
      pendingCheckoutAttempt: null,
      cart: state.guestCart,
      wishlistIds: state.guestWishlistIds,
      promoCode: null,
      promoPercent: 0,
    }))
  },
})
