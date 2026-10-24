'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import Input from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/lib/store/useStore'

export default function RegisterPage() {
  const router = useRouter()
  const locale = useStore((s) => s.locale)
  const pushToast = useStore((s) => s.pushToast)
  const { loginDemoUser } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    loginDemoUser(true, fullName || 'کاربر ویژه آرو', email || 'vip@arustore.io')
    pushToast({
      title:
        locale === 'fa'
          ? 'حساب VIP شما با موفقیت ساخته شد!'
          : 'VIP Account Created!',
      type: 'success',
    })
    router.push('/profile')
  }

  return (
    <div className="w-full max-w-lg glass-panel rounded-[2.25rem] p-8 sm:p-10 border border-white/15 space-y-6 shadow-glass-3d">
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>VIP MEMBERSHIP</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          {locale === 'fa' ? 'عضویت در کلاب سه‌بعدی آرو' : 'Create Collector Account'}
        </h1>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          label={locale === 'fa' ? 'نام و نام خانوادگی' : 'Full Name'}
          placeholder={locale === 'fa' ? 'آرین رادمهر' : 'Arian Radmehr'}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          label={locale === 'fa' ? 'ایمیل' : 'Email'}
          dir="ltr"
          type="email"
          placeholder="you@arustore.io"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label={locale === 'fa' ? 'رمز عبور' : 'Password'}
          dir="ltr"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 font-black text-sm shadow-neon-cyan"
        >
          {locale === 'fa' ? 'ثبت‌نام و دریافت هدیه خوش‌آمدگویی' : 'Join AruStore VIP'}
        </button>
      </form>

      <div className="text-xs text-slate-400 text-center">
        {locale === 'fa' ? 'قبلاً ثبت‌نام کرده‌اید؟ ' : 'Already a member? '}
        <Link href="/login" className="text-cyan-300 font-bold hover:underline">
          {locale === 'fa' ? 'ورود به حساب' : 'Sign In'}
        </Link>
      </div>
    </div>
  )
}
