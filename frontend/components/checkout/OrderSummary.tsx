'use client'

import React from 'react'
import { useCart } from '@/hooks/useCart'
import { useStore } from '@/lib/store/useStore'
import { formatNumber, formatPrice, getProductTitle } from '@/lib/utils'
import { getDict } from '@/lib/data/i18n'

export default function OrderSummary({
  onSubmitOrder,
  submitting,
}: {
  onSubmitOrder?: () => void
  submitting?: boolean
}) {
  const locale = useStore((s) => s.locale)
  const dict = getDict(locale)
  const { cart, subtotalUsd, subtotalToman, discountUsd, discountToman, totalUsd, totalToman } =
    useCart()

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-5 h-fit sticky top-24">
      <h3 className="text-lg font-extrabold text-white">
        {locale === 'fa' ? 'مرور اقلام سفارش' : 'Your Selection'}
      </h3>

      <div className="space-y-3 max-h-72 overflow-y-auto pe-1">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-obsidian-950 border border-white/10 p-1.5 flex-shrink-0">
              <img
                src={item.product.images[0]?.url}
                alt={item.product.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {getProductTitle(item.product, locale)}
              </div>
              <div className="text-[11px] text-slate-400">
                {formatNumber(item.quantity, locale)} ×{' '}
                {formatPrice(item.product.price, locale, item.product.price_toman)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2.5 pt-4 border-t border-white/10 text-xs sm:text-sm">
        <div className="flex justify-between text-slate-300">
          <span>{dict.common.subtotal}</span>
          <span>{formatPrice(subtotalUsd, locale, subtotalToman)}</span>
        </div>
        {discountUsd > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>{dict.common.discount}</span>
            <span>- {formatPrice(discountUsd, locale, discountToman)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-3 border-t border-white/10">
          <span className="font-bold text-white">{dict.common.total}</span>
          <span className="text-lg font-black text-amber-300">
            {formatPrice(totalUsd, locale, totalToman)}
          </span>
        </div>
      </div>

      {onSubmitOrder && (
        <button
          type="button"
          disabled={submitting || cart.length === 0}
          onClick={onSubmitOrder}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-black text-sm shadow-neon-cyan hover:brightness-110 transition-all disabled:opacity-50"
        >
          {submitting
            ? locale === 'fa'
              ? 'در حال تایید تراکنش امن...'
              : 'Processing Quantum Vault...'
            : locale === 'fa'
            ? 'پرداخت و ثبت نهایی سفارش VIP'
            : 'Complete VIP Order'}
        </button>
      )}
    </div>
  )
}
