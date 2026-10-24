'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, PackageCheck, Sparkles } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import ShippingForm, { ShippingData } from '@/components/checkout/ShippingForm'
import PaymentForm, { CardData } from '@/components/checkout/PaymentForm'
import OrderSummary from '@/components/checkout/OrderSummary'
import { useStore } from '@/lib/store/useStore'
import { Order } from '@/types'

export default function CheckoutPage() {
  const locale = useStore((s) => s.locale)
  const placeOrder = useStore((s) => s.placeOrder)
  const pushToast = useStore((s) => s.pushToast)

  const [shipping, setShipping] = useState<ShippingData>({
    fullName: 'آرین رادمهر',
    phone: '09123456789',
    city: 'تهران',
    address: 'زعفرانیه، خیابان مقدس اردبیلی، پلاک ۴۲، واحد ۸',
    postalCode: '1987654321',
  })

  const [card, setCard] = useState<CardData>({
    cardNumber: '6037 9975 1234 8890',
    cardHolder: 'ARIAN RADMEHR',
    expiry: '08/29',
    cvv: '842',
  })

  const [submitting, setSubmitting] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)

  const handleCompleteOrder = () => {
    setSubmitting(true)
    setTimeout(() => {
      const order = placeOrder({
        customerName: shipping.fullName,
        shippingAddress: `${shipping.city}، ${shipping.address}`,
      })
      setCompletedOrder(order)
      setSubmitting(false)
      pushToast({
        title:
          locale === 'fa'
            ? `سفارش ${order.orderNumber} با موفقیت ثبت شد!`
            : `Order ${order.orderNumber} confirmed!`,
        type: 'success',
      })
    }, 850)
  }

  if (completedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="glass-panel rounded-[2.5rem] p-8 sm:p-12 border border-amber-400/35 text-center space-y-6 shadow-neon-cyan">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{completedOrder.orderNumber}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white">
            {locale === 'fa'
              ? 'سفارش VIP شما با موفقیت ثبت شد!'
              : 'Your VIP Order is Confirmed!'}
          </h1>
          <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            {locale === 'fa'
              ? `سفارش شما به نام «${completedOrder.customerName}» وارد واحد بسته‌بندی ضدضربه کلکسیونی آرو استور شد و از طریق صفحه پیگیری سفارش‌ها قابل مشاهده است.`
              : `Your flagship package for ${completedOrder.customerName} is now being prepared for VIP dispatch.`}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href="/orders"
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-black text-sm flex items-center gap-2"
            >
              <PackageCheck className="w-4 h-4" />
              <span>
                {locale === 'fa' ? 'پیگیری لحظه‌ای سفارش' : 'Track Your Order'}
              </span>
            </Link>
            <Link
              href="/products"
              className="px-6 py-3.5 rounded-2xl glass-pill text-sm font-bold text-slate-200 hover:text-white"
            >
              {locale === 'fa' ? 'بازگشت به فروشگاه' : 'Continue Shopping'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumb
        items={[
          { label: locale === 'fa' ? 'سبد خرید' : 'Bag', href: '/cart' },
          { label: locale === 'fa' ? 'تسویه حساب امن' : 'Checkout' },
        ]}
      />

      <h1 className="text-2xl sm:text-4xl font-black text-white">
        {locale === 'fa' ? 'تکمیل خرید امن سه‌بعدی' : 'Secure Spatial Checkout'}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <ShippingForm data={shipping} onChange={setShipping} />
          <PaymentForm data={card} onChange={setCard} />
        </div>
        <div className="lg:col-span-4">
          <OrderSummary
            onSubmitOrder={handleCompleteOrder}
            submitting={submitting}
          />
        </div>
      </div>
    </div>
  )
}
