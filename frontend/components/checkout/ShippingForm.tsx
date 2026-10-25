'use client'

import React from 'react'
import Input from '@/components/ui/Input'
import { useStore } from '@/lib/store/useStore'
import { ShippingData, ShippingFieldErrors } from '@/lib/checkoutValidation'

export type { ShippingData, ShippingFieldErrors }

export default function ShippingForm({
  data,
  errors,
  disabled = false,
  onChange,
}: {
  data: ShippingData
  errors?: ShippingFieldErrors
  disabled?: boolean
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
          autoComplete="name"
          value={data.fullName}
          error={errors?.fullName}
          disabled={disabled}
          required
          onChange={(e) => onChange({ ...data, fullName: e.target.value })}
        />
        <Input
          label={locale === 'fa' ? 'شماره تماس' : 'Phone Number'}
          dir="ltr"
          autoComplete="tel"
          value={data.phone}
          error={errors?.phone}
          disabled={disabled}
          required
          onChange={(e) => onChange({ ...data, phone: e.target.value })}
        />
        <Input
          label={locale === 'fa' ? 'شهر' : 'City'}
          autoComplete="address-level2"
          value={data.city}
          error={errors?.city}
          disabled={disabled}
          required
          onChange={(e) => onChange({ ...data, city: e.target.value })}
        />
        <Input
          label={
            locale === 'fa' ? 'کد پستی (اختیاری)' : 'Postal Code (Optional)'
          }
          dir="ltr"
          autoComplete="postal-code"
          value={data.postalCode}
          error={errors?.postalCode}
          disabled={disabled}
          onChange={(e) => onChange({ ...data, postalCode: e.target.value })}
        />
      </div>

      <Input
        label={locale === 'fa' ? 'نشانی کامل' : 'Street Address'}
        autoComplete="street-address"
        value={data.address}
        error={errors?.address}
        disabled={disabled}
        required
        onChange={(e) => onChange({ ...data, address: e.target.value })}
      />

      <Input
        label={
          locale === 'fa'
            ? 'توضیحات تحویل (اختیاری)'
            : 'Delivery Notes (Optional)'
        }
        value={data.notes || ''}
        disabled={disabled}
        onChange={(e) => onChange({ ...data, notes: e.target.value })}
      />
    </div>
  )
}
