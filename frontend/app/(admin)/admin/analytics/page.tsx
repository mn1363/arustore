'use client'

import React from 'react'
import { Rotate3d, Layers, Eye } from 'lucide-react'
import { useStore } from '@/lib/store/useStore'
import { formatNumber, getProductTitle } from '@/lib/utils'

export default function AdminAnalyticsPage() {
  const locale = useStore((s) => s.locale)
  const products = useStore((s) => s.products)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#f4f4f6]">
        {locale === 'fa'
          ? 'آنالیتیکس تعامل سه‌بعدی کاربران'
          : '3D Stage Engagement'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: Rotate3d,
            label: locale === 'fa' ? 'میانگین چرخش ۳۶۰ درجه' : 'Avg 360° Orbit Time',
            val: locale === 'fa' ? '۴۸ ثانیه' : '48.4 sec',
          },
          {
            icon: Layers,
            label: locale === 'fa' ? 'مشاهده نمای قطعات' : 'Parts View Triggers',
            val: formatNumber(3920, locale),
          },
          {
            icon: Eye,
            label: locale === 'fa' ? 'تغییر زنده رنگ آنودایز' : 'Live Finish Swaps',
            val: formatNumber(8410, locale),
          },
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className="rounded-3xl card-level-2 p-6 space-y-2">
              <Icon className="w-6 h-6 text-[#dfc08e]" />
              <div className="text-xs text-[#979fb2]">{item.label}</div>
              <div className="text-2xl font-bold text-[#f4f4f6]">{item.val}</div>
            </div>
          )
        })}
      </div>

      <div className="rounded-3xl surface-level-1 p-6 space-y-4">
        <h2 className="text-base font-bold text-[#f4f4f6]">
          {locale === 'fa'
            ? 'محبوب‌ترین مدل‌ها در صحنه سه‌بعدی'
            : 'Most Inspected 3D Models'}
        </h2>
        <div className="space-y-3.5">
          {products.slice(0, 5).map((p, idx) => {
            const pct = 94 - idx * 11
            return (
              <div key={p.id} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-[#e8ebf2]">
                    {getProductTitle(p, locale)}
                  </span>
                  <span className="text-[#dfc08e] font-bold">
                    {formatNumber(pct, locale)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: 'linear-gradient(90deg, #c9a66f 0%, #eed2a4 100%)',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
