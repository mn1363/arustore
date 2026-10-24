'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Tag, Truck } from 'lucide-react'
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
        title: locale === 'fa' ? 'کد تخفیف اعمال شد' : 'Promo code applied',
        type: 'success',
      })
    } else {
      pushToast({
        title: locale === 'fa' ? 'کد تخفیف معتبر نیست' : 'Invalid promo code',
        type: 'error',
      })
    }
  }

  return (
    <div className="rounded-2xl bg-[#14161a] p-6 border border-white/[0.07] space-y-5 h-fit sticky top-24">
      <h3 className="text-lg font-bold text-[#f2f2f0]">
        {locale === 'fa' ? 'خلاصه سفارش' : 'Order Summary'}
      </h3>

      {promoCode ? (
        <div className="rounded-xl bg-white/[0.05] border border-white/10 px-4 py-3 flex items-center justify-between text-xs text-[#f2f2f0]">
          <div className="flex items-center gap-2 font-bold">
            <Tag className="w-4 h-4 text-[#d6b88a]" />
            <span>
              {promoCode} (-{promoPercent}%)
            </span>
          </div>
          <button
            onClick={removePromoCode}
            className="text-[#9ca0ab] hover:text-white underline"
          >
            {locale === 'fa' ? 'حذف' : 'Remove'}
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="flex gap-2">
          <input
            type="text"
            dir="ltr"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder={locale === 'fa' ? 'کد تخفیف' : 'Promo code'}
            className="flex-1 rounded-xl bg-[#0d0e11] border border-white/10 px-3.5 py-2 text-xs text-white placeholder:text-[#666b78] focus:outline-none focus:border-white/25"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-xs font-bold text-[#f2f2f0]"
          >
            {locale === 'fa' ? 'ثبت' : 'Apply'}
          </button>
        </form>
      )}

      <div className="space-y-3 pt-3 border-t border-white/[0.07] text-sm">
        <div className="flex justify-between text-[#b4b8c2]">
          <span>{dict.common.subtotal}</span>
          <span className="font-semibold">
            {formatPrice(subtotalUsd, locale, subtotalToman)}
          </span>
        </div>

        {discountUsd > 0 && (
          <div className="flex justify-between text-[#d6b88a]">
            <span>{dict.common.discount}</span>
            <span className="font-semibold">
              - {formatPrice(discountUsd, locale, discountToman)}
            </span>
          </div>
        )}

        <div className="flex justify-between text-[#b4b8c2]">
          <span>{locale === 'fa' ? 'ارسال' : 'Shipping'}</span>
          <span className="text-[#d6b88a] font-bold">
            {locale === 'fa' ? 'رایگان' : 'Free'}
          </span>
        </div>

        <div className="pt-3 border-t border-white/[0.07] flex justify-between items-center">
          <span className="font-bold text-[#f2f2f0]">{dict.common.total}</span>
          <span className="text-lg font-bold text-[#d6b88a]">
            {formatPrice(totalUsd, locale, totalToman)}
          </span>
        </div>
      </div>

      <Link
        href="/checkout"
        className="w-full py-3.5 rounded-xl champagne-btn font-bold text-sm flex items-center justify-center gap-2 transition-colors"
      >
        {dict.common.checkout}
      </Link>

      <div className="pt-2 space-y-2 text-xs text-[#8e93a0]">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#d6b88a] flex-shrink-0" />
          <span>{dict.common.freeShipping}</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#d6b88a] flex-shrink-0" />
          <span>
            {locale === 'fa'
              ? 'ضمانت سلامت فیزیکی و ۵ سال ثبات رنگ'
              : '5-year finish warranty'}
          </span>
        </div>
      </div>
    </div>
  )
}
