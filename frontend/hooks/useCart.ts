'use client'

import { useMemo } from 'react'
import { useStore } from '@/lib/store/useStore'
import { getCartItemLineTotals } from '@/lib/api/cart'

export function useCart() {
  const user = useStore((s) => s.user)
  const guestCart = useStore((s) => s.guestCart)
  const authCartSummary = useStore((s) => s.authCartSummary)
  const cartLoading = useStore((s) => s.cartLoading)
  const cartError = useStore((s) => s.cartError)
  const mergeError = useStore((s) => s.mergeError)
  const locale = useStore((s) => s.locale)
  const isCartDrawerOpen = useStore((s) => s.isCartDrawerOpen)
  const setCartDrawerOpen = useStore((s) => s.setCartDrawerOpen)
  const loadServerCart = useStore((s) => s.loadServerCart)
  const addToCart = useStore((s) => s.addToCart)
  const removeFromCart = useStore((s) => s.removeFromCart)
  const updateCartQuantity = useStore((s) => s.updateCartQuantity)
  const clearCart = useStore((s) => s.clearCart)
  const applyPromoCode = useStore((s) => s.applyPromoCode)
  const removePromoCode = useStore((s) => s.removePromoCode)

  const summary = useMemo(() => {
    // Authenticated users: backend CartSummaryResponse is strictly authoritative
    if (user && authCartSummary) {
      return {
        items: authCartSummary.items,
        itemCount: authCartSummary.itemCount,
        subtotalUsd: authCartSummary.subtotalUsd,
        subtotalToman: authCartSummary.subtotalToman,
        discountUsd: authCartSummary.discountUsd,
        discountToman: authCartSummary.discountToman,
        totalUsd: authCartSummary.totalUsd,
        totalToman: authCartSummary.totalToman,
        promoCode: authCartSummary.promoCode,
        promoPercent: authCartSummary.promoPercent,
        isAuthenticatedCart: true,
      }
    }

    // Authenticated user while initial server cart is still loading
    if (user && !authCartSummary) {
      return {
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
        isAuthenticatedCart: true,
      }
    }

    // Guest users: local guestCart using backend-loaded product & edition data, no fake promo
    let itemCount = 0
    let subtotalUsd = 0
    let subtotalToman = 0

    for (const item of guestCart) {
      itemCount += item.quantity
      const { lineUsd, lineToman } = getCartItemLineTotals(item)
      subtotalUsd += lineUsd
      subtotalToman += lineToman
    }

    const roundedSubtotalUsd = Number(subtotalUsd.toFixed(2))
    return {
      items: guestCart,
      itemCount,
      subtotalUsd: roundedSubtotalUsd,
      subtotalToman,
      discountUsd: 0,
      discountToman: 0,
      totalUsd: roundedSubtotalUsd,
      totalToman: subtotalToman,
      promoCode: null,
      promoPercent: 0,
      isAuthenticatedCart: false,
    }
  }, [user, authCartSummary, guestCart])

  return {
    cart: summary.items,
    ...summary,
    locale,
    cartLoading,
    cartError,
    mergeError,
    isCartDrawerOpen,
    setCartDrawerOpen,
    loadServerCart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    applyPromoCode,
    removePromoCode,
  }
}
