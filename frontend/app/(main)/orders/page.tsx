'use client'

import React from 'react'
import { CheckCircle2, Clock, Package, Truck } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { useStore } from '@/lib/store/useStore'
import { formatNumber, formatPrice } from '@/lib/utils'

export default function OrdersPage() {
  const locale = useStore((s) => s.locale)
  const orders = useStore((s) => s.orders)

  const statusMeta = {
    processing: {
      label: locale === 'fa' ? 'در حال آماده‌سازی VIP' : 'Preparing VIP Box',
      color: 'text-amber-300 bg-amber-500/15 border-amber-400/35',
      step: 1,
    },
    shipped: {
      label: locale === 'fa' ? 'ارسال‌شده با پیک اختصاصی' : 'In VIP Transit',
      color: 'text-amber-300 bg-amber-500/15 border-amber-400/35',
      step: 2,
    },
    delivered: {
      label: locale === 'fa' ? 'تحویل داده شده' : 'Delivered',
      color: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/35',
      step: 3,
    },
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumb
        items={[{ label: locale === 'fa' ? 'پیگیری سفارش‌ها' : 'Order History' }]}
      />

      <h1 className="text-2xl sm:text-4xl font-black text-white">
        {locale === 'fa' ? 'سفارش‌ها و رهگیری هوشمند' : 'Orders & Live Tracking'}
      </h1>

      <div className="space-y-6">
        {orders.map((order) => {
          const meta = statusMeta[order.status]
          return (
            <div
              key={order.id}
              className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10 space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-base font-black text-white">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-bold border ${meta.color}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {order.createdAt} • {order.shippingAddress}
                  </div>
                </div>

                <div className="text-end">
                  <div className="text-xs text-slate-400">
                    {locale === 'fa' ? 'مبلغ کل سفارش' : 'Order Total'}
                  </div>
                  <div className="text-lg font-black text-amber-300">
                    {formatPrice(order.total, locale, order.total_toman)}
                  </div>
                </div>
              </div>

              {/* 3-Step Visual Progress Bar */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  {
                    s: 1,
                    icon: Clock,
                    label: locale === 'fa' ? 'کنترل کیفیت و بسته‌بندی' : 'Studio QC',
                  },
                  {
                    s: 2,
                    icon: Truck,
                    label: locale === 'fa' ? 'تحویل به کوریر VIP' : 'VIP Dispatch',
                  },
                  {
                    s: 3,
                    icon: CheckCircle2,
                    label: locale === 'fa' ? 'تحویل نهایی به مشتری' : 'Delivered',
                  },
                ].map(({ s, icon: Icon, label }) => {
                  const active = meta.step >= s
                  return (
                    <div
                      key={s}
                      className={`rounded-2xl p-3 border flex items-center gap-2.5 ${
                        active
                          ? 'bg-amber-500/10 border-amber-400/35 text-amber-200'
                          : 'bg-white/[0.02] border-white/5 text-slate-500'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="font-semibold truncate">{label}</span>
                    </div>
                  )
                })}
              </div>

              {/* Order Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-obsidian-950/70 border border-white/[0.07] p-3 flex items-center gap-3.5"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-14 object-contain rounded-xl bg-obsidian-900 p-1.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-bold text-white truncate">
                        {locale === 'fa' ? item.name_fa : item.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {locale === 'fa' ? item.colorName_fa : item.colorName} •{' '}
                        {formatNumber(item.quantity, locale)}×
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
