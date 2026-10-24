import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Locale, Product } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => persianDigits[Number(d)])
}

export function formatNumber(value: number, locale: Locale = 'fa'): string {
  const formatted = new Intl.NumberFormat('en-US').format(Math.round(value))
  return locale === 'fa' ? toPersianDigits(formatted) : formatted
}

export function formatPrice(
  usd: number,
  locale: Locale = 'fa',
  tomanOverride?: number
): string {
  if (locale === 'fa') {
    const toman = tomanOverride ?? Math.round(usd * 62000)
    return `${toPersianDigits(new Intl.NumberFormat('en-US').format(toman))} تومان`
  }
  return `$${usd.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function getProductTitle(product: Product, locale: Locale): string {
  return locale === 'fa' ? product.name_fa : product.name
}

export function getProductSubtitle(product: Product, locale: Locale): string {
  return locale === 'fa' ? product.subtitle_fa : product.subtitle
}

export function getProductDescription(product: Product, locale: Locale): string {
  return locale === 'fa' ? product.description_fa : product.description
}

export function calculateDiscount(price: number, comparePrice?: number): number {
  if (!comparePrice || comparePrice <= price) return 0
  return Math.round(((comparePrice - price) / comparePrice) * 100)
}
