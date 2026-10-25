'use client'

import React from 'react'
import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2, X, ArrowLeft, ArrowRight } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useStore } from '@/lib/store/useStore'
import { formatNumber, formatPrice, getProductTitle } from '@/lib/utils'
import { getCartItemLineTotals } from '@/lib/api/cart'
import { getDict } from '@/lib/data/i18n'

export default function CartDrawer() {
  const locale = useStore((s) => s.locale)
  const dict = getDict(locale)
  const {
    cart,
    itemCount,
    subtotalUsd,
    subtotalToman,
    cartLoading,
    cartError,
    updateCartQuantity,
    removeFromCart,
    isCartDrawerOpen,
    setCartDrawerOpen,
  } = useCart()

  if (!isCartDrawerOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-[#05060b]/75 backdrop-blur-md"
        onClick={() => setCartDrawerOpen(false)}
      />

      <aside className="relative z-10 w-full max-w-md h-full bg-gradient-to-b from-[#131724] to-[#0c0e17] border-s border-white/[0.1] shadow-depth-hero flex flex-col justify-between">
        <div className="px-6 py-5 border-b border-white/[0.08] flex items-center justify-between">
          <h2 className="text-base font-bold text-[#f4f4f6]">
            {dict.common.cart} ({formatNumber(itemCount, locale)})
          </h2>
          <button
            onClick={() => setCartDrawerOpen(false)}
            aria-label="Close cart"
            className="p-2 rounded-xl hover:bg-white/[0.06] text-[#979fb2] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {cartError && (
          <div
            role="alert"
            className="mx-5 mt-4 px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300"
          >
            {cartError}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <ShoppingBag className="w-9 h-9 text-[#5c6375]" />
              <p className="text-sm text-[#979fb2]">{dict.common.emptyCart}</p>
              <Link
                href="/products"
                onClick={() => setCartDrawerOpen(false)}
                className="px-5 py-2.5 rounded-xl champagne-btn font-bold text-xs"
              >
                {dict.common.continueShopping}
              </Link>
            </div>
          ) : (
            cart.map((item) => {
              const { lineUsd, lineToman } = getCartItemLineTotals(item)
              return (
                <div
                  key={item.id}
                  className="rounded-2xl card-level-2 p-3 flex items-center gap-3.5"
                >
                  <div className="w-20 h-16 rounded-xl overflow-hidden product-pedestal-stage border border-white/[0.06] flex-shrink-0">
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
                      className="text-sm font-bold text-[#f4f4f6] hover:text-[#dfc08e] line-clamp-1"
                    >
                      {getProductTitle(item.product, locale)}
                    </Link>
                    <div className="text-[11px] text-[#979fb2] mt-0.5 truncate">
                      {locale === 'fa'
                        ? item.selectedColor.name_fa
                        : item.selectedColor.name}
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="text-xs font-bold text-[#dfc08e]">
                        {formatPrice(lineUsd, locale, lineToman)}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={cartLoading}
                          onClick={() => {
                            void updateCartQuantity(item.id, item.quantity - 1)
                          }}
                          className="w-6 h-6 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white disabled:opacity-40"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-5 text-center text-[#f4f4f6]">
                          {formatNumber(item.quantity, locale)}
                        </span>
                        <button
                          type="button"
                          disabled={cartLoading}
                          onClick={() => {
                            void updateCartQuantity(item.id, item.quantity + 1)
                          }}
                          className="w-6 h-6 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-white disabled:opacity-40"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={cartLoading}
                          onClick={() => {
                            void removeFromCart(item.id)
                          }}
                          className="p-1 text-[#7d8597] hover:text-white ms-1 disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-5 border-t border-white/[0.08] bg-[#0a0c14]/90 space-y-3.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#979fb2]">{dict.common.subtotal}</span>
              <span className="text-base font-bold text-[#dfc08e]">
                {formatPrice(subtotalUsd, locale, subtotalToman)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/cart"
                onClick={() => setCartDrawerOpen(false)}
                className="py-3 rounded-xl secondary-3d-btn text-center text-xs font-bold"
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
