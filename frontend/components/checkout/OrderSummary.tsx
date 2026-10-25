'use client'

import React from 'react'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useStore } from '@/lib/store/useStore'
import { formatNumber, formatPrice, getProductTitle } from '@/lib/utils'
import { getCartItemUnitPrices } from '@/lib/api/cart'
import { getDict } from '@/lib/data/i18n'

export default function OrderSummary({
  onAttemptSubmit,
}: {
  onAttemptSubmit?: () => void
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
  } = useCart()

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
        <button
          type="button"
          aria-disabled="true"
          onClick={onAttemptSubmit}
          className="w-full py-3.5 rounded-xl secondary-3d-btn font-bold text-sm text-[#979fb2] cursor-not-allowed opacity-80"
        >
          {locale === 'fa'
            ? 'ثبت سفارش و پرداخت موقتاً غیرفعال است'
            : 'Order Submission Unavailable'}
        </button>

        <Link
          href="/cart"
          className="w-full py-3 rounded-xl champagne-btn font-bold text-xs flex items-center justify-center"
        >
          {locale === 'fa' ? 'بازگشت به سبد خرید' : 'Return to Bag'}
        </Link>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-[#979fb2] pt-1">
        <ShieldCheck className="w-4 h-4 text-[#dfc08e] flex-shrink-0" />
        <span>
          {locale === 'fa'
            ? 'بسته‌بندی ضربه‌گیر اختصاصی و تضمین سلامت فیزیکی تحویل'
            : 'Protective packaging & insured delivery'}
        </span>
      </div>
    </div>
  )
}
