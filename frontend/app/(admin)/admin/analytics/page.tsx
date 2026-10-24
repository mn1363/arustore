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
      <h1 className="text-2xl font-black text-white">
        {locale === 'fa'
          ? 'آنالیتیکس تعامل سه‌بعدی کاربران'
          : '3D Spatial Engagement Telemetry'}
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
            label: locale === 'fa' ? 'فعال‌سازی کالبدشکافی ۳بعدی' : 'Exploded View Triggers',
            val: formatNumber(3920, locale),
          },
          {
            icon: Eye,
            label: locale === 'fa' ? 'تغییر زنده رنگ بدنه' : 'Live Finish Swaps',
            val: formatNumber(8410, locale),
          },
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className="glass-panel rounded-3xl p-6 border border-white/10 space-y-2">
              <Icon className="w-6 h-6 text-amber-400" />
              <div className="text-xs text-slate-400">{item.label}</div>
              <div className="text-2xl font-black text-white">{item.val}</div>
            </div>
          )
        })}
      </div>

      <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
        <h2 className="text-base font-bold text-white">
          {locale === 'fa'
            ? 'محبوب‌ترین مدل‌ها در آزمایشگاه سه‌بعدی'
            : 'Most Inspected 3D Models'}
        </h2>
        <div className="space-y-3">
          {products.slice(0, 5).map((p, idx) => {
            const pct = 94 - idx * 11
            return (
              <div key={p.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-200">
                    {getProductTitle(p, locale)}
                  </span>
                  <span className="text-amber-300 font-bold">
                    {formatNumber(pct, locale)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500"
                    style={{ width: `${pct}%` }}
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
