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
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={() => setCartDrawerOpen(false)}
      />

      <aside className="relative z-10 w-full max-w-md h-full bg-[#141210] border-s border-[#ece6dc]/18 flex flex-col justify-between">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#ece6dc]/14 flex items-center justify-between bg-[#100f0d]">
          <div>
            <div className="font-mono text-[10px] tracking-[0.2em] text-[#c59b5f] uppercase">
              ORDER LEDGER
            </div>
            <h2 className="font-editorial text-2xl font-bold text-[#f7f4ee] leading-tight">
              {dict.common.cart} ({formatNumber(itemCount, locale)})
            </h2>
          </div>
          <button
            onClick={() => setCartDrawerOpen(false)}
            className="p-2 border border-[#ece6dc]/16 text-[#b9b0a2] hover:text-[#f7f4ee]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <div className="w-14 h-14 border border-[#ece6dc]/16 flex items-center justify-center text-[#8c8377]">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="text-sm text-[#9e9589]">{dict.common.emptyCart}</p>
              <Link
                href="/products"
                onClick={() => setCartDrawerOpen(false)}
                className="px-5 py-2.5 rounded-[2px] satin-brass-btn font-bold text-xs"
              >
                {dict.common.continueShopping}
              </Link>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="border border-[#ece6dc]/14 bg-[#181613] p-3.5 flex items-center gap-3.5"
              >
                <div className="w-20 h-20 bg-[#100f0d] border border-[#ece6dc]/12 p-2 flex-shrink-0">
                  <img
                    src={item.product.images[0]?.url}
                    alt={item.product.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/product/${item.product.slug}`}
                    onClick={() => setCartDrawerOpen(false)}
                    className="font-editorial text-xl font-bold text-[#f7f4ee] hover:text-[#dfc08e] line-clamp-1"
                  >
                    {getProductTitle(item.product, locale)}
                  </Link>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="w-3 h-3 rounded-full border border-white/30"
                      style={{ backgroundColor: item.selectedColor.accentHex }}
                    />
                    <span className="text-[11px] text-[#9e9589] truncate">
                      {locale === 'fa'
                        ? item.selectedColor.name_fa
                        : item.selectedColor.name}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <div className="text-xs font-extrabold text-[#dfc08e]">
                      {formatPrice(
                        item.product.price * item.quantity,
                        locale,
                        item.product.price_toman * item.quantity
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 border border-[#ece6dc]/16 hover:border-[#c59b5f] flex items-center justify-center text-[#f7f4ee]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono text-xs font-bold w-5 text-center">
                        {formatNumber(item.quantity, locale)}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 border border-[#ece6dc]/16 hover:border-[#c59b5f] flex items-center justify-center text-[#f7f4ee]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-[#8c8377] hover:text-[#dfc08e] ms-1"
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

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-[#ece6dc]/14 bg-[#100f0d] space-y-3.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#9e9589]">{dict.common.subtotal}</span>
              <span className="text-base font-extrabold text-[#f7f4ee]">
                {formatPrice(subtotalUsd, locale, subtotalToman)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/cart"
                onClick={() => setCartDrawerOpen(false)}
                className="py-3 border border-[#ece6dc]/20 text-center text-xs font-bold text-[#d6cfc4] hover:border-[#c59b5f]"
              >
                {locale === 'fa' ? 'دفتر کامل سفارش' : 'Full Order Sheet'}
              </Link>
              <Link
                href="/checkout"
                onClick={() => setCartDrawerOpen(false)}
                className="py-3 rounded-[2px] satin-brass-btn font-bold text-xs flex items-center justify-center gap-1.5"
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
