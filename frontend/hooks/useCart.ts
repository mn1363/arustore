'use client'

import { useStore } from '@/lib/store/useStore'

export function useCart() {
  const cart = useStore((s) => s.cart)
  const addToCart = useStore((s) => s.addToCart)
  const removeFromCart = useStore((s) => s.removeFromCart)
  const updateCartQuantity = useStore((s) => s.updateCartQuantity)
  const clearCart = useStore((s) => s.clearCart)
  const promoCode = useStore((s) => s.promoCode)
  const promoPercent = useStore((s) => s.promoPercent)
  const applyPromoCode = useStore((s) => s.applyPromoCode)
  const removePromoCode = useStore((s) => s.removePromoCode)
  const isCartDrawerOpen = useStore((s) => s.isCartDrawerOpen)
  const setCartDrawerOpen = useStore((s) => s.setCartDrawerOpen)

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotalUsd = cart.reduce((sum, item) => {
    const ed = item.product.editions?.find((e) => e.id === item.selectedEdition)
    return sum + (item.product.price + (ed?.priceDelta || 0)) * item.quantity
  }, 0)
  const subtotalToman = cart.reduce((sum, item) => {
    const ed = item.product.editions?.find((e) => e.id === item.selectedEdition)
    return sum + (item.product.price_toman + (ed?.priceDeltaToman || 0)) * item.quantity
  }, 0)

  const discountUsd = Math.round((subtotalUsd * promoPercent) / 100)
  const discountToman = Math.round((subtotalToman * promoPercent) / 100)
  const totalUsd = subtotalUsd - discountUsd
  const totalToman = subtotalToman - discountToman

  return {
    cart,
    itemCount,
    subtotalUsd,
    subtotalToman,
    discountUsd,
    discountToman,
    totalUsd,
    totalToman,
    promoCode,
    promoPercent,
    applyPromoCode,
    removePromoCode,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    isCartDrawerOpen,
    setCartDrawerOpen,
  }
}

export default useCart
