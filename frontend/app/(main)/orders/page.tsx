'use client'

import React from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock, PackageOpen, Truck } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { useStore } from '@/lib/store/useStore'
import { formatNumber, formatPrice } from '@/lib/utils'

export default function OrdersPage() {
  const locale = useStore((s) => s.locale)
  const orders = useStore((s) => s.orders)

  const statusMeta = {
    processing: {
      label: locale === 'fa' ? 'در حال آماده‌سازی' : 'Preparing',
      step: 1,
    },
    shipped: {
      label: locale === 'fa' ? 'ارسال شده' : 'Shipped',
      step: 2,
    },
    delivered: {
      label: locale === 'fa' ? 'تحویل شده' : 'Delivered',
      step: 3,
    },
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumb
        items={[{ label: locale === 'fa' ? 'سفارش‌ها' : 'Orders' }]}
      />

      <h1 className="text-2xl sm:text-3xl font-bold text-[#f4f4f6]">
        {locale === 'fa' ? 'سفارش‌های من' : 'My Orders'}
      </h1>

      {orders.length === 0 ? (
        <div className="rounded-3xl surface-level-1 p-10 text-center space-y-4">
          <PackageOpen className="w-10 h-10 text-[#dfc08e] mx-auto" />
          <p className="text-sm font-semibold text-[#f4f4f6]">
            {locale === 'fa'
              ? 'هنوز سفارشی ثبت نشده است.'
              : 'No orders have been placed yet.'}
          </p>
          <div className="pt-1">
            <Link
              href="/products"
              className="inline-flex px-6 py-3 rounded-xl champagne-btn font-bold text-xs"
            >
              {locale === 'fa' ? 'مشاهده محصولات' : 'Browse Products'}
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const meta = statusMeta[order.status]
            return (
              <div
                key={order.id}
                className="rounded-3xl surface-level-1 p-6 space-y-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#f4f4f6]">
                        {order.orderNumber}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-[#1a2030] border border-[#dfc08e]/30 text-[#dfc08e]">
                        {meta.label}
                      </span>
                    </div>
                    <div className="text-xs text-[#979fb2]">
                      {order.createdAt} • {order.shippingAddress}
                    </div>
                  </div>

                  <div className="text-end">
                    <div className="text-xs text-[#979fb2]">
                      {locale === 'fa' ? 'مبلغ کل' : 'Total'}
                    </div>
                    <div className="text-base font-bold text-[#dfc08e]">
                      {formatPrice(order.total, locale, order.total_toman)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    {
                      s: 1,
                      icon: Clock,
                      label: locale === 'fa' ? 'بسته‌بندی' : 'Packing',
                    },
                    {
                      s: 2,
                      icon: Truck,
                      label: locale === 'fa' ? 'ارسال' : 'Shipped',
                    },
                    {
                      s: 3,
                      icon: CheckCircle2,
                      label: locale === 'fa' ? 'تحویل' : 'Delivered',
                    },
                  ].map(({ s, icon: Icon, label }) => {
                    const active = meta.step >= s
                    return (
                      <div
                        key={s}
                        className={`rounded-xl p-3 border flex items-center gap-2 ${
                          active
                            ? 'bg-[#1a2030] border-[#dfc08e]/40 text-[#f4f4f6]'
                            : 'bg-[#0b0d16]/70 border-white/[0.05] text-[#666e82]'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0 text-[#dfc08e]" />
                        <span className="font-medium truncate">{label}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl card-level-2 p-3 flex items-center gap-3.5"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-14 object-cover rounded-lg product-pedestal-stage"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-bold text-[#f4f4f6] truncate">
                          {locale === 'fa' ? item.name_fa : item.name}
                        </div>
                        <div className="text-[11px] text-[#979fb2]">
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
      )}
    </div>
  )
}
