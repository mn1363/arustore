'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
    loginDemoUser(true, fullName || 'کاربر آرو استور', email || 'user@arustore.ir')
    pushToast({
      title: locale === 'fa' ? 'حساب کاربری ساخته شد' : 'Account created',
      type: 'success',
    })
    router.push('/profile')
  }

  return (
    <div className="w-full max-w-md rounded-3xl bg-[#14161a] p-8 sm:p-10 border border-white/[0.08] space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#f2f2f0]">
        {locale === 'fa' ? 'ایجاد حساب کاربری' : 'Create Account'}
      </h1>

      <form onSubmit={handleRegister} className="space-y-4">
        <Input
          label={locale === 'fa' ? 'نام و نام خانوادگی' : 'Full Name'}
          placeholder={locale === 'fa' ? 'آرین رادمهر' : 'Full Name'}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          label={locale === 'fa' ? 'ایمیل' : 'Email'}
          dir="ltr"
          type="email"
          placeholder="you@arustore.ir"
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
          className="w-full py-3.5 rounded-xl champagne-btn font-bold text-sm"
        >
          {locale === 'fa' ? 'ثبت‌نام' : 'Create Account'}
        </button>
      </form>

      <div className="text-xs text-[#8e93a0] text-center">
        {locale === 'fa' ? 'قبلاً ثبت‌نام کرده‌اید؟ ' : 'Already have an account? '}
        <Link href="/login" className="text-[#d6b88a] font-bold hover:underline">
          {locale === 'fa' ? 'ورود' : 'Sign In'}
        </Link>
      </div>
    </div>
  )
}
