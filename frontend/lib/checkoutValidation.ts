import { CreateOrderPayload, Locale } from '@/types'
import { normalizeDigitsToAscii } from '@/lib/api/orders'

export interface ShippingData {
  fullName: string
  phone: string
  city: string
  address: string
  postalCode: string
  notes?: string
}

export interface ShippingFieldErrors {
  fullName?: string
  phone?: string
  city?: string
  address?: string
  postalCode?: string
}

export function validateShippingForm(
  data: ShippingData,
  locale: Locale
): { valid: boolean; errors: ShippingFieldErrors } {
  const errors: ShippingFieldErrors = {}

  const fullName = (data.fullName || '').trim()
  const phoneAscii = normalizeDigitsToAscii(data.phone || '').trim()
  const phoneDigitsOnly = phoneAscii.replace(/[\s\-()+]/g, '')
  const city = (data.city || '').trim()
  const address = (data.address || '').trim()
  const postalAscii = normalizeDigitsToAscii(data.postalCode || '')
    .replace(/[\s\-]/g, '')
    .trim()

  if (fullName.length < 2) {
    errors.fullName =
      locale === 'fa'
        ? 'نام و نام خانوادگی باید حداقل ۲ حرف باشد.'
        : 'Full name must be at least 2 characters.'
  }

  if (
    !phoneDigitsOnly ||
    phoneDigitsOnly.length < 8 ||
    phoneDigitsOnly.length > 15 ||
    !/^\d+$/.test(phoneDigitsOnly)
  ) {
    errors.phone =
      locale === 'fa'
        ? 'شماره تماس معتبر وارد کنید.'
        : 'Enter a valid phone number.'
  }

  if (city.length < 2) {
    errors.city =
      locale === 'fa'
        ? 'نام شهر را وارد کنید.'
        : 'Enter your city.'
  }

  if (address.length < 5) {
    errors.address =
      locale === 'fa'
        ? 'نشانی دقیق تحویل باید حداقل ۵ کاراکتر باشد.'
        : 'Street address must be at least 5 characters.'
  }

  if (postalAscii && (!/^\d+$/.test(postalAscii) || postalAscii.length < 5 || postalAscii.length > 12)) {
    errors.postalCode =
      locale === 'fa'
        ? 'کد پستی واردشده معتبر نیست.'
        : 'Enter a valid postal code.'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

export function buildCreateOrderPayload(
  shipping: ShippingData,
  promoCode: string | null | undefined,
  locale: Locale
): CreateOrderPayload {
  const city = (shipping.city || '').trim()
  const street = (shipping.address || '').trim()
  const combinedAddress = city
    ? locale === 'fa'
      ? `${city}، ${street}`
      : `${street}, ${city}`
    : street

  const normalizedPhone = normalizeDigitsToAscii(shipping.phone || '').trim()
  const normalizedPostal = normalizeDigitsToAscii(shipping.postalCode || '')
    .replace(/[\s\-]/g, '')
    .trim()
  const trimmedNotes = (shipping.notes || '').trim()
  const trimmedPromo = (promoCode || '').trim()

  return {
    customer_name: (shipping.fullName || '').trim(),
    customer_phone: normalizedPhone || null,
    shipping_address: combinedAddress,
    postal_code: normalizedPostal || null,
    notes: trimmedNotes || null,
    promo_code: trimmedPromo || null,
  }
}
