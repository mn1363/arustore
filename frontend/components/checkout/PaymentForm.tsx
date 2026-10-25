'use client'

import React from 'react'
import { Lock } from 'lucide-react'
import { useStore } from '@/lib/store/useStore'

export default function PaymentForm() {
  const locale = useStore((s) => s.locale)

  return (
    <div className="rounded-2xl surface-level-1 p-6 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-[#1b2030] border border-[#dfc08e]/40 text-[#dfc08e] text-xs font-bold flex items-center justify-center">
            {locale === 'fa' ? '۲' : '2'}
          </span>
          <h2 className="text-base sm:text-lg font-bold text-[#f4f4f6]">
            {locale === 'fa' ? 'وضعیت درگاه پرداخت بانکی' : 'Payment Gateway Status'}
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs text-[#979fb2]">
          <Lock className="w-3.5 h-3.5 text-[#dfc08e]" />
          {locale === 'fa'
            ? 'عدم دریافت اطلاعات کارت'
            : 'No card data collected'}
        </span>
      </div>

      <div
        role="note"
        className="rounded-xl card-level-2 p-4 space-y-2 text-xs leading-relaxed"
      >
        <p className="font-bold text-[#f4f4f6]">
          {locale === 'fa'
            ? 'اتصال به درگاه پرداخت و ثبت سفارش هنوز فعال نشده است'
            : 'Online payment and order submission are not yet enabled'}
        </p>
        <p className="text-[#979fb2]">
          {locale === 'fa'
            ? 'برای حفظ امنیت کاربران، تا زمان فعال‌سازی رسمی درگاه بانکی هیچ فیلدی برای دریافت یا ذخیره شماره کارت، تاریخ انقضا یا رمز دوم نمایش داده نمی‌شود.'
            : 'For your security, no card numbers, expiry dates, or verification codes are requested or stored while payment integration is pending.'}
        </p>
      </div>
    </div>
  )
}
