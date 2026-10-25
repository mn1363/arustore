'use client'

import React from 'react'
import { Lock } from 'lucide-react'
import Input from '@/components/ui/Input'
import { useStore } from '@/lib/store/useStore'

export interface CardData {
  cardNumber: string
  cardHolder: string
  expiry: string
  cvv: string
}

export default function PaymentForm({
  data,
  onChange,
}: {
  data: CardData
  onChange: (next: CardData) => void
}) {
  const locale = useStore((s) => s.locale)

  return (
    <div className="rounded-2xl surface-level-1 p-6 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-[#1b2030] border border-[#dfc08e]/40 text-[#dfc08e] text-xs font-bold flex items-center justify-center">
            {locale === 'fa' ? '۲' : '2'}
          </span>
          <h2 className="text-base sm:text-lg font-bold text-[#f4f4f6]">
            {locale === 'fa' ? 'اطلاعات پرداخت بانکی' : 'Payment Details'}
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs text-[#979fb2]">
          <Lock className="w-3.5 h-3.5 text-[#dfc08e]" />
          {locale === 'fa' ? 'درگاه امن شاپرک' : 'SSL Encrypted'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={locale === 'fa' ? 'شماره کارت' : 'Card Number'}
          dir="ltr"
          maxLength={19}
          placeholder="6037 9975 1234 8890"
          value={data.cardNumber}
          onChange={(e) => onChange({ ...data, cardNumber: e.target.value })}
          required
        />
        <Input
          label={locale === 'fa' ? 'نام صاحب کارت' : 'Cardholder Name'}
          placeholder="ARIAN RADMEHR"
          value={data.cardHolder}
          onChange={(e) => onChange({ ...data, cardHolder: e.target.value })}
          required
        />
        <Input
          label={locale === 'fa' ? 'تاریخ انقضا (ماه/سال)' : 'Expiry (MM/YY)'}
          dir="ltr"
          maxLength={5}
          placeholder="08/29"
          value={data.expiry}
          onChange={(e) => onChange({ ...data, expiry: e.target.value })}
          required
        />
        <Input
          label={locale === 'fa' ? 'کد CVV2' : 'CVV2'}
          dir="ltr"
          maxLength={4}
          placeholder="842"
          value={data.cvv}
          onChange={(e) => onChange({ ...data, cvv: e.target.value })}
          required
        />
      </div>
    </div>
  )
}
