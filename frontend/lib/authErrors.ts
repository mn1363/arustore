import type { Locale } from '@/types'
import { ApiError } from '@/lib/api/client'

export function formatAuthError(err: unknown, locale: Locale): string {
  if (err instanceof ApiError) {
    const msg = err.message.toLowerCase()

    if (err.status === 0) {
      return locale === 'fa'
        ? 'عدم دسترسی به سرویس احراز هویت. لطفاً اتصال سرور را بررسی کنید.'
        : 'Unable to reach the authentication server. Please try again.'
    }

    if (err.status === 401 || msg.includes('incorrect email/username or password')) {
      return locale === 'fa'
        ? 'ایمیل یا رمز عبور واردشده صحیح نیست.'
        : 'Incorrect email or password.'
    }

    if (err.status === 403 || msg.includes('inactive')) {
      return locale === 'fa'
        ? 'این حساب کاربری غیرفعال شده است.'
        : 'This account is inactive.'
    }

    if (err.status === 409) {
      if (msg.includes('email')) {
        return locale === 'fa'
          ? 'این نشانی ایمیل قبلاً ثبت شده است.'
          : 'This email address is already registered.'
      }
      if (msg.includes('phone')) {
        return locale === 'fa'
          ? 'این شماره همراه قبلاً ثبت شده است.'
          : 'This phone number is already registered.'
      }
      return locale === 'fa'
        ? 'اطلاعات واردشده تکراری است.'
        : 'An account with these details already exists.'
    }

    if (err.status === 422) {
      if (msg.includes('password') || msg.includes('8 character')) {
        return locale === 'fa'
          ? 'رمز عبور باید حداقل ۸ کاراکتر باشد.'
          : 'Password must be at least 8 characters long.'
      }
      if (msg.includes('email')) {
        return locale === 'fa'
          ? 'لطفاً یک نشانی ایمیل معتبر وارد کنید.'
          : 'Please enter a valid email address.'
      }
      if (msg.includes('phone') || msg.includes('mobile')) {
        return locale === 'fa'
          ? 'فرمت شماره همراه معتبر نیست.'
          : 'Invalid mobile phone number format.'
      }
      return locale === 'fa'
        ? 'لطفاً مقادیر فرم را به درستی تکمیل کنید.'
        : err.message
    }

    if (err.status >= 500) {
      return locale === 'fa'
        ? 'خطای داخلی سرور رخ داد. لطفاً کمی بعد دوباره تلاش کنید.'
        : 'Server error occurred. Please try again shortly.'
    }

    return err.message
  }

  return locale === 'fa'
    ? 'خطا در احراز هویت. لطفاً دوباره تلاش کنید.'
    : 'Authentication failed. Please try again.'
}

export function sanitizeRedirectTarget(
  rawNext: string | null | undefined,
  fallback = '/profile'
): string {
  if (!rawNext || typeof rawNext !== 'string') {
    return fallback
  }
  const trimmed = rawNext.trim()
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.includes('://') ||
    trimmed.startsWith('/login') ||
    trimmed.startsWith('/register')
  ) {
    return fallback
  }
  return trimmed
}
