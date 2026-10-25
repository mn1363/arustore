'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { Package, RefreshCw, User } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/lib/store/useStore'
import { formatNumber, formatPrice } from '@/lib/utils'
import { Locale, ServerOrder } from '@/types'

function getOrderStatusMeta(status: string, locale: Locale) {
  switch (status) {
    case 'pending_payment':
      return {
        label: locale === 'fa' ? 'در انتظار پرداخت' : 'Pending Payment',
        className:
          'bg-[#dfc08e]/12 text-[#dfc08e] border border-[#dfc08e]/35',
      }
    case 'processing':
      return {
        label: locale === 'fa' ? 'در حال پردازش' : 'Processing',
        className: 'bg-sky-500/12 text-sky-300 border border-sky-500/30',
      }
    case 'shipped':
      return {
        label: locale === 'fa' ? 'ارسال شده' : 'Shipped',
        className:
          'bg-indigo-500/12 text-indigo-300 border border-indigo-500/30',
      }
    case 'delivered':
      return {
        label: locale === 'fa' ? 'تحویل شده' : 'Delivered',
        className:
          'bg-emerald-500/12 text-emerald-300 border border-emerald-500/30',
      }
    case 'cancelled':
      return {
        label: locale === 'fa' ? 'لغو شده' : 'Cancelled',
        className: 'bg-rose-500/12 text-rose-300 border border-rose-500/30',
      }
    default:
      return {
        label: status,
        className: 'bg-white/[0.05] text-[#b4bccf] border border-white/[0.1]',
      }
  }
}

function formatOrderDate(createdAt: string | null, locale: Locale): string {
  if (!createdAt) return '—'
  const d = new Date(createdAt)
  if (Number.isNaN(d.getTime())) return createdAt.slice(0, 10)
  try {
    return d.toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return createdAt.slice(0, 10)
  }
}

export default function OrdersPage() {
  const locale = useStore((s) => s.locale)
  const authOrders = useStore((s) => s.authOrders)
  const ordersLoading = useStore((s) => s.ordersLoading)
  const ordersError = useStore((s) => s.ordersError)
  const loadServerOrders = useStore((s) => s.loadServerOrders)
  const { user, isLoading: authLoading, bootstrapAuth } = useAuth()

  useEffect(() => {
    void bootstrapAuth()
  }, [bootstrapAuth])

  useEffect(() => {
    if (user) {
      void loadServerOrders()
    }
  }, [user, loadServerOrders])

  if (authLoading && !user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="rounded-3xl surface-level-1 p-10 space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#dfc08e]/30 border-t-[#dfc08e] animate-spin mx-auto" />
          <p className="text-xs text-[#979fb2]">
            {locale === 'fa'
              ? 'در حال بررسی وضعیت حساب کاربری...'
              : 'Checking your account session...'}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="rounded-3xl surface-level-1 p-10 space-y-5">
          <User className="w-10 h-10 text-[#dfc08e] mx-auto" />
          <h1 className="text-xl font-bold text-[#f4f4f6]">
            {locale === 'fa'
              ? 'ورود برای مشاهده سفارش‌ها'
              : 'Sign In to View Orders'}
          </h1>
          <p className="text-xs text-[#979fb2]">
            {locale === 'fa'
              ? 'برای دسترسی به فهرست سفارش‌های ثبت‌شده وارد حساب کاربری خود شوید.'
              : 'Sign in with your account to view your saved order records.'}
          </p>
          <div className="flex justify-center gap-3 pt-1">
            <Link
              href="/login?next=/orders"
              className="px-6 py-3 rounded-xl champagne-btn font-bold text-xs"
            >
              {locale === 'fa' ? 'ورود به حساب' : 'Sign In'}
            </Link>
            <Link
              href="/register?next=/orders"
              className="px-5 py-3 rounded-xl secondary-3d-btn text-xs font-medium"
            >
              {locale === 'fa' ? 'ایجاد حساب' : 'Create Account'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumb
        items={[{ label: locale === 'fa' ? 'سفارش‌ها' : 'Orders' }]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f4f4f6]">
            {locale === 'fa' ? 'سفارش‌های من' : 'My Orders'}
          </h1>
          <p className="text-xs text-[#979fb2]">
            {locale === 'fa'
              ? 'وضعیت سفارش‌های ثبت‌شده در حساب کاربری شما'
              : 'Saved order records associated with your account'}
          </p>
        </div>

        <button
          type="button"
          disabled={ordersLoading}
          onClick={() => void loadServerOrders()}
          className="px-4 py-2 rounded-xl secondary-3d-btn text-xs font-medium inline-flex items-center gap-2 disabled:opacity-60"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`}
          />
          <span>{locale === 'fa' ? 'به‌روزرسانی' : 'Refresh'}</span>
        </button>
      </div>

      {ordersError && (
        <div
          role="alert"
          className="rounded-2xl bg-rose-500/10 border border-rose-500/35 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-300"
        >
          <span>{ordersError}</span>
          <button
            type="button"
            onClick={() => void loadServerOrders()}
            className="px-3.5 py-1.5 rounded-lg secondary-3d-btn text-xs font-bold text-[#f4f4f6]"
          >
            {locale === 'fa' ? 'تلاش مجدد' : 'Retry'}
          </button>
        </div>
      )}

      {ordersLoading && authOrders.length === 0 ? (
        <div className="rounded-3xl surface-level-1 p-12 text-center space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#dfc08e]/30 border-t-[#dfc08e] animate-spin mx-auto" />
          <p className="text-xs text-[#979fb2]">
            {locale === 'fa'
              ? 'در حال دریافت سفارش‌های شما...'
              : 'Loading your orders...'}
          </p>
        </div>
      ) : authOrders.length === 0 ? (
        <div className="rounded-3xl surface-level-1 p-12 text-center space-y-5">
          <Package className="w-10 h-10 text-[#666e82] mx-auto" />
          <p className="text-sm text-[#979fb2]">
            {locale === 'fa'
              ? 'تاکنون سفارشی در حساب شما ثبت نشده است.'
              : 'You have not placed any orders yet.'}
          </p>
          <Link
            href="/products"
            className="inline-flex px-6 py-3 rounded-xl champagne-btn font-bold text-xs"
          >
            {locale === 'fa' ? 'مشاهده محصولات' : 'Explore Collection'}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {authOrders.map((order: ServerOrder) => {
            const statusMeta = getOrderStatusMeta(order.status, locale)
            const isPendingPayment =
              order.status === 'pending_payment' ||
              order.paymentStatus === 'pending'

            return (
              <div
                key={order.id}
                className="rounded-2xl surface-level-1 p-6 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div
                      dir="ltr"
                      className="text-sm font-mono font-bold text-[#f4f4f6]"
                    >
                      {order.orderNumber}
                    </div>
                    <div className="text-xs text-[#979fb2] mt-0.5">
                      {formatOrderDate(order.createdAt, locale)}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${statusMeta.className}`}
                    >
                      {statusMeta.label}
                    </span>
                    {order.paymentStatus === 'paid' && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                        {locale === 'fa' ? 'پرداخت شده' : 'Paid'}
                      </span>
                    )}
                  </div>
                </div>

                {isPendingPayment && order.status !== 'cancelled' && (
                  <div className="rounded-xl card-level-2 px-3.5 py-2.5 text-xs text-[#b4bccf] border border-[#dfc08e]/20">
                    {locale === 'fa'
                      ? 'پرداخت آنلاین انجام نشده است • این سفارش در مرحله ارسال قرار ندارد و موجودی کالا رزرو نشده است.'
                      : 'Payment has not been completed • Not in fulfillment and inventory is not reserved.'}
                  </div>
                )}

                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-xl card-level-2 px-3.5 py-2.5 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.productImage && (
                          <div className="w-11 h-10 rounded-lg product-pedestal-stage border border-white/[0.06] overflow-hidden flex-shrink-0">
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-[#f4f4f6] truncate">
                            {locale === 'fa'
                              ? item.productNameFa
                              : item.productName}
                          </div>
                          <div className="text-[11px] text-[#979fb2]">
                            {formatNumber(item.quantity, locale)} ×{' '}
                            {formatPrice(
                              item.unitPriceUsd,
                              locale,
                              item.unitPriceToman
                            )}
                            {(item.colorNameFa || item.colorName) && (
                              <span>
                                {' • '}
                                {locale === 'fa'
                                  ? item.colorNameFa || item.colorName
                                  : item.colorName || item.colorNameFa}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/[0.07] text-xs">
                  <span className="text-[#979fb2]">
                    {order.shippingAddress}
                  </span>
                  <span className="font-bold text-[#dfc08e]">
                    {formatPrice(order.totalUsd, locale, order.totalToman)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
