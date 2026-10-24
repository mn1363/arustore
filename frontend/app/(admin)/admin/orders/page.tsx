'use client'

import React from 'react'
import { useStore } from '@/lib/store/useStore'
import { formatPrice } from '@/lib/utils'
import { Order } from '@/types'

export default function AdminOrdersPage() {
  const locale = useStore((s) => s.locale)
  const orders = useStore((s) => s.orders)
  const updateOrderStatus = useStore((s) => s.updateOrderStatus)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-white">
        {locale === 'fa' ? 'مدیریت وضعیت سفارش‌ها' : 'VIP Order Fulfillment'}
      </h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="glass-panel rounded-3xl p-5 border border-white/10 flex flex-wrap items-center justify-between gap-4"
          >
            <div>
              <div className="font-mono font-bold text-white text-base">
                {order.orderNumber}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {order.customerName} • {order.shippingAddress}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm font-black text-amber-300">
                {formatPrice(order.total, locale, order.total_toman)}
              </div>

              <select
                value={order.status}
                onChange={(e) =>
                  updateOrderStatus(order.id, e.target.value as Order['status'])
                }
                className="rounded-xl bg-obsidian-900 border border-white/15 px-3 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="processing">
                  {locale === 'fa' ? 'در حال آماده‌سازی' : 'Processing'}
                </option>
                <option value="shipped">
                  {locale === 'fa' ? 'ارسال‌شده با پیک VIP' : 'Shipped'}
                </option>
                <option value="delivered">
                  {locale === 'fa' ? 'تحویل داده شده' : 'Delivered'}
                </option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
