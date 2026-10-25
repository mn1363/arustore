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
  const dict = getDict(locale)
  const { cart, updateCartQuantity, removeFromCart, clearCart } = useCart()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumb items={[{ label: dict.common.cart }]} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#f4f4f6]">
          {dict.common.cart}
        </h1>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="px-3.5 py-1.5 rounded-xl secondary-3d-btn text-xs font-medium"
          >
            {locale === 'fa' ? 'خالی کردن سبد خرید' : 'Clear Bag'}
          </button>
        )}
      </div>

      {cart.length === 0 ? (
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
                onUpdateQty={updateCartQuantity}
                onRemove={removeFromCart}
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
