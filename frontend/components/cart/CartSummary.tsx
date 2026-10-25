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
    isAuthenticatedCart,
    applyPromoCode,
    removePromoCode,
  } = useCart()

  const [codeInput, setCodeInput] = useState('')
  const [promoError, setPromoError] = useState('')
  const [applying, setApplying] = useState(false)

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codeInput.trim() || applying) return
    setApplying(true)
    setPromoError('')
    try {
      const result = await applyPromoCode(codeInput)
      if (result.ok) {
        setCodeInput('')
        pushToast({
          title: locale === 'fa' ? 'کد تخفیف اعمال شد' : 'Promo code applied',
          type: 'success',
        })
      } else {
        const msg =
          result.error ||
          (locale === 'fa' ? 'کد تخفیف معتبر نیست' : 'Invalid promo code')
        setPromoError(msg)
        pushToast({
          title: msg,
          type: 'error',
        })
      }
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="rounded-3xl glass-panel p-6 space-y-5 h-fit sticky top-24">
      <h3 className="text-lg font-bold text-[#f4f4f6]">
        {locale === 'fa' ? 'خلاصه سفارش' : 'Order Summary'}
      </h3>

      {promoCode ? (
        <div className="rounded-xl bg-[#1a2030] border border-[#dfc08e]/35 px-4 py-3 flex items-center justify-between text-xs text-[#f4f4f6]">
          <div className="flex items-center gap-2 font-bold">
            <Tag className="w-4 h-4 text-[#dfc08e]" />
            <span>
              {promoCode} (-{promoPercent}%)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              void removePromoCode()
            }}
            className="text-[#979fb2] hover:text-white underline"
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
              onChange={(e) => {
                setCodeInput(e.target.value)
                if (promoError) setPromoError('')
              }}
              placeholder={locale === 'fa' ? 'کد تخفیف (مثلاً ARU3D)' : 'Promo code'}
              className="flex-1 rounded-xl bg-[#0a0c14] border border-white/[0.1] px-3.5 py-2 text-xs text-white placeholder:text-[#666e82] focus:outline-none focus:border-[#dfc08e]/60"
            />
            <button
              type="submit"
              disabled={applying}
              className="px-4 py-2 rounded-xl secondary-3d-btn text-xs font-bold disabled:opacity-50"
            >
              {applying
                ? locale === 'fa'
                  ? 'بررسی...'
                  : 'Checking...'
                : locale === 'fa'
                ? 'ثبت'
                : 'Apply'}
            </button>
          </div>
          {!isAuthenticatedCart && (
            <p className="text-[11px] text-[#979fb2]">
              {locale === 'fa'
                ? 'بررسی و اعمال کد تخفیف پس از ورود به حساب کاربری انجام می‌شود.'
                : 'Sign in to validate and apply a promo code.'}
            </p>
          )}
          {promoError && (
            <p role="alert" className="text-[11px] text-rose-400">
              {promoError}
            </p>
          )}
        </form>
      )}

      <div className="space-y-3 pt-3 border-t border-white/[0.07] text-sm">
        <div className="flex justify-between text-[#b4bccf]">
          <span>{dict.common.subtotal}</span>
          <span className="font-semibold">
            {formatPrice(subtotalUsd, locale, subtotalToman)}
          </span>
        </div>

        {discountUsd > 0 && (
          <div className="flex justify-between text-[#dfc08e]">
            <span>{dict.common.discount}</span>
            <span className="font-semibold">
              - {formatPrice(discountUsd, locale, discountToman)}
            </span>
          </div>
        )}

        <div className="flex justify-between text-[#b4bccf]">
          <span>{locale === 'fa' ? 'ارسال' : 'Shipping'}</span>
          <span className="text-[#dfc08e] font-bold">
            {locale === 'fa' ? 'رایگان' : 'Free'}
          </span>
        </div>

        <div className="pt-3 border-t border-white/[0.07] flex justify-between items-center">
          <span className="font-bold text-[#f4f4f6]">{dict.common.total}</span>
          <span className="text-lg font-bold text-[#dfc08e]">
            {formatPrice(totalUsd, locale, totalToman)}
          </span>
        </div>
      </div>

      <Link
        href="/checkout"
        className="w-full py-3.5 rounded-xl champagne-btn font-bold text-sm flex items-center justify-center gap-2"
      >
        {dict.common.checkout}
      </Link>

      <div className="pt-2 space-y-2 text-xs text-[#979fb2]">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#dfc08e] flex-shrink-0" />
          <span>{dict.common.freeShipping}</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#dfc08e] flex-shrink-0" />
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
