'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, Info, ShoppingBag, UserCheck } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import ShippingForm, {
  ShippingData,
  ShippingFieldErrors,
} from '@/components/checkout/ShippingForm'
import PaymentForm from '@/components/checkout/PaymentForm'
import OrderSummary from '@/components/checkout/OrderSummary'
import { useCart } from '@/hooks/useCart'
import { useStore } from '@/lib/store/useStore'
import {
  buildCreateOrderPayload,
  validateShippingForm,
} from '@/lib/checkoutValidation'
import { formatNumber, formatPrice } from '@/lib/utils'
import { getDict } from '@/lib/data/i18n'
import { ServerOrder } from '@/types'

export default function CheckoutPage() {
  const locale = useStore((s) => s.locale)
  const user = useStore((s) => s.user)
  const authStatus = useStore((s) => s.authStatus)
  const orderSubmitting = useStore((s) => s.orderSubmitting)
  const orderSubmitError = useStore((s) => s.orderSubmitError)
  const submitCheckoutOrder = useStore((s) => s.submitCheckoutOrder)
  const dict = getDict(locale)
  const { cart, cartLoading, promoCode } = useCart()

  const [shipping, setShipping] = useState<ShippingData>({
    fullName: '',
    phone: '',
    city: '',
    address: '',
    postalCode: '',
    notes: '',
  })
  const [fieldErrors, setFieldErrors] = useState<ShippingFieldErrors>({})
  const [localAlert, setLocalAlert] = useState<string | null>(null)
  const [createdOrder, setCreatedOrder] = useState<ServerOrder | null>(null)

  useEffect(() => {
    if (!user) return
    setShipping((prev) => ({
      ...prev,
      fullName: prev.fullName || user.full_name || '',
      phone: prev.phone || user.phone || '',
    }))
  }, [user])

  const handleShippingChange = (next: ShippingData) => {
    setShipping(next)
    if (Object.keys(fieldErrors).length > 0) {
      setFieldErrors({})
    }
    if (localAlert) {
      setLocalAlert(null)
    }
  }

  const handleSubmitOrder = async () => {
    if (orderSubmitting) return
    setLocalAlert(null)

    if (!user) {
      setLocalAlert(
        locale === 'fa'
          ? 'برای ثبت سفارش ابتدا وارد حساب کاربری خود شوید. اقلام سبد خرید شما حفظ خواهند شد.'
          : 'Please sign in to submit your order. Your shopping bag items will be preserved.'
      )
      return
    }

    const validation = validateShippingForm(shipping, locale)
    setFieldErrors(validation.errors)
    if (!validation.valid) {
      setLocalAlert(
        locale === 'fa'
          ? 'لطفاً فیلدهای الزامی تحویل را به درستی تکمیل کنید.'
          : 'Please complete the required shipping fields before submitting.'
      )
      return
    }

    const payload = buildCreateOrderPayload(shipping, promoCode, locale)
    const result = await submitCheckoutOrder(payload)
    if (result.ok && result.order) {
      setCreatedOrder(result.order)
    } else if (result.error) {
      setLocalAlert(result.error)
    }
  }

  // Confirmed Pending-Payment Order State (never claims payment or fulfillment!)
  if (createdOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Breadcrumb
          items={[
            { label: locale === 'fa' ? 'سبد خرید' : 'Bag', href: '/cart' },
            { label: locale === 'fa' ? 'وضعیت ثبت سفارش' : 'Order Saved' },
          ]}
        />

        <div
          role="status"
          aria-live="polite"
          className="rounded-3xl surface-level-1 border border-[#dfc08e]/35 p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#1b2030] border border-[#dfc08e]/40 text-[#dfc08e] flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold text-[#f4f4f6]">
                  {locale === 'fa'
                    ? 'سفارش شما با وضعیت «در انتظار پرداخت» ذخیره شد'
                    : 'Order Saved — Pending Payment'}
                </h1>
                <p className="text-xs text-[#979fb2]">
                  {locale === 'fa' ? 'شماره سفارش:' : 'Order Number:'}{' '}
                  <span
                    dir="ltr"
                    className="font-mono font-bold text-[#dfc08e]"
                  >
                    {createdOrder.orderNumber}
                  </span>
                </p>
              </div>
            </div>

            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#dfc08e]/12 text-[#dfc08e] border border-[#dfc08e]/35">
              {locale === 'fa' ? 'در انتظار پرداخت' : 'Pending Payment'}
            </span>
          </div>

          <div className="rounded-2xl card-level-2 p-4 space-y-2 text-xs leading-relaxed border border-white/[0.06]">
            <p className="font-bold text-[#f4f4f6]">
              {locale === 'fa'
                ? 'پرداخت آنلاین در حال حاضر غیرفعال است و این سفارش پرداخت‌شده محسوب نمی‌شود'
                : 'Online payment is currently unavailable — this order has NOT been paid'}
            </p>
            <p className="text-[#979fb2]">
              {locale === 'fa'
                ? 'این سفارش صرفاً به عنوان رکورد «در انتظار پرداخت» در حساب شما ذخیره شده است، وارد مرحله آماده‌سازی یا ارسال نشده و موجودی کالاهای آن در انبار رزرو نشده است.'
                : 'Your order record is saved under your account with pending payment status. Fulfillment has not started and inventory is NOT reserved.'}
            </p>
          </div>

          <div className="space-y-3 pt-2 border-t border-white/[0.07]">
            <div className="text-xs font-bold text-[#b4bccf]">
              {locale === 'fa' ? 'اقلام ثبت‌شده' : 'Saved Items'}
            </div>
            <div className="space-y-2.5">
              {createdOrder.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl card-level-2 px-3.5 py-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-[#f4f4f6]">
                      {locale === 'fa' ? item.productNameFa : item.productName}
                    </span>
                    <span className="text-[#979fb2] ms-2">
                      × {formatNumber(item.quantity, locale)}
                    </span>
                  </div>
                  <span className="text-[#dfc08e] font-medium flex-shrink-0">
                    {formatPrice(
                      item.unitPriceUsd * item.quantity,
                      locale,
                      item.unitPriceToman * item.quantity
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-white/[0.07] text-xs sm:text-sm">
            {createdOrder.discountUsd > 0 && (
              <div className="flex justify-between text-[#dfc08e]">
                <span>
                  {dict.common.discount}
                  {createdOrder.promoCode ? ` (${createdOrder.promoCode})` : ''}
                </span>
                <span>- ${createdOrder.discountUsd.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center font-bold">
              <span className="text-[#f4f4f6]">
                {locale === 'fa'
                  ? 'مبلغ سفارش (پرداخت‌نشده)'
                  : 'Order Total (Unpaid)'}
              </span>
              <span className="text-lg text-[#dfc08e]">
                {formatPrice(
                  createdOrder.totalUsd,
                  locale,
                  createdOrder.totalToman
                )}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/orders"
              className="px-6 py-3 rounded-xl champagne-btn font-bold text-xs"
            >
              {locale === 'fa' ? 'مشاهده سفارش‌های من' : 'View My Orders'}
            </Link>
            <Link
              href="/products"
              className="px-5 py-3 rounded-xl secondary-3d-btn font-bold text-xs"
            >
              {dict.common.continueShopping}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const isInitialLoading =
    authStatus === 'loading' || (cartLoading && cart.length === 0)

  if (isInitialLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="rounded-3xl surface-level-1 p-12 text-center space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#dfc08e]/30 border-t-[#dfc08e] animate-spin mx-auto" />
          <p className="text-sm text-[#979fb2]">
            {locale === 'fa'
              ? 'در حال بارگذاری خلاصه سبد خرید...'
              : 'Loading your bag summary...'}
          </p>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="rounded-3xl surface-level-1 p-12 text-center space-y-5">
          <ShoppingBag className="w-10 h-10 text-[#666e82] mx-auto" />
          <h1 className="text-lg font-bold text-[#f4f4f6]">
            {dict.common.emptyCart}
          </h1>
          <Link
            href="/products"
            className="inline-flex px-6 py-3 rounded-xl champagne-btn font-bold text-sm"
          >
            {dict.common.continueShopping}
          </Link>
        </div>
      </div>
    )
  }

  const activeError = localAlert || orderSubmitError

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumb
        items={[
          { label: locale === 'fa' ? 'سبد خرید' : 'Bag', href: '/cart' },
          { label: locale === 'fa' ? 'ثبت سفارش' : 'Checkout' },
        ]}
      />

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#f4f4f6]">
          {locale === 'fa' ? 'ثبت سفارش' : 'Order Submission'}
        </h1>
        <p className="text-xs sm:text-sm text-[#979fb2]">
          {locale === 'fa'
            ? 'ثبت مشخصات تحویل و ذخیره سفارش با وضعیت «در انتظار پرداخت».'
            : 'Enter delivery details to save your order with Pending Payment status.'}
        </p>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl surface-level-1 border border-[#dfc08e]/30 p-5 flex items-start gap-3.5"
      >
        <div className="w-8 h-8 rounded-full bg-[#1b2030] border border-[#dfc08e]/40 text-[#dfc08e] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-[#f4f4f6]">
            {locale === 'fa'
              ? 'پرداخت آنلاین غیرفعال است • موجودی کالاها رزرو نمی‌شود'
              : 'Online payment is unavailable • Inventory is not reserved'}
          </h2>
          <p className="text-xs text-[#979fb2] leading-relaxed">
            {locale === 'fa'
              ? 'سفارش شما به صورت رسمی با وضعیت «در انتظار پرداخت» در حساب کاربری ذخیره می‌شود، اما تا زمان فعال‌سازی درگاه پرداخت هیچ مبلغی دریافت نمی‌شود، سفارش پرداخت‌شده تلقی نمی‌گردد و موجودی انبار رزرو نخواهد شد.'
              : 'Submitting saves an official pending-payment order under your account. No payment is processed, the order is not marked paid or fulfilled, and stock is not reserved.'}
          </p>
        </div>
      </div>

      {!user && (
        <div className="rounded-2xl surface-level-1 border border-white/[0.08] p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <UserCheck className="w-5 h-5 text-[#dfc08e] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-[#f4f4f6]">
                {locale === 'fa'
                  ? 'ورود به حساب کاربری برای ثبت سفارش الزامی است'
                  : 'Sign in required to submit your order'}
              </h2>
              <p className="text-xs text-[#979fb2]">
                {locale === 'fa'
                  ? 'اقلام سبد خرید مهمان شما حفظ شده و پس از ورود به صورت خودکار به حساب کاربری منتقل می‌شوند.'
                  : 'Your guest bag items are preserved and will automatically sync to your account once you sign in.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/login?next=/checkout"
              className="px-5 py-2.5 rounded-xl champagne-btn font-bold text-xs"
            >
              {locale === 'fa' ? 'ورود به حساب' : 'Sign In'}
            </Link>
            <Link
              href="/register?next=/checkout"
              className="px-4 py-2.5 rounded-xl secondary-3d-btn font-medium text-xs"
            >
              {locale === 'fa' ? 'ثبت‌نام' : 'Create Account'}
            </Link>
          </div>
        </div>
      )}

      {activeError && (
        <div
          role="alert"
          className="rounded-2xl bg-rose-500/10 border border-rose-500/35 p-4 text-xs text-rose-300"
        >
          {activeError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <ShippingForm
            data={shipping}
            errors={fieldErrors}
            disabled={orderSubmitting}
            onChange={handleShippingChange}
          />
          <PaymentForm />
        </div>
        <div className="lg:col-span-4">
          <OrderSummary
            isAuthenticated={Boolean(user)}
            isSubmitting={orderSubmitting}
            onSubmitOrder={() => void handleSubmitOrder()}
          />
        </div>
      </div>
    </div>
  )
}
