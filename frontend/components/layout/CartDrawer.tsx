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
        className="fixed inset-0 bg-obsidian-950/75 backdrop-blur-sm"
        onClick={() => setCartDrawerOpen(false)}
      />

      <aside className="relative z-10 w-full max-w-md h-full glass-panel border-s border-white/15 flex flex-col justify-between">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-400/30 text-amber-300">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">{dict.common.cart}</h2>
              <p className="text-xs text-slate-400">
                {formatNumber(itemCount, locale)}{' '}
                {locale === 'fa' ? 'کالا در سبد شما' : 'items selected'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCartDrawerOpen(false)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="text-sm text-slate-400">{dict.common.emptyCart}</p>
              <Link
                href="/products"
                onClick={() => setCartDrawerOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs"
              >
                {dict.common.continueShopping}
              </Link>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-white/[0.03] border border-white/10 p-3.5 flex items-center gap-3.5"
              >
                <div className="w-20 h-20 rounded-xl bg-obsidian-950 border border-white/10 p-2 flex-shrink-0">
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
                    className="text-sm font-bold text-white hover:text-amber-300 line-clamp-1"
                  >
                    {getProductTitle(item.product, locale)}
                  </Link>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="w-3 h-3 rounded-full border border-white/30"
                      style={{ backgroundColor: item.selectedColor.accentHex }}
                    />
                    <span className="text-[11px] text-slate-400 truncate">
                      {locale === 'fa'
                        ? item.selectedColor.name_fa
                        : item.selectedColor.name}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <div className="text-xs font-extrabold text-amber-300">
                      {formatPrice(
                        item.product.price * item.quantity,
                        locale,
                        item.product.price_toman * item.quantity
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold w-5 text-center">
                        {formatNumber(item.quantity, locale)}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 ms-1"
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
          <div className="p-5 border-t border-white/10 bg-obsidian-950/90 space-y-3.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{dict.common.subtotal}</span>
              <span className="text-base font-extrabold text-white">
                {formatPrice(subtotalUsd, locale, subtotalToman)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/cart"
                onClick={() => setCartDrawerOpen(false)}
                className="py-3 rounded-xl glass-pill text-center text-xs font-bold text-slate-200 hover:text-white"
              >
                {locale === 'fa' ? 'مشاهده سبد کامل' : 'View Full Bag'}
              </Link>
              <Link
                href="/checkout"
                onClick={() => setCartDrawerOpen(false)}
                className="py-3 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-neon-cyan"
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
