'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Tag, X } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useStore } from '@/lib/store/useStore'
import { formatNumber, formatPrice, getProductTitle } from '@/lib/utils'
import { getCartItemUnitPrices } from '@/lib/api/cart'
import { getDict } from '@/lib/data/i18n'

export default function OrderSummary({
  isAuthenticated,
  isSubmitting = false,
  onSubmitOrder,
}: {
  isAuthenticated: boolean
  isSubmitting?: boolean
  onSubmitOrder: () => void
}) {
  const locale = useStore((s) => s.locale)
  const dict = getDict(locale)
  const {
    cart,
    subtotalUsd,
    subtotalToman,
    discountUsd,
    discountToman,
    totalUsd,
    totalToman,
    promoCode,
    applyPromoCode,
    removePromoCode,
  } = useCart()

  const [promoInput, setPromoInput] = useState('')
  const [promoBusy, setPromoBusy] = useState(false)
  const [promoFeedback, setPromoFeedback] = useState<string | null>(null)

  const handleApplyPromo = async () => {
    const cleaned = promoInput.trim()
    if (!cleaned || promoBusy || isSubmitting) return
    setPromoBusy(true)
    setPromoFeedback(null)
    try {
      const res = await applyPromoCode(cleaned)
      if (res.ok) {
        setPromoInput('')
      } else if (res.error) {
        setPromoFeedback(res.error)
      }
    } finally {
      setPromoBusy(false)
    }
  }

  return (
    <div className="rounded-2xl surface-level-1 p-6 space-y-5 h-fit sticky top-24">
      <h2 className="text-lg font-bold text-[#f4f4f6]">
        {locale === 'fa' ? 'مرور اقلام سفارش' : 'Order Items'}
      </h2>

      <div className="space-y-3 max-h-72 overflow-y-auto pe-1">
        {cart.map((item) => {
          const { unitUsd, unitToman } = getCartItemUnitPrices(item)
          return (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-16 h-14 rounded-lg product-pedestal-stage border border-white/[0.06] overflow-hidden flex-shrink-0">
                <img
                  src={item.product.images[0]?.url}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-[#f4f4f6] truncate">
                  {getProductTitle(item.product, locale)}
                </div>
                <div className="text-[11px] text-[#979fb2]">
                  {formatNumber(item.quantity, locale)} ×{' '}
                  {formatPrice(unitUsd, locale, unitToman)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {isAuthenticated && (
        <div className="pt-3 border-t border-white/[0.07] space-y-2">
          {promoCode ? (
            <div className="flex items-center justify-between rounded-xl card-level-2 px-3.5 py-2.5 text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-[#dfc08e]">
                <Tag className="w-3.5 h-3.5" />
                <span dir="ltr">{promoCode}</span>
              </span>
              <button
                type="button"
                disabled={isSubmitting || promoBusy}
                onClick={() => void removePromoCode()}
                aria-label={locale === 'fa' ? 'حذف کد تخفیف' : 'Remove promo code'}
                className="text-[#979fb2] hover:text-[#f4f4f6] disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                dir="ltr"
                value={promoInput}
                disabled={isSubmitting || promoBusy}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder={locale === 'fa' ? 'کد تخفیف' : 'Promo code'}
                className="flex-1 min-w-0 rounded-xl bg-[#0e111a] border border-white/[0.08] px-3 py-2 text-xs text-[#f4f4f6] placeholder:text-[#666e82] focus:outline-none focus:border-[#dfc08e]/50"
              />
              <button
                type="button"
                disabled={!promoInput.trim() || isSubmitting || promoBusy}
                onClick={handleApplyPromo}
                className="px-3.5 py-2 rounded-xl secondary-3d-btn text-xs font-bold disabled:opacity-50"
              >
                {promoBusy
                  ? '...'
                  : locale === 'fa'
                  ? 'اعمال'
                  : 'Apply'}
              </button>
            </div>
          )}
          {promoFeedback && (
            <p className="text-[11px] text-rose-300">{promoFeedback}</p>
          )}
        </div>
      )}

      <div className="space-y-2.5 pt-4 border-t border-white/[0.07] text-xs sm:text-sm">
        <div className="flex justify-between text-[#b4bccf]">
          <span>{dict.common.subtotal}</span>
          <span>{formatPrice(subtotalUsd, locale, subtotalToman)}</span>
        </div>
        {discountUsd > 0 && (
          <div className="flex justify-between text-[#dfc08e]">
            <span>{dict.common.discount}</span>
            <span>- {formatPrice(discountUsd, locale, discountToman)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-3 border-t border-white/[0.07]">
          <span className="font-bold text-[#f4f4f6]">{dict.common.total}</span>
          <span className="text-lg font-bold text-[#dfc08e]">
            {formatPrice(totalUsd, locale, totalToman)}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {isAuthenticated ? (
          <button
            type="button"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            onClick={onSubmitOrder}
            className="w-full py-3.5 rounded-xl champagne-btn font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? locale === 'fa'
                ? 'در حال ثبت سفارش...'
                : 'Saving Order...'
              : locale === 'fa'
              ? 'ثبت سفارش (در انتظار پرداخت)'
              : 'Save Order (Pending Payment)'}
          </button>
        ) : (
          <Link
            href="/login?next=/checkout"
            className="w-full py-3.5 rounded-xl champagne-btn font-bold text-sm flex items-center justify-center"
          >
            {locale === 'fa'
              ? 'ورود به حساب برای ثبت سفارش'
              : 'Sign In to Submit Order'}
          </Link>
        )}

        <Link
          href="/cart"
          className="w-full py-3 rounded-xl secondary-3d-btn font-bold text-xs flex items-center justify-center"
        >
          {locale === 'fa' ? 'بازگشت به سبد خرید' : 'Return to Bag'}
        </Link>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-[#979fb2] pt-1">
        <ShieldCheck className="w-4 h-4 text-[#dfc08e] flex-shrink-0" />
        <span>
          {locale === 'fa'
            ? 'ثبت بدون پرداخت آنلاین • عدم رزرو موجودی تا فعال‌سازی پرداخت'
            : 'Saved without payment • Stock is not reserved before payment'}
        </span>
      </div>
    </div>
  )
}
