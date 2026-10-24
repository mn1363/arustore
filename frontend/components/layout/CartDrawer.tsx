'use client'

import React from 'react'
import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2, X, ArrowLeft, ArrowRight } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useStore } from '@/lib/store/useStore'
import { formatNumber, formatPrice, getProductTitle } from '@/lib/utils'
import { getDict } from '@/lib/data/i18n'

export default function CartDrawer() {
  const locale = useStore((s) => s.locale)
  const dict = getDict(locale)
  const {
    cart,
    itemCount,
    subtotalUsd,
    subtotalToman,
    updateCartQuantity,
    removeFromCart,
    isCartDrawerOpen,
    setCartDrawerOpen,
  } = useCart()

  if (!isCartDrawerOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setCartDrawerOpen(false)}
      />

      <aside className="relative z-10 w-full max-w-md h-full bg-[#14161a] border-s border-white/[0.08] flex flex-col justify-between">
        <div className="px-6 py-5 border-b border-white/[0.07] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#f2f2f0]">
            {dict.common.cart} ({formatNumber(itemCount, locale)})
          </h2>
          <button
            onClick={() => setCartDrawerOpen(false)}
            className="p-2 rounded-lg hover:bg-white/[0.06] text-[#9ca0ab] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <ShoppingBag className="w-8 h-8 text-[#5c606d]" />
              <p className="text-sm text-[#9ca0ab]">{dict.common.emptyCart}</p>
              <Link
                href="/products"
                onClick={() => setCartDrawerOpen(false)}
                className="px-5 py-2.5 rounded-xl champagne-btn font-bold text-xs"
              >
                {dict.common.continueShopping}
              </Link>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-[#101216] border border-white/[0.06] p-3 flex items-center gap-3.5"
              >
                <div className="w-20 h-16 rounded-lg overflow-hidden bg-[#0d0e11] flex-shrink-0">
                  <img
                    src={item.product.images[0]?.url}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/product/${item.product.slug}`}
                    onClick={() => setCartDrawerOpen(false)}
                    className="text-sm font-bold text-[#f2f2f0] hover:text-[#d6b88a] line-clamp-1"
                  >
                    {getProductTitle(item.product, locale)}
                  </Link>
                  <div className="text-[11px] text-[#8e93a0] mt-0.5 truncate">
                    {locale === 'fa'
                      ? item.selectedColor.name_fa
                      : item.selectedColor.name}
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-[#d6b88a]">
                      {formatPrice(
                        item.product.price * item.quantity,
                        locale,
                        item.product.price_toman * item.quantity
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-md bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-5 text-center">
                        {formatNumber(item.quantity, locale)}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-md bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-[#7d828f] hover:text-white ms-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-5 border-t border-white/[0.07] bg-[#101216] space-y-3.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#9ca0ab]">{dict.common.subtotal}</span>
              <span className="text-base font-bold text-[#f2f2f0]">
                {formatPrice(subtotalUsd, locale, subtotalToman)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/cart"
                onClick={() => setCartDrawerOpen(false)}
                className="py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-center text-xs font-bold text-[#e4e6eb]"
              >
                {locale === 'fa' ? 'سبد خرید' : 'View Bag'}
              </Link>
              <Link
                href="/checkout"
                onClick={() => setCartDrawerOpen(false)}
                className="py-3 rounded-xl champagne-btn font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <span>{dict.common.checkout}</span>
                {locale === 'fa' ? (
                  <ArrowLeft className="w-3.5 h-3.5" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
