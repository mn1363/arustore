'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Sparkles, Tag, Truck } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useStore } from '@/lib/store/useStore'
import { formatPrice } from '@/lib/utils'
import { getDict } from '@/lib/data/i18n'

export default function CartSummary() {
  const locale = useStore((s) => s.locale)
  const pushToast = useStore((s) => s.pushToast)
  const dict = getDict(locale)
  const {
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
  } = useCart()

  const [codeInput, setCodeInput] = useState('')

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!codeInput.trim()) return
    const ok = applyPromoCode(codeInput)
    if (ok) {
      setCodeInput('')
      pushToast({
        title: locale === 'fa' ? 'کد تخفیف اعمال شد!' : 'Promo code applied!',
        type: 'success',
      })
    } else {
      pushToast({
        title:
          locale === 'fa'
            ? 'کد نامعتبر است (امتحان کنید: ARU3D)'
            : 'Invalid code (Try: ARU3D)',
        type: 'error',
      })
    }
  }

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-5 h-fit sticky top-24">
      <h3 className="text-lg font-extrabold text-white">
        {locale === 'fa' ? 'خلاصه سفارش هوشمند' : 'Order Summary'}
      </h3>

      {/* Promo Code Input */}
      {promoCode ? (
        <div className="rounded-2xl bg-emerald-500/15 border border-emerald-400/35 px-4 py-3 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2 font-bold">
            <Tag className="w-4 h-4 text-emerald-400" />
            <span>
              {promoCode} (-{promoPercent}%)
            </span>
          </div>
          <button
            onClick={removePromoCode}
            className="text-rose-300 hover:text-rose-200 underline"
          >
            {locale === 'fa' ? 'حذف' : 'Remove'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              dir="ltr"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="ARU3D / VIP20"
              className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-amber-300"
            >
              {locale === 'fa' ? 'اعمال کد' : 'Apply'}
            </button>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>
              {locale === 'fa'
                ? 'پیشنهاد ویژه: کد ARU3D برای ۱۵٪ تخفیف'
                : 'Tip: Use code ARU3D for 15% off'}
            </span>
          </div>
        </form>
      )}

      {/* Totals */}
      <div className="space-y-3 pt-3 border-t border-white/10 text-sm">
        <div className="flex justify-between text-slate-300">
          <span>{dict.common.subtotal}</span>
          <span className="font-semibold">
            {formatPrice(subtotalUsd, locale, subtotalToman)}
          </span>
        </div>

        {discountUsd > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>{dict.common.discount}</span>
            <span className="font-semibold">
              - {formatPrice(discountUsd, locale, discountToman)}
            </span>
          </div>
        )}

        <div className="flex justify-between text-slate-300">
          <span>{locale === 'fa' ? 'هزینه ارسال VIP' : 'VIP Shipping'}</span>
          <span className="text-amber-300 font-bold">
            {locale === 'fa' ? 'رایگان' : 'FREE'}
          </span>
        </div>

        <div className="pt-3 border-t border-white/10 flex justify-between items-center">
          <span className="font-bold text-white">{dict.common.total}</span>
          <span className="text-lg font-black text-amber-300">
            {formatPrice(totalUsd, locale, totalToman)}
          </span>
        </div>
      </div>

      <Link
        href="/checkout"
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-neon-cyan hover:brightness-110 transition-all"
      >
        {dict.common.checkout}
      </Link>

      <div className="pt-2 space-y-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>{dict.common.freeShipping}</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-violet-400 flex-shrink-0" />
          <span>
            {locale === 'fa'
              ? 'پرداخت رمزنگاری‌شده ۲۵۶ بیتی با ضمانت بازگشت وجه'
              : '256-bit SSL encrypted checkout & buyer protection'}
          </span>
        </div>
      </div>
    </div>
  )
}
