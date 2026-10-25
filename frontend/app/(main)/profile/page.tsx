'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Mail, Phone, Shield, User } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/lib/store/useStore'
import { formatNumber } from '@/lib/utils'

export default function ProfilePage() {
  const router = useRouter()
  const locale = useStore((s) => s.locale)
  const orders = useStore((s) => s.orders)
  const wishlistIds = useStore((s) => s.wishlistIds)
  const pushToast = useStore((s) => s.pushToast)
  const { user, isLoading, bootstrapAuth, logoutUser } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    void bootstrapAuth()
  }, [bootstrapAuth])

  const handleLogout = async () => {
    setSigningOut(true)
    try {
      await logoutUser()
      pushToast({
        title: locale === 'fa' ? 'از حساب کاربری خارج شدید' : 'Signed out',
        type: 'info',
      })
      router.replace('/login')
    } finally {
      setSigningOut(false)
    }
  }

  if (isLoading && !user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="rounded-3xl glass-panel p-10 space-y-4">
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
        <div className="rounded-3xl glass-panel p-10 space-y-5">
          <User className="w-10 h-10 text-[#dfc08e] mx-auto" />
          <h1 className="text-xl font-bold text-[#f4f4f6]">
            {locale === 'fa' ? 'ورود به حساب کاربری' : 'Sign In Required'}
          </h1>
          <p className="text-xs text-[#979fb2]">
            {locale === 'fa'
              ? 'برای مشاهده مشخصات حساب و پیگیری سفارش‌ها وارد شوید.'
              : 'Sign in with your account credentials to view your profile.'}
          </p>
          <div className="flex justify-center gap-3 pt-1">
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl champagne-btn font-bold text-xs"
            >
              {locale === 'fa' ? 'صفحه ورود' : 'Sign In'}
            </Link>
            <Link
              href="/register"
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
        items={[{ label: locale === 'fa' ? 'حساب کاربری' : 'Account' }]}
      />

      <div className="rounded-3xl glass-panel p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-start">
          <div className="w-16 h-16 rounded-2xl champagne-btn font-bold text-2xl flex items-center justify-center">
            {user.full_name.slice(0, 1)}
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-[#f4f4f6]">{user.full_name}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[#979fb2]">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#dfc08e]" />
                {user.email}
              </span>
              {user.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#dfc08e]" />
                  {user.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={signingOut}
          className="px-4 py-2.5 rounded-xl secondary-3d-btn text-xs font-medium flex items-center gap-2 disabled:opacity-60"
        >
          <LogOut className="w-4 h-4" />
          <span>
            {signingOut
              ? locale === 'fa'
                ? 'در حال خروج...'
                : 'Signing Out...'
              : locale === 'fa'
              ? 'خروج'
              : 'Sign Out'}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="rounded-2xl card-level-2 p-6">
          <div className="text-xs text-[#979fb2]">
            {locale === 'fa' ? 'سفارش‌های ثبت‌شده' : 'Total Orders'}
          </div>
          <div className="text-2xl font-bold text-[#f4f4f6] mt-2">
            {formatNumber(orders.length, locale)}
          </div>
        </div>
        <div className="rounded-2xl card-level-2 p-6">
          <div className="text-xs text-[#979fb2]">
            {locale === 'fa' ? 'علاقه‌مندی‌ها' : 'Saved Items'}
          </div>
          <div className="text-2xl font-bold text-[#dfc08e] mt-2">
            {formatNumber(wishlistIds.length, locale)}
          </div>
        </div>
      </div>

      {user.is_admin && (
        <div className="rounded-2xl surface-level-1 p-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-[#dfc08e]" />
            <div>
              <h3 className="text-sm font-bold text-[#f4f4f6]">
                {locale === 'fa' ? 'مدیریت فروشگاه' : 'Store Admin'}
              </h3>
              <p className="text-xs text-[#979fb2]">
                {locale === 'fa'
                  ? 'مدیریت محصولات و بررسی سفارش‌ها'
                  : 'Manage products and orders'}
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="px-5 py-2.5 rounded-xl champagne-btn font-bold text-xs"
          >
            {locale === 'fa' ? 'پنل مدیریت' : 'Open Admin'}
          </Link>
        </div>
      )}
    </div>
  )
}
