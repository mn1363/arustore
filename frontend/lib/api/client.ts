const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

export interface ApiRequestOptions extends RequestInit {
  token?: string | null
}

async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options
  const mergedHeaders = new Headers(headers || {})
  if (!mergedHeaders.has('Content-Type') && rest.body && !(rest.body instanceof FormData)) {
    mergedHeaders.set('Content-Type', 'application/json')
  }
  if (token) {
    mergedHeaders.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: mergedHeaders,
  })

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}))
    throw new Error(errorPayload?.detail || `API Error (${response.status})`)
  }

  return response.json() as Promise<T>
}

export const aruApi = {
  auth: {
    register: (data: {
      email: string
      full_name: string
      password: string
      phone?: string
    }) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (email_or_username: string, password: string) =>
      apiFetch('/auth/login/json', {
        method: 'POST',
        body: JSON.stringify({ email_or_username, password }),
      }),
    logout: (token: string) =>
      apiFetch('/auth/logout', { method: 'POST', token }),
  },
  catalog: {
    listProducts: (query = '') => apiFetch(`/products/${query ? `?${query}` : ''}`),
    getProduct: (slugOrId: string | number) => apiFetch(`/products/${slugOrId}`),
    listCategories: () => apiFetch('/categories/'),
    listBrands: () => apiFetch('/brands/'),
  },
  cart: {
    get: (token: string, promoCode?: string) =>
      apiFetch(`/cart/${promoCode ? `?promo_code=${encodeURIComponent(promoCode)}` : ''}`, {
        token,
      }),
    addItem: (
      token: string,
      payload: {
        product_id: number
        quantity: number
        selected_color?: Record<string, unknown>
        selected_edition?: string
      }
    ) =>
      apiFetch('/cart/items', {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      }),
    applyPromo: (token: string, code: string) =>
      apiFetch('/cart/apply-promo', {
        method: 'POST',
        token,
        body: JSON.stringify({ code }),
      }),
  },
  orders: {
    create: (token: string, payload: Record<string, unknown>) =>
      apiFetch('/orders/', {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      }),
    listMine: (token: string) => apiFetch('/orders/', { token }),
  },
  reviews: {
    listForProduct: (productId: number) =>
      apiFetch(`/reviews/product/${productId}`),
    create: (
      token: string,
      payload: { product_id: number; rating: number; title?: string; comment: string }
    ) =>
      apiFetch('/reviews/', {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      }),
  },
  wishlist: {
    list: (token: string) => apiFetch('/wishlist/', { token }),
    add: (token: string, productId: number) =>
      apiFetch(`/wishlist/${productId}`, { method: 'POST', token }),
    remove: (token: string, productId: number) =>
      apiFetch(`/wishlist/${productId}`, { method: 'DELETE', token }),
  },
  analytics: {
    trackEvent: (event_type: string, product_id?: number, metadata: Record<string, unknown> = {}) =>
      apiFetch('/analytics/events', {
        method: 'POST',
        body: JSON.stringify({ event_type, product_id, metadata }),
      }),
  },
}
