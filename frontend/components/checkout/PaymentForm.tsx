'use client'

import React, { useState } from 'react'
import { CreditCard, Lock, Wifi } from 'lucide-react'
import Input from '@/components/ui/Input'
import { useStore } from '@/lib/store/useStore'
import { AruLogo3D } from '@/components/ui/AruLogo3D'

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
  const [isFlipped, setIsFlipped] = useState(false)

  const formattedCard = (data.cardNumber || '6037997512348890')
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim()

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-violet-500/15 border border-violet-400/30 text-violet-300">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-extrabold text-white">
            {locale === 'fa'
              ? '۲. درگاه پرداخت هوشمند با پیش‌نمایش کارت سه‌بعدی'
              : '2. Interactive 3D Metallic Card Payment'}
          </h3>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
          <Lock className="w-3.5 h-3.5" />
          SSL 256-BIT
        </span>
      </div>

      {/* Interactive 3D Flipping Metallic Card */}
      <div className="perspective-1400 max-w-sm mx-auto h-52 select-none">
        <div
          className={`relative w-full h-full preserve-3d transition-transform duration-700 ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Card Front */}
          <div
            dir="ltr"
            className="absolute inset-0 backface-hidden rounded-3xl p-6 flex flex-col justify-between overflow-hidden border border-white/20 shadow-glass-3d"
            style={{
              background:
                'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #083344 100%)',
            }}
          >
            <div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full bg-amber-400/25 blur-2xl" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <AruLogo3D className="w-7 h-7" />
                <span className="text-xs font-bold tracking-widest text-amber-200">
                  ARU TITANIUM PAY
                </span>
              </div>
              <Wifi className="w-5 h-5 text-slate-300 rotate-90" />
            </div>

            <div className="font-mono text-lg sm:text-xl tracking-[0.2em] text-white font-bold relative z-10">
              {formattedCard}
            </div>

            <div className="flex items-end justify-between text-xs relative z-10">
              <div>
                <div className="text-[9px] uppercase text-slate-400">CARD HOLDER</div>
                <div className="font-semibold text-slate-100 truncate max-w-[170px]">
                  {data.cardHolder || (locale === 'fa' ? 'ARIAN RADMEHR' : 'ARIAN RADMEHR')}
                </div>
              </div>
              <div>
                <div className="text-[9px] uppercase text-slate-400">EXPIRES</div>
                <div className="font-mono font-semibold text-amber-300">
                  {data.expiry || '08/29'}
                </div>
              </div>
            </div>
          </div>

          {/* Card Back (CVV2) */}
          <div
            dir="ltr"
            className="absolute inset-0 backface-hidden rotate-y-180 rounded-3xl overflow-hidden border border-amber-400/35 shadow-glass-3d flex flex-col justify-between py-6"
            style={{
              background:
                'linear-gradient(135deg, #090d16 0%, #1e1b4b 65%, #0e7490 100%)',
            }}
          >
            <div className="w-full h-11 bg-black/80" />
            <div className="px-6 space-y-2">
              <div className="text-[10px] text-end text-amber-300 font-semibold">
                CVV2 SECURITY CODE
              </div>
              <div className="h-10 rounded-xl bg-white/90 text-slate-950 font-mono font-extrabold px-4 flex items-center justify-end tracking-widest">
                {data.cvv || '842'}
              </div>
            </div>
            <div className="px-6 text-[10px] text-slate-400 flex justify-between">
              <span>ARUSTORE QUANTUM VAULT</span>
              <span>3D-SECURE VERIFIED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={locale === 'fa' ? 'شماره ۱۶ رقمی کارت' : '16-Digit Card Number'}
          dir="ltr"
          maxLength={19}
          placeholder="6037 9975 1234 8890"
          value={data.cardNumber}
          onFocus={() => setIsFlipped(false)}
          onChange={(e) => onChange({ ...data, cardNumber: e.target.value })}
          required
        />
        <Input
          label={locale === 'fa' ? 'نام صاحب کارت' : 'Cardholder Name'}
          placeholder="ARIAN RADMEHR"
          value={data.cardHolder}
          onFocus={() => setIsFlipped(false)}
          onChange={(e) => onChange({ ...data, cardHolder: e.target.value })}
          required
        />
        <Input
          label={locale === 'fa' ? 'تاریخ انقضا (ماه/سال)' : 'Expiry Date (MM/YY)'}
          dir="ltr"
          maxLength={5}
          placeholder="08/29"
          value={data.expiry}
          onFocus={() => setIsFlipped(false)}
          onChange={(e) => onChange({ ...data, expiry: e.target.value })}
          required
        />
        <Input
          label={
            locale === 'fa'
              ? 'کد امنیتی CVV2 (چرخش خودکار کارت ۳بعدی)'
              : 'CVV2 (Flips 3D Card)'
          }
          dir="ltr"
          maxLength={4}
          placeholder="842"
          value={data.cvv}
          onFocus={() => setIsFlipped(true)}
          onBlur={() => setIsFlipped(false)}
          onChange={(e) => onChange({ ...data, cvv: e.target.value })}
          required
        />
      </div>
    </div>
  )
}
