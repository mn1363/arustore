'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/lib/store/useStore'
import { formatAuthError, sanitizeRedirectTarget } from '@/lib/authErrors'

export default function LoginPage() {
  const router = useRouter()
  const locale = useStore((s) => s.locale)
  const pushToast = useStore((s) => s.pushToast)
  const { loginUser } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      setErrorMessage(
        locale === 'fa'
          ? 'لطفاً ایمیل و رمز عبور را وارد کنید.'
          : 'Please enter your email and password.'
      )
      return
    }

    setIsSubmitting(true)
    try {
      const authenticatedUser = await loginUser(trimmedEmail, password)
      pushToast({
        title: locale === 'fa' ? 'خوش آمدید' : 'Welcome back',
        type: 'success',
      })

      const rawNext =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('next')
          : null
      const defaultDest = authenticatedUser.is_admin ? '/admin' : '/profile'
      const target = rawNext
        ? sanitizeRedirectTarget(rawNext, defaultDest)
        : '/profile'
      router.replace(target)
    } catch (err) {
      setErrorMessage(formatAuthError(err, locale))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-4xl rounded-3xl glass-panel overflow-hidden grid grid-cols-1 md:grid-cols-12">
      <div className="md:col-span-6 p-8 sm:p-10 space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#f4f4f6]">
            {locale === 'fa' ? 'ورود به حساب کاربری' : 'Sign In'}
          </h1>
          <p className="text-xs text-[#979fb2]">
            {locale === 'fa'
              ? 'مشاهده سفارش‌ها و مدیریت لیست علاقه‌مندی‌ها'
              : 'Manage your orders and saved items'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl bg-rose-500/10 border border-rose-500/35 px-4 py-3 text-xs text-rose-300"
            >
              {errorMessage}
            </div>
          )}

          <Input
            label={locale === 'fa' ? 'ایمیل' : 'Email'}
            dir="ltr"
            type="email"
            autoComplete="email"
            placeholder="you@arustore.ir"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
          />
          <Input
            label={locale === 'fa' ? 'رمز عبور' : 'Password'}
            dir="ltr"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            required
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl champagne-btn font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? locale === 'fa'
                ? 'در حال ورود...'
                : 'Signing In...'
              : locale === 'fa'
              ? 'ورود'
              : 'Sign In'}
          </button>
        </form>

        <div className="text-xs text-[#979fb2] text-center pt-2">
          {locale === 'fa' ? 'حساب کاربری ندارید؟ ' : 'No account yet? '}
          <Link href="/register" className="text-[#dfc08e] font-bold hover:underline">
            {locale === 'fa' ? 'ثبت‌نام' : 'Create Account'}
          </Link>
        </div>
      </div>

      <div className="hidden md:block md:col-span-6 product-pedestal-stage border-s border-white/[0.08]">
        <img
          src="/images/banners/hero-aluminum-atelier.png"
          alt="ظروف پذیرایی آلومینیومی آرو استور"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}
