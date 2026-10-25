'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Select from '@/components/ui/Select'
import { useStore } from '@/lib/store/useStore'
import {
  fetchAdminOrders,
  getAllowedAdminOrderStatusOptions,
  updateAdminOrderStatus,
} from '@/lib/api/orders'
import { formatPrice } from '@/lib/utils'
import { ServerOrder } from '@/types'

export default function AdminOrdersPage() {
  const locale = useStore((s) => s.locale)
  const pushToast = useStore((s) => s.pushToast)

  const [orders, setOrders] = useState<ServerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await fetchAdminOrders()
      setOrders(list)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : locale === 'fa'
          ? 'خطا در دریافت سفارش‌ها'
          : 'Failed to load orders'
      )
    } finally {
      setLoading(false)
    }
  }, [locale])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const handleStatusChange = async (orderId: number, nextStatus: string) => {
    setUpdatingId(orderId)
    try {
      const updated = await updateAdminOrderStatus(orderId, nextStatus)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updated : o))
      )
      pushToast({
        title:
          locale === 'fa'
            ? 'وضعیت سفارش به‌روزرسانی شد'
            : 'Order status updated',
        type: 'success',
      })
    } catch (err) {
      pushToast({
        title:
          err instanceof Error
            ? err.message
            : locale === 'fa'
            ? 'خطا در به‌روزرسانی وضعیت'
            : 'Unable to update order status',
        type: 'error',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#f4f4f6]">
          {locale === 'fa' ? 'مدیریت سفارش‌ها' : 'Manage Orders'}
        </h1>
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadAll()}
          className="px-4 py-2 rounded-xl secondary-3d-btn text-xs font-medium disabled:opacity-60"
        >
          {locale === 'fa' ? 'به‌روزرسانی' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl bg-rose-500/10 border border-rose-500/35 p-4 text-xs text-rose-300"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl surface-level-1 p-10 text-center text-xs text-[#979fb2]">
          {locale === 'fa' ? 'در حال دریافت سفارش‌ها...' : 'Loading orders...'}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl surface-level-1 p-10 text-center text-sm text-[#979fb2]">
          {locale === 'fa' ? 'سفارشی ثبت نشده است.' : 'No orders found.'}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const allowedOptions = getAllowedAdminOrderStatusOptions(
              order,
              locale
            )
            const isTerminalOrLocked = allowedOptions.length <= 1

            return (
              <div
                key={order.id}
                className="rounded-2xl surface-level-1 p-5 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      dir="ltr"
                      className="text-sm font-mono font-bold text-[#f4f4f6]"
                    >
                      {order.orderNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        order.paymentStatus === 'paid'
                          ? 'bg-emerald-500/12 text-emerald-300 border border-emerald-500/30'
                          : 'bg-[#dfc08e]/12 text-[#dfc08e] border border-[#dfc08e]/30'
                      }`}
                    >
                      {order.paymentStatus === 'paid'
                        ? locale === 'fa'
                          ? 'پرداخت شده'
                          : 'Paid'
                        : locale === 'fa'
                        ? 'پرداخت نشده (عدم رزرو موجودی)'
                        : 'Unpaid (Stock Not Reserved)'}
                    </span>
                  </div>
                  <div className="text-xs text-[#979fb2]">
                    {order.customerName} • {order.shippingAddress}
                  </div>
                  <div className="text-xs font-bold text-[#dfc08e]">
                    {formatPrice(order.totalUsd, locale, order.totalToman)}
                  </div>
                </div>

                <div className="w-56 space-y-1">
                  <Select
                    value={order.status}
                    disabled={updatingId === order.id || isTerminalOrLocked}
                    onChange={(e) => {
                      if (e.target.value !== order.status) {
                        void handleStatusChange(order.id, e.target.value)
                      }
                    }}
                    options={allowedOptions}
                  />
                  {order.paymentStatus !== 'paid' &&
                    order.status !== 'cancelled' && (
                      <p className="text-[11px] text-[#979fb2]">
                        {locale === 'fa'
                          ? 'ارسال سفارش پیش از پرداخت مجاز نیست'
                          : 'Fulfillment statuses require payment'}
                      </p>
                    )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
