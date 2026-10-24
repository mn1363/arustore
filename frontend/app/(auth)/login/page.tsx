'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/lib/store/useStore'

export default function LoginPage() {
  const router = useRouter()
  const locale = useStore((s) => s.locale)
  const pushToast = useStore((s) => s.pushToast)
  const { loginDemoUser } = useAuth()

  const [email, setEmail] = useState('arian@arustore.ir')
  const [password, setPassword] = useState('••••••••••••')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loginDemoUser(true, undefined, email)
    pushToast({
      title: locale === 'fa' ? 'خوش آمدید' : 'Welcome back',
      type: 'success',
    })
    router.push('/profile')
  }

  return (
    <div className="w-full max-w-4xl rounded-3xl bg-[#14161a] border border-white/[0.08] overflow-hidden grid grid-cols-1 md:grid-cols-12">
      <div className="md:col-span-6 p-8 sm:p-10 space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f2f2f0]">
            {locale === 'fa' ? 'ورود به حساب کاربری' : 'Sign In'}
          </h1>
          <p className="text-xs text-[#8e93a0]">
            {locale === 'fa'
              ? 'مشاهده سفارش‌ها و مدیریت لیست علاقه‌مندی‌ها'
              : 'Manage your orders and saved items'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={locale === 'fa' ? 'ایمیل' : 'Email'}
            dir="ltr"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label={locale === 'fa' ? 'رمز عبور' : 'Password'}
            dir="ltr"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl champagne-btn font-bold text-sm transition-colors"
          >
            {locale === 'fa' ? 'ورود' : 'Sign In'}
          </button>
        </form>

        <div className="text-xs text-[#8e93a0] text-center pt-2">
          {locale === 'fa' ? 'حساب کاربری ندارید؟ ' : 'No account yet? '}
          <Link href="/register" className="text-[#d6b88a] font-bold hover:underline">
            {locale === 'fa' ? 'ثبت‌نام' : 'Create Account'}
          </Link>
        </div>
      </div>

      <div className="hidden md:block md:col-span-6 bg-[#101216] border-s border-white/[0.07]">
        <img
          src="/images/banners/hero-aluminum-atelier.png"
          alt="ظروف پذیرایی آلومینیومی آرو استور"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}
