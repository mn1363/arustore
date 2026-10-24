'use client'

import React from 'react'
import Link from 'next/link'
import { Boxes, DollarSign, ShoppingBag, TrendingUp, Users } from 'lucide-react'
import { useStore } from '@/lib/store/useStore'
import { formatNumber, formatPrice } from '@/lib/utils'

export default function AdminDashboardPage() {
  const locale = useStore((s) => s.locale)
  const products = useStore((s) => s.products)
  const orders = useStore((s) => s.orders)

  const totalRevenueUsd = orders.reduce((acc, o) => acc + o.total, 0) + 18420
  const totalRevenueToman = orders.reduce((acc, o) => acc + o.total_toman, 0) + 1142000000

  const kpis = [
    {
      label: locale === 'fa' ? 'فروش کل استودیو' : 'Total Revenue',
      value: formatPrice(totalRevenueUsd, locale, totalRevenueToman),
      delta: '+28.4%',
      icon: DollarSign,
      accent: 'text-amber-300 bg-amber-500/15 border-amber-400/30',
    },
    {
      label: locale === 'fa' ? 'سفارش‌های فعال و تکمیل‌شده' : 'VIP Orders',
      value: formatNumber(orders.length + 124, locale),
      delta: '+14.2%',
      icon: ShoppingBag,
      accent: 'text-violet-300 bg-violet-500/15 border-violet-400/30',
    },
    {
      label: locale === 'fa' ? 'مدل‌های سه‌بعدی فعال' : 'Active 3D SKUs',
      value: formatNumber(products.length, locale),
      delta: '100% WebGL',
      icon: Boxes,
      accent: 'text-amber-300 bg-amber-500/15 border-amber-400/30',
    },
    {
      label: locale === 'fa' ? 'نرخ تبدیل بازدید سه‌بعدی' : '3D Conversion Rate',
      value: locale === 'fa' ? '۶.۸٪' : '6.8%',
      delta: '+2.1x vs 2D',
      icon: Users,
      accent: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/30',
    },
  ]

  const monthlyBars = [42, 58, 51, 74, 69, 88, 96]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          {locale === 'fa'
            ? 'مرکز فرماندهی و مدیریت آرو استور'
            : 'AruStore Spatial Command Center'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {locale === 'fa'
            ? 'پایش لحظه‌ای فروش، تعامل با مدل‌های سه‌بعدی و مدیریت موجودی انبار'
            : 'Live telemetry across 3D WebGL engagement, orders, and flagship inventory'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon
          return (
            <div
              key={i}
              className="glass-panel rounded-3xl p-5 border border-white/10 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl border ${kpi.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {kpi.delta}
                </span>
              </div>
              <div>
                <div className="text-xs text-slate-400">{kpi.label}</div>
                <div className="text-lg sm:text-xl font-black text-white mt-1">
                  {kpi.value}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Revenue Chart + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white">
              {locale === 'fa'
                ? 'روند رشد فروش و تعامل سه‌بعدی (۷ هفته اخیر)'
                : '7-Week Spatial Commerce Growth'}
            </h2>
            <span className="text-xs text-amber-300 font-bold">LIVE TELEMETRY</span>
          </div>

          <div className="h-52 flex items-end justify-between gap-3 pt-6 px-2">
            {monthlyBars.map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div
                  className="w-full rounded-t-xl bg-gradient-to-t from-violet-600/70 via-cyan-500/80 to-cyan-300 shadow-neon-cyan transition-all duration-500"
                  style={{ height: `${val}%` }}
                />
                <span className="text-[11px] text-slate-400">
                  {locale === 'fa' ? `هفته ${formatNumber(idx + 1, 'fa')}` : `W${idx + 1}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white">
              {locale === 'fa' ? 'آخرین سفارش‌های VIP' : 'Recent VIP Orders'}
            </h2>
            <Link href="/admin/orders" className="text-xs text-amber-300 hover:underline">
              {locale === 'fa' ? 'همه سفارش‌ها' : 'Manage All'}
            </Link>
          </div>

          <div className="space-y-3">
            {orders.slice(0, 4).map((ord) => (
              <div
                key={ord.id}
                className="rounded-2xl bg-obsidian-950/75 border border-white/[0.07] p-3.5 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-mono font-bold text-white">
                    {ord.orderNumber}
                  </div>
                  <div className="text-[11px] text-slate-400">{ord.customerName}</div>
                </div>
                <div className="text-end">
                  <div className="text-xs font-extrabold text-amber-300">
                    {formatPrice(ord.total, locale, ord.total_toman)}
                  </div>
                  <div className="text-[10px] text-emerald-400 uppercase">{ord.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
