'use client'

import React from 'react'
import { MapPin } from 'lucide-react'
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
    <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">
          <MapPin className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-extrabold text-white">
          {locale === 'fa' ? '۱. اطلاعات تحویل گیرنده VIP' : '1. VIP Delivery Destination'}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={locale === 'fa' ? 'نام و نام خانوادگی تحویل‌گیرنده' : 'Full Name'}
          value={data.fullName}
          onChange={(e) => onChange({ ...data, fullName: e.target.value })}
          required
        />
        <Input
          label={locale === 'fa' ? 'شماره موبایل جهت هماهنگی پیک VIP' : 'Mobile Number'}
          dir="ltr"
          value={data.phone}
          onChange={(e) => onChange({ ...data, phone: e.target.value })}
          required
        />
        <Input
          label={locale === 'fa' ? 'استان و شهر' : 'City'}
          value={data.city}
          onChange={(e) => onChange({ ...data, city: e.target.value })}
          required
        />
        <Input
          label={locale === 'fa' ? 'کد پستی ۱۰ رقمی' : 'Postal Code'}
          dir="ltr"
          value={data.postalCode}
          onChange={(e) => onChange({ ...data, postalCode: e.target.value })}
          required
        />
      </div>

      <Input
        label={locale === 'fa' ? 'نشانی دقیق پستی' : 'Street Address & Suite'}
        value={data.address}
        onChange={(e) => onChange({ ...data, address: e.target.value })}
        required
      />
    </div>
  )
}
