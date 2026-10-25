'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { useStore } from '@/lib/store/useStore'
import { formatAuthError, sanitizeRedirectTarget } from '@/lib/authErrors'

export default function RegisterPage() {
  const router = useRouter()
  const locale = useStore((s) => s.locale)
  const pushToast = useStore((s) => s.pushToast)
  const { registerUser } = useAuth()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string
    email?: string
    password?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const nextFieldErrors: {
      fullName?: string
      email?: string
      password?: string
    } = {}

    if (fullName.trim().length < 2) {
      nextFieldErrors.fullName =
        locale === 'fa'
          ? 'نام و نام خانوادگی باید حداقل ۲ حرف باشد.'
          : 'Full name must be at least 2 characters.'
    }
    if (!email.trim() || !email.includes('@')) {
      nextFieldErrors.email =
        locale === 'fa'
          ? 'نشانی ایمیل معتبر وارد کنید.'
          : 'Enter a valid email address.'
    }
    if (password.length < 8) {
      nextFieldErrors.password =
        locale === 'fa'
          ? 'رمز عبور باید حداقل ۸ کاراکتر باشد.'
          : 'Password must be at least 8 characters.'
    }

    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) {
      return
    }

    setIsSubmitting(true)
    try {
      await registerUser({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      })
      pushToast({
        title: locale === 'fa' ? 'حساب کاربری ساخته شد' : 'Account created',
        type: 'success',
      })
      const rawNext =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('next')
          : null
      const target = rawNext
        ? sanitizeRedirectTarget(rawNext, '/profile')
        : '/profile'
      router.replace(target)
    } catch (err) {
      setErrorMessage(formatAuthError(err, locale))
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextQueryParam =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('next')
      : null
  const loginHref = nextQueryParam
    ? `/login?next=${encodeURIComponent(nextQueryParam)}`
    : '/login'

  return (
    <div className="w-full max-w-md rounded-3xl glass-panel p-8 sm:p-10 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#f4f4f6]">
        {locale === 'fa' ? 'ایجاد حساب کاربری' : 'Create Account'}
      </h1>

      <form onSubmit={handleRegister} className="space-y-4" noValidate>
        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl bg-rose-500/10 border border-rose-500/35 px-4 py-3 text-xs text-rose-300"
          >
            {errorMessage}
          </div>
        )}

        <Input
          label={locale === 'fa' ? 'نام و نام خانوادگی' : 'Full Name'}
          placeholder={locale === 'fa' ? 'نام کامل خود را وارد کنید' : 'Full Name'}
          autoComplete="name"
          value={fullName}
          error={fieldErrors.fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={isSubmitting}
          required
        />
        <Input
          label={locale === 'fa' ? 'ایمیل' : 'Email'}
          dir="ltr"
          type="email"
          autoComplete="email"
          placeholder="you@arustore.ir"
          value={email}
          error={fieldErrors.email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          required
        />
        <Input
          label={locale === 'fa' ? 'رمز عبور' : 'Password'}
          dir="ltr"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={password}
          error={fieldErrors.password}
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
              ? 'در حال ثبت‌نام...'
              : 'Creating Account...'
            : locale === 'fa'
            ? 'ثبت‌نام'
            : 'Create Account'}
        </button>
      </form>

      <div className="text-xs text-[#979fb2] text-center">
        {locale === 'fa' ? 'قبلاً ثبت‌نام کرده‌اید؟ ' : 'Already have an account? '}
        <Link href={loginHref} className="text-[#dfc08e] font-bold hover:underline">
          {locale === 'fa' ? 'ورود' : 'Sign In'}
        </Link>
      </div>
    </div>
  )
}
