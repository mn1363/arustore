'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, PackageCheck } from 'lucide-react'
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
            ? `سفارش ${order.orderNumber} ثبت شد`
            : `Order ${order.orderNumber} confirmed`,
        type: 'success',
      })
    }, 650)
  }

  if (completedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="rounded-3xl bg-[#14161a] p-8 sm:p-12 border border-white/[0.08] text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#d6b88a]/15 border border-[#d6b88a]/35 text-[#d6b88a] mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-[#f2f2f0]">
            {locale === 'fa' ? 'سفارش شما ثبت شد' : 'Order Confirmed'}
          </h1>
          <p className="text-sm text-[#9ca0ab] max-w-md mx-auto leading-relaxed">
            {locale === 'fa'
              ? `سفارش به شماره ${completedOrder.orderNumber} برای «${completedOrder.customerName}» ثبت شد و در حال آماده‌سازی برای ارسال است.`
              : `Order ${completedOrder.orderNumber} for ${completedOrder.customerName} is being prepared for dispatch.`}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/orders"
              className="px-6 py-3 rounded-xl champagne-btn font-bold text-sm flex items-center gap-2"
            >
              <PackageCheck className="w-4 h-4" />
              <span>{locale === 'fa' ? 'پیگیری سفارش' : 'Track Order'}</span>
            </Link>
            <Link
              href="/products"
              className="px-6 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-sm font-medium text-[#d4d6dc]"
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
          { label: locale === 'fa' ? 'تسویه حساب' : 'Checkout' },
        ]}
      />

      <h1 className="text-2xl sm:text-3xl font-bold text-[#f2f2f0]">
        {locale === 'fa' ? 'تسویه حساب' : 'Checkout'}
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
