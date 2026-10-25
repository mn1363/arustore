'use client'

import React from 'react'
import { DollarSign, Package, ShoppingCart, Sparkles, TrendingUp } from 'lucide-react'
import { useStore } from '@/lib/store/useStore'
import { formatNumber, formatPrice } from '@/lib/utils'

export default function AdminDashboardPage() {
  const locale = useStore((s) => s.locale)
  const products = useStore((s) => s.products)
  const orders = useStore((s) => s.orders)

  const totalRevenueUsd = orders.reduce((acc, o) => acc + o.total, 0)
  const totalRevenueToman = orders.reduce((acc, o) => acc + o.total_toman, 0)
  const totalStock = products.reduce((acc, p) => acc + p.stock_quantity, 0)

  const kpis = [
    {
      icon: DollarSign,
      label: locale === 'fa' ? 'درآمد کل فروش' : 'Total Revenue',
      value: formatPrice(totalRevenueUsd, locale, totalRevenueToman),
      trend: '+28.4%',
    },
    {
      icon: ShoppingCart,
      label: locale === 'fa' ? 'سفارش‌های فعال' : 'Active Orders',
      value: formatNumber(orders.length, locale),
      trend: '+14.2%',
    },
    {
      icon: Package,
      label: locale === 'fa' ? 'موجودی کل انبار' : 'Units in Stock',
      value: formatNumber(totalStock, locale),
      trend: '100%',
    },
    {
      icon: Sparkles,
      label: locale === 'fa' ? 'نرخ بازدید صحنه ۳بعدی' : '3D Stage Engagement',
      value: locale === 'fa' ? '۶۴.۸٪' : '64.8%',
      trend: '+19.1%',
    },
  ]

  const monthlyBars = [42, 58, 51, 74, 69, 88, 95]
  const monthLabelsFa = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر']
  const monthLabelsEn = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#f4f4f6]">
          {locale === 'fa' ? 'داشبورد مدیریتی آرو استور' : 'Executive Overview'}
        </h1>
        <p className="text-xs sm:text-sm text-[#979fb2] mt-1">
          {locale === 'fa'
            ? 'پایش فروش، موجودی ظروف آلومینیوم و تعامل کاربران با صحنه‌های سه‌بعدی'
            : 'Real-time store performance, inventory, and 3D showcase engagement'}
        </p>
      </div>

      {/* Dimensional KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon
          return (
            <div
              key={idx}
              className="rounded-3xl card-level-2 p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#1b2030] border border-[#dfc08e]/30 flex items-center justify-center text-[#dfc08e]">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-bold">
                  <TrendingUp className="w-3 h-3" />
                  {kpi.trend}
                </span>
              </div>
              <div>
                <div className="text-xs text-[#979fb2]">{kpi.label}</div>
                <div className="text-xl font-bold text-[#f4f4f6] mt-1">{kpi.value}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Cohesive Champagne & Aether Revenue Chart + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-3xl surface-level-1 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#f4f4f6]">
              {locale === 'fa' ? 'روند رشد فروش ماهانه' : 'Monthly Sales Growth'}
            </h2>
            <span className="text-xs text-[#dfc08e] font-bold">
              {locale === 'fa' ? '۷ ماه اخیر' : 'Last 7 Months'}
            </span>
          </div>

          <div className="h-52 flex items-end justify-between gap-3 pt-6">
            {monthlyBars.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className="w-full max-w-[42px] rounded-t-xl transition-all hover:brightness-110"
                  style={{
                    height: `${val}%`,
                    background:
                      'linear-gradient(180deg, #eed2a4 0%, #c9a66f 55%, rgba(126, 166, 224, 0.35) 100%)',
                    boxShadow: '0 8px 20px -8px rgba(223, 192, 142, 0.35)',
                  }}
                />
                <span className="text-[11px] text-[#979fb2]">
                  {locale === 'fa' ? monthLabelsFa[i] : monthLabelsEn[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-3xl surface-level-1 p-6 space-y-4">
          <h2 className="text-base font-bold text-[#f4f4f6]">
            {locale === 'fa' ? 'آخرین سفارش‌های ثبت‌شده' : 'Latest Orders'}
          </h2>
          <div className="space-y-3">
            {orders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                className="rounded-2xl card-level-2 p-3.5 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-xs font-mono font-bold text-[#f4f4f6]">
                    {order.orderNumber}
                  </div>
                  <div className="text-[11px] text-[#979fb2]">{order.customerName}</div>
                </div>
                <div className="text-xs font-bold text-[#dfc08e]">
                  {formatPrice(order.total, locale, order.total_toman)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
