'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  CartItemType,
  Locale,
  Order,
  Product,
  ProductColorOption,
  ProductReview,
  UserProfile,
} from '@/types'
import { DEFAULT_ALUMINUM_FINISH } from '@/lib/data/catalog'
import {
  ApiError,
  aruApi,
  clearInMemoryAccessToken,
  getInMemoryAccessToken,
  registerAuthSyncCallbacks,
} from '@/lib/api/client'

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

export interface ToastMessage {
  id: string
  title: string
  description?: string
  type: 'success' | 'info' | 'error'
}

const LEGACY_DEMO_ORDER_IDS = new Set(['ord-1001', 'ord-1002'])
const LEGACY_DEMO_ORDER_NUMBERS = new Set(['ARU-84920', 'ARU-85104'])

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

export interface PersistedAppSlice {
  locale: Locale
  hasSessionHint: boolean
  cart: CartItemType[]
  wishlistIds: number[]
  orders: Order[]
  promoCode: string | null
  promoPercent: number
}

export function migratePersistedStoreState(
  persistedState: unknown,
  version: number
): Partial<PersistedAppSlice> {
  if (!persistedState || typeof persistedState !== 'object') {
    return {
      locale: 'fa',
      hasSessionHint: false,
      orders: [],
    }
  }

  const raw = persistedState as Record<string, unknown>
  const preservedLocale: Locale = raw.locale === 'en' ? 'en' : 'fa'
  const cleanedOrders = sanitizePersistedOrders(raw.orders)

  // Version < 2 may hold legacy demo admin state (`DEFAULT_USER`, `INITIAL_ORDERS`).
  // Discard any persisted `user` / tokens / demo orders while preserving UI preferences.
  const migrated: Partial<PersistedAppSlice> = {
    locale: preservedLocale,
    hasSessionHint: version >= 2 ? Boolean(raw.hasSessionHint) : false,
    orders: cleanedOrders,
  }

  if (Array.isArray(raw.cart)) {
    migrated.cart = raw.cart as CartItemType[]
  }
  if (Array.isArray(raw.wishlistIds)) {
    migrated.wishlistIds = raw.wishlistIds.filter(
      (id): id is number => typeof id === 'number'
    )
  }
  if (typeof raw.promoCode === 'string' || raw.promoCode === null) {
    migrated.promoCode = raw.promoCode
  }
  if (typeof raw.promoPercent === 'number') {
    migrated.promoPercent = raw.promoPercent
  }

  return migrated
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

  cart: CartItemType[]
  isCartDrawerOpen: boolean
  setCartDrawerOpen: (open: boolean) => void
  addToCart: (
    product: Product,
    quantity?: number,
    color?: ProductColorOption,
    edition?: string
  ) => void
  removeFromCart: (itemId: string) => void
  updateCartQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void

  promoCode: string | null
  promoPercent: number
  applyPromoCode: (code: string) => boolean
  removePromoCode: () => void

  wishlistIds: number[]
  toggleWishlist: (productId: number) => void
  isInWishlist: (productId: number) => boolean

  quickViewProduct: Product | null
  setQuickViewProduct: (product: Product | null) => void

  orders: Order[]
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
              ((p.rating_avg * p.rating_count + reviewData.rating) / newCount).toFixed(2)
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
            p.id === productId ? { ...p, stock_quantity: Math.max(0, stock) } : p
          ),
        })),

      cart: [],
      isCartDrawerOpen: false,
      setCartDrawerOpen: (open) => set({ isCartDrawerOpen: open }),

      addToCart: (product, quantity = 1, color, edition) => {
        const chosenColor = color || product.colors[0] || DEFAULT_ALUMINUM_FINISH
        const chosenEdition = edition || product.editions?.[0]?.id || 'default'
        const itemId = `${product.id}-${chosenColor.id}-${chosenEdition}`

        set((state) => {
          const existing = state.cart.find((item) => item.id === itemId)
          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.id === itemId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
              isCartDrawerOpen: true,
            }
          }
          return {
            cart: [
              ...state.cart,
              {
                id: itemId,
                product,
                quantity,
                selectedColor: chosenColor,
                selectedEdition: chosenEdition,
              },
            ],
            isCartDrawerOpen: true,
          }
        })

        const locale = get().locale
        get().pushToast({
          title:
            locale === 'fa'
              ? `${product.name_fa} به سبد خرید اضافه شد`
              : `${product.name} added to bag`,
          description:
            locale === 'fa' ? chosenColor.name_fa : chosenColor.name,
          type: 'success',
        })
      },

      removeFromCart: (itemId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== itemId),
        })),

      updateCartQuantity: (itemId, quantity) =>
        set((state) => ({
          cart:
            quantity <= 0
              ? state.cart.filter((item) => item.id !== itemId)
              : state.cart.map((item) =>
                  item.id === itemId ? { ...item, quantity } : item
                ),
        })),

      clearCart: () => set({ cart: [], promoCode: null, promoPercent: 0 }),

      promoCode: null,
      promoPercent: 0,
      applyPromoCode: (code) => {
        const normalized = code.trim().toUpperCase()
        const validCodes: Record<string, number> = {
          ARU3D: 15,
          VIP20: 20,
          WELCOME10: 10,
        }
        if (validCodes[normalized]) {
          set({ promoCode: normalized, promoPercent: validCodes[normalized] })
          return true
        }
        return false
      },
      removePromoCode: () => set({ promoCode: null, promoPercent: 0 }),

      wishlistIds: [2, 4],
      toggleWishlist: (productId) => {
        const exists = get().wishlistIds.includes(productId)
        const product = get().products.find((p) => p.id === productId)
        set((state) => ({
          wishlistIds: exists
            ? state.wishlistIds.filter((id) => id !== productId)
            : [...state.wishlistIds, productId],
        }))
        if (product) {
          const locale = get().locale
          get().pushToast({
            title: exists
              ? locale === 'fa'
                ? 'از لیست علاقه‌مندی‌ها حذف شد'
                : 'Removed from wishlist'
              : locale === 'fa'
              ? 'به لیست علاقه‌مندی‌ها اضافه شد'
              : 'Saved to wishlist',
            description: locale === 'fa' ? product.name_fa : product.name,
            type: 'info',
          })
        }
      },
      isInWishlist: (productId) => get().wishlistIds.includes(productId),

      quickViewProduct: null,
      setQuickViewProduct: (product) => set({ quickViewProduct: product }),

      orders: [],
      placeOrder: ({ customerName, shippingAddress }) => {
        const { cart, promoPercent, orders } = get()
        const factor = (100 - promoPercent) / 100
        const subtotalUsd = cart.reduce((acc, item) => {
          const ed = item.product.editions?.find((e) => e.id === item.selectedEdition)
          return acc + (item.product.price + (ed?.priceDelta || 0)) * item.quantity
        }, 0)
        const subtotalToman = cart.reduce((acc, item) => {
          const ed = item.product.editions?.find((e) => e.id === item.selectedEdition)
          return acc + (item.product.price_toman + (ed?.priceDeltaToman || 0)) * item.quantity
        }, 0)

        const newOrder: Order = {
          id: `ord-${Date.now()}`,
          orderNumber: `ARU-${Math.floor(86000 + Math.random() * 9000)}`,
          createdAt: new Date().toISOString().slice(0, 10),
          status: 'processing',
          total: Math.round(subtotalUsd * factor),
          total_toman: Math.round(subtotalToman * factor),
          shippingAddress,
          customerName,
          items: cart.map((item) => ({
            productId: item.product.id,
            name: item.product.name,
            name_fa: item.product.name_fa,
            image: item.product.images[0]?.url || '/images/products/tiered-stand.png',
            quantity: item.quantity,
            price: item.product.price,
            price_toman: item.product.price_toman,
            colorName: item.selectedColor.name,
            colorName_fa: item.selectedColor.name_fa,
          })),
        }

        set({
          orders: [newOrder, ...orders],
          cart: [],
          promoCode: null,
          promoPercent: 0,
        })
        return newOrder
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
          set({
            user,
            authStatus: 'authenticated',
            hasSessionHint: true,
          })
          return user
        } catch (err) {
          clearInMemoryAccessToken()
          set({
            user: null,
            authStatus: 'unauthenticated',
            hasSessionHint: false,
          })
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
          })
          return user
        } catch (err) {
          clearInMemoryAccessToken()
          set({
            user: null,
            authStatus: 'unauthenticated',
            hasSessionHint: false,
          })
          throw err
        }
      },

      logoutUser: async () => {
        await aruApi.auth.logout()
        set({
          user: null,
          authStatus: 'unauthenticated',
          hasSessionHint: false,
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
          return user
        }

        if (!forceServerCheck && !hasSessionHint && !getInMemoryAccessToken()) {
          set({ user: null, authStatus: 'unauthenticated' })
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
              return verified
            }

            const refreshed = await aruApi.auth.refresh()
            if (refreshed) {
              set({
                user: refreshed,
                authStatus: 'authenticated',
                hasSessionHint: true,
              })
              return refreshed
            }

            set({
              user: null,
              authStatus: 'unauthenticated',
              hasSessionHint: false,
            })
            return null
          } catch {
            clearInMemoryAccessToken()
            set({
              user: null,
              authStatus: 'unauthenticated',
              hasSessionHint: false,
            })
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
              set({
                user: null,
                authStatus: 'unauthenticated',
                hasSessionHint: false,
              })
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
          set({
            user: null,
            authStatus: 'unauthenticated',
            hasSessionHint: false,
          })
          return 'unauthenticated'
        }
      },

      toasts: [],
      pushToast: (toast) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        set((state) => ({ toasts: [...state.toasts.slice(-3), { ...toast, id }] }))
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
      version: 2,
      migrate: (persistedState, version) =>
        migratePersistedStoreState(persistedState, version),
      partialize: (state): PersistedAppSlice => ({
        locale: state.locale,
        hasSessionHint: state.hasSessionHint,
        cart: state.cart,
        wishlistIds: state.wishlistIds,
        orders: state.orders,
        promoCode: state.promoCode,
        promoPercent: state.promoPercent,
      }),
      merge: (persistedState, currentState) => {
        const raw =
          persistedState && typeof persistedState === 'object'
            ? (persistedState as Record<string, unknown>)
            : {}
        return {
          ...currentState,
          locale: raw.locale === 'en' ? 'en' : currentState.locale,
          hasSessionHint: Boolean(raw.hasSessionHint),
          cart: Array.isArray(raw.cart)
            ? (raw.cart as CartItemType[])
            : currentState.cart,
          wishlistIds: Array.isArray(raw.wishlistIds)
            ? raw.wishlistIds.filter(
                (id): id is number => typeof id === 'number'
              )
            : currentState.wishlistIds,
          orders: sanitizePersistedOrders(raw.orders),
          promoCode:
            typeof raw.promoCode === 'string' || raw.promoCode === null
              ? raw.promoCode
              : currentState.promoCode,
          promoPercent:
            typeof raw.promoPercent === 'number'
              ? raw.promoPercent
              : currentState.promoPercent,
          // Never hydrate `user` or `is_admin` from localStorage.
          user: null,
          authStatus: 'idle',
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
    useStore.setState({
      user: null,
      authStatus: 'unauthenticated',
      hasSessionHint: false,
    })
  },
})
