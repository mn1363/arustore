'use client'

import React from 'react'
import Link from 'next/link'
import { Award, LogOut, Mail, Phone, Shield, Sparkles, User } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/lib/store/useStore'
import { formatNumber } from '@/lib/utils'

export default function ProfilePage() {
  const locale = useStore((s) => s.locale)
  const orders = useStore((s) => s.orders)
  const wishlistIds = useStore((s) => s.wishlistIds)
  const { user, loginDemoUser, logoutUser } = useAuth()

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="glass-panel rounded-3xl p-10 border border-white/10 space-y-4">
          <User className="w-12 h-12 text-amber-400 mx-auto" />
          <h1 className="text-2xl font-black text-white">
            {locale === 'fa' ? 'ورود به حساب کاربری آرو استور' : 'Sign In Required'}
          </h1>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-black text-xs"
            >
              {locale === 'fa' ? 'صفحه ورود' : 'Go to Login'}
            </Link>
            <button
              onClick={() => loginDemoUser(true)}
              className="px-6 py-3 rounded-2xl glass-pill text-xs font-bold text-amber-300"
            >
              {locale === 'fa' ? 'ورود فوری آزمایشی VIP' : 'Instant Demo Login'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumb
        items={[{ label: locale === 'fa' ? 'پروفایل کاربری VIP' : 'VIP Profile' }]}
      />

      <div className="glass-panel rounded-[2.25rem] p-8 border border-amber-400/25 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-start">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 to-violet-600 text-slate-950 font-black text-3xl flex items-center justify-center shadow-neon-cyan">
            {user.full_name.slice(0, 1)}
          </div>
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/35 text-amber-300 text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>{user.loyalty_tier}</span>
            </div>
            <h1 className="text-2xl font-black text-white">{user.full_name}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                {user.email}
              </span>
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                {user.phone}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={logoutUser}
          className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-300 text-xs font-bold flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>{locale === 'fa' ? 'خروج از حساب' : 'Sign Out'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-panel rounded-3xl p-6 border border-white/10">
          <div className="text-xs text-slate-400">
            {locale === 'fa' ? 'امتیاز باشگاه مشتریان' : 'Loyalty Points'}
          </div>
          <div className="text-3xl font-black text-amber-300 mt-2">
            {formatNumber(user.loyalty_points, locale)}
          </div>
        </div>
        <div className="glass-panel rounded-3xl p-6 border border-white/10">
          <div className="text-xs text-slate-400">
            {locale === 'fa' ? 'کل سفارش‌های ثبت‌شده' : 'Total Orders'}
          </div>
          <div className="text-3xl font-black text-white mt-2">
            {formatNumber(orders.length, locale)}
          </div>
        </div>
        <div className="glass-panel rounded-3xl p-6 border border-white/10">
          <div className="text-xs text-slate-400">
            {locale === 'fa' ? 'کالاهای ذخیره‌شده' : 'Wishlist Saved'}
          </div>
          <div className="text-3xl font-black text-violet-300 mt-2">
            {formatNumber(wishlistIds.length, locale)}
          </div>
        </div>
      </div>

      {user.is_admin && (
        <div className="glass-panel rounded-3xl p-6 border border-violet-400/30 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-violet-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                {locale === 'fa'
                  ? 'دسترسی مدیریت ارشد آرو استور فعال است'
                  : 'Admin Studio Privileges Active'}
              </h3>
              <p className="text-xs text-slate-400">
                {locale === 'fa'
                  ? 'مدیریت موجودی محصولات، وضعیت سفارش‌ها و مشاهده آمار فروش زنده'
                  : 'Manage 3D product inventory, orders, and real-time analytics'}
              </p>
            </div>
          </div>
          <Link
            href="/admin"
            className="px-5 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-bold text-xs"
          >
            {locale === 'fa' ? 'ورود به پنل ادمین' : 'Open Admin Studio'}
          </Link>
        </div>
      )}
    </div>
  )
}
