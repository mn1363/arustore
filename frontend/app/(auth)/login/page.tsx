'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import Input from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/lib/store/useStore'

export default function LoginPage() {
  const router = useRouter()
  const locale = useStore((s) => s.locale)
  const pushToast = useStore((s) => s.pushToast)
  const { loginDemoUser } = useAuth()

  const [email, setEmail] = useState('arian@arustore.io')
  const [password, setPassword] = useState('••••••••••••')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    loginDemoUser(true, undefined, email)
    pushToast({
      title: locale === 'fa' ? 'خوش آمدید به آرو استور!' : 'Welcome back to AruStore!',
      type: 'success',
    })
    router.push('/profile')
  }

  return (
    <div className="w-full max-w-4xl glass-panel rounded-[2.25rem] border border-white/15 overflow-hidden grid grid-cols-1 md:grid-cols-12 shadow-glass-3d">
      <div className="md:col-span-6 p-8 sm:p-10 space-y-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ARU QUANTUM ID</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {locale === 'fa' ? 'ورود به حساب کاربری' : 'Sign In to Studio'}
          </h1>
          <p className="text-xs text-slate-400">
            {locale === 'fa'
              ? 'دسترسی به سفارش‌های VIP، لیست علاقه‌مندی‌ها و پنل مدیریت'
              : 'Access your VIP orders, saved 3D builds & profile'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={locale === 'fa' ? 'ایمیل کاربری' : 'Email Address'}
            dir="ltr"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label={locale === 'fa' ? 'گذرواژه امنیتی' : 'Password'}
            dir="ltr"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 font-black text-sm shadow-neon-cyan hover:brightness-110 transition-all"
          >
            {locale === 'fa' ? 'ورود به استودیو' : 'Sign In'}
          </button>
        </form>

        <div className="text-xs text-slate-400 text-center pt-2">
          {locale === 'fa' ? 'هنوز عضو نیستید؟ ' : 'New collector? '}
          <Link href="/register" className="text-cyan-300 font-bold hover:underline">
            {locale === 'fa' ? 'ساخت حساب VIP جدید' : 'Create VIP Account'}
          </Link>
        </div>
      </div>

      <div className="hidden md:flex md:col-span-6 relative bg-obsidian-950 items-center justify-center p-8 overflow-hidden border-s border-white/10">
        <img
          src="/images/banners/hero-aluminum-atelier.png"
          alt="آتلیه آلومینیوم آرو"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="relative z-10 text-center space-y-4">
          <img
            src="/images/products/tiered-stand.png"
            alt="شیرینی‌خوری سه‌طبقه آلومینیومی"
            className="w-60 h-60 object-contain rounded-2xl mx-auto animate-float-slow drop-shadow-[0_24px_40px_rgba(245,158,11,0.3)]"
          />
          <p className="text-sm font-bold text-white">
            {locale === 'fa'
              ? 'صنایع تولیدی ظروف پذیرایی آلومینیومی لوکس آرو'
              : 'Handcrafted Pure Aluminum Servingware Atelier'}
          </p>
        </div>
      </div>
    </div>
  )
}
