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
import { INITIAL_ORDERS, PRODUCTS } from '@/lib/data/catalog'

export interface ToastMessage {
  id: string
  title: string
  description?: string
  type: 'success' | 'info' | 'error'
}

interface AppState {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLocale: () => void

  products: Product[]
  addProductReview: (productId: number, review: Omit<ProductReview, 'id' | 'created_at'>) => void
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
  loginDemoUser: (asAdmin?: boolean, customName?: string, customEmail?: string) => void
  logoutUser: () => void

  toasts: ToastMessage[]
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void
  dismissToast: (id: string) => void
}

const DEFAULT_USER: UserProfile = {
  id: 1,
  full_name: 'آرین رادمهر',
  email: 'arian@arustore.io',
  phone: '09123456789',
  is_admin: true,
  member_since: '2025',
  loyalty_tier: 'Titanium VIP',
  loyalty_points: 4850,
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      locale: 'fa',
      setLocale: (locale) => set({ locale }),
      toggleLocale: () =>
        set((state) => ({ locale: state.locale === 'fa' ? 'en' : 'fa' })),

      products: PRODUCTS,
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

      cart: [
        {
          id: '1-silver-champagne-3-tier',
          product: PRODUCTS[0],
          quantity: 1,
          selectedColor: PRODUCTS[0].colors[0],
          selectedEdition: '3-tier',
        },
      ],
      isCartDrawerOpen: false,
      setCartDrawerOpen: (open) => set({ isCartDrawerOpen: open }),

      addToCart: (product, quantity = 1, color, edition) => {
        const chosenColor = color || product.colors[0]
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

      orders: INITIAL_ORDERS,
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

      user: DEFAULT_USER,
      loginDemoUser: (asAdmin = true, customName, customEmail) =>
        set({
          user: {
            ...DEFAULT_USER,
            is_admin: asAdmin,
            full_name: customName || DEFAULT_USER.full_name,
            email: customEmail || DEFAULT_USER.email,
          },
        }),
      logoutUser: () => set({ user: null }),

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
      partialize: (state) => ({
        locale: state.locale,
        cart: state.cart,
        wishlistIds: state.wishlistIds,
        orders: state.orders,
        user: state.user,
        promoCode: state.promoCode,
        promoPercent: state.promoPercent,
      }),
    }
  )
)
