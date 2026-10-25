'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Info, ShoppingBag } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import ShippingForm, { ShippingData } from '@/components/checkout/ShippingForm'
import PaymentForm from '@/components/checkout/PaymentForm'
import OrderSummary from '@/components/checkout/OrderSummary'
import { useCart } from '@/hooks/useCart'
import { useStore } from '@/lib/store/useStore'
import { getDict } from '@/lib/data/i18n'

export default function CheckoutPage() {
  const locale = useStore((s) => s.locale)
  const user = useStore((s) => s.user)
  const authStatus = useStore((s) => s.authStatus)
  const dict = getDict(locale)
  const { cart, cartLoading } = useCart()

  const [shipping, setShipping] = useState<ShippingData>({
    fullName: '',
    phone: '',
    city: '',
    address: '',
    postalCode: '',
  })
  const [submitAttempted, setSubmitAttempted] = useState(false)

  useEffect(() => {
    if (!user) return
    setShipping((prev) => ({
      ...prev,
      fullName: prev.fullName || user.full_name || '',
      phone: prev.phone || user.phone || '',
    }))
  }, [user])

  const handleCheckoutAttempt = () => {
    // Order placement and payment belong to P0-C2:
    // never create a fake order, never show false confirmation, and never clear the cart.
    setSubmitAttempted(true)
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumb
        items={[
          { label: locale === 'fa' ? 'سبد خرید' : 'Bag', href: '/cart' },
          { label: locale === 'fa' ? 'تسویه حساب' : 'Checkout' },
        ]}
      />

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#f4f4f6]">
          {locale === 'fa' ? 'تسویه حساب امن' : 'Secure Checkout'}
        </h1>
        <p className="text-xs sm:text-sm text-[#979fb2]">
          {locale === 'fa'
            ? 'مرور اقلام سبد خرید پیش از فعال‌سازی ثبت سفارش و پرداخت آنلاین.'
            : 'Review your shopping bag items while order submission and online payment are being prepared.'}
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
              ? 'ثبت سفارش و پرداخت آنلاین هنوز فعال نیست'
              : 'Order submission and online payment are not yet available'}
          </h2>
          <p className="text-xs text-[#979fb2] leading-relaxed">
            {locale === 'fa'
              ? 'اقلام سبد خرید شما در حساب کاربری یا مرورگر حفظ شده‌اند، اما ثبت نهایی سفارش و پرداخت بانکی در این مرحله غیرفعال است. هیچ سفارش آزمایشی ایجاد نمی‌شود و سبد خرید شما پاک نخواهد شد.'
              : 'Your shopping bag items remain saved, while order placement and payment processing are not yet enabled. No simulated order will be created and your bag will not be cleared.'}
          </p>
        </div>
      </div>

      {submitAttempted && (
        <div
          role="alert"
          className="rounded-2xl surface-level-1 border border-[#dfc08e]/35 p-4 text-xs text-[#dfc08e]"
        >
          {locale === 'fa'
            ? 'در حال حاضر امکان ثبت سفارش و پرداخت فعال نیست. اقلام سبد خرید شما بدون تغییر باقی مانده است.'
            : 'Order submission and payment are currently unavailable. Your shopping bag remains unchanged.'}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <ShippingForm data={shipping} onChange={setShipping} />
          <PaymentForm />
        </div>
        <div className="lg:col-span-4">
          <OrderSummary onAttemptSubmit={handleCheckoutAttempt} />
        </div>
      </div>
    </div>
  )
}
