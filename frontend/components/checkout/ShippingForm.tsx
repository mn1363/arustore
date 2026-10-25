'use client'

import React from 'react'
import Input from '@/components/ui/Input'
import { useStore } from '@/lib/store/useStore'

export interface ShippingData {
  fullName: string
  phone: string
  city: string
  address: string
  postalCode: string
}

export default function ShippingForm({
  data,
  onChange,
}: {
  data: ShippingData
  onChange: (next: ShippingData) => void
}) {
  const locale = useStore((s) => s.locale)

  return (
    <div className="rounded-2xl surface-level-1 p-6 space-y-5">
      <div className="flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-full bg-[#1b2030] border border-[#dfc08e]/40 text-[#dfc08e] text-xs font-bold flex items-center justify-center">
          {locale === 'fa' ? '۱' : '1'}
        </span>
        <h2 className="text-base sm:text-lg font-bold text-[#f4f4f6]">
          {locale === 'fa' ? 'اطلاعات تحویل گیرنده' : 'Shipping Address'}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={locale === 'fa' ? 'نام و نام خانوادگی' : 'Full Name'}
          value={data.fullName}
          onChange={(e) => onChange({ ...data, fullName: e.target.value })}
          required
        />
        <Input
          label={locale === 'fa' ? 'شماره تماس' : 'Phone Number'}
          dir="ltr"
          value={data.phone}
          onChange={(e) => onChange({ ...data, phone: e.target.value })}
          required
        />
        <Input
          label={locale === 'fa' ? 'شهر' : 'City'}
          value={data.city}
          onChange={(e) => onChange({ ...data, city: e.target.value })}
          required
        />
        <Input
          label={locale === 'fa' ? 'کد پستی' : 'Postal Code'}
          dir="ltr"
          value={data.postalCode}
          onChange={(e) => onChange({ ...data, postalCode: e.target.value })}
          required
        />
      </div>

      <Input
        label={locale === 'fa' ? 'نشانی کامل' : 'Street Address'}
        value={data.address}
        onChange={(e) => onChange({ ...data, address: e.target.value })}
        required
      />
    </div>
  )
}
