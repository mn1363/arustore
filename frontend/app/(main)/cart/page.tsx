'use client'

import React from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import CartItem from '@/components/cart/CartItem'
import CartSummary from '@/components/cart/CartSummary'
import { useCart } from '@/hooks/useCart'
import { useStore } from '@/lib/store/useStore'
import { getDict } from '@/lib/data/i18n'

export default function CartPage() {
  const locale = useStore((s) => s.locale)
  const authStatus = useStore((s) => s.authStatus)
  const dict = getDict(locale)
  const {
    cart,
    cartLoading,
    cartError,
    mergeError,
    loadServerCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
  } = useCart()

  const isInitialLoading =
    authStatus === 'loading' || (cartLoading && cart.length === 0)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumb items={[{ label: dict.common.cart }]} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#f4f4f6]">
          {dict.common.cart}
        </h1>
        {cart.length > 0 && (
          <button
            type="button"
            disabled={cartLoading}
            onClick={() => {
              void clearCart()
            }}
            className="px-3.5 py-1.5 rounded-xl secondary-3d-btn text-xs font-medium disabled:opacity-40"
          >
            {locale === 'fa' ? 'خالی کردن سبد خرید' : 'Clear Bag'}
          </button>
        )}
      </div>

      {(cartError || mergeError) && (
        <div
          role="alert"
          className="rounded-2xl surface-level-1 border border-rose-500/25 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-300"
        >
          <span>{cartError || mergeError}</span>
          <button
            type="button"
            onClick={() => {
              void loadServerCart()
            }}
            className="px-3.5 py-1.5 rounded-xl secondary-3d-btn text-xs font-semibold text-[#f4f4f6]"
          >
            {locale === 'fa' ? 'تلاش مجدد' : 'Retry'}
          </button>
        </div>
      )}

      {isInitialLoading ? (
        <div className="rounded-3xl surface-level-1 p-14 text-center space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#dfc08e]/30 border-t-[#dfc08e] animate-spin mx-auto" />
          <p className="text-sm text-[#979fb2]">
            {locale === 'fa'
              ? 'در حال بارگذاری سبد خرید...'
              : 'Loading your shopping bag...'}
          </p>
        </div>
      ) : cart.length === 0 ? (
        <div className="rounded-3xl surface-level-1 p-14 text-center space-y-5">
          <ShoppingBag className="w-10 h-10 text-[#666e82] mx-auto" />
          <h2 className="text-lg font-bold text-[#f4f4f6]">{dict.common.emptyCart}</h2>
          <Link
            href="/products"
            className="inline-flex px-6 py-3 rounded-xl champagne-btn font-bold text-sm"
          >
            {dict.common.continueShopping}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                disabled={cartLoading}
                onUpdateQty={(id, qty) => {
                  void updateCartQuantity(id, qty)
                }}
                onRemove={(id) => {
                  void removeFromCart(id)
                }}
              />
            ))}
          </div>
          <div className="lg:col-span-4">
            <CartSummary />
          </div>
        </div>
      )}
    </div>
  )
}
