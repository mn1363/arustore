import type { UserProfile } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export interface BackendUserDto {
  id: number
  email: string
  username: string
  full_name: string
  phone?: string | null
  avatar?: string | null
  loyalty_points?: number
  loyalty_tier?: string
  is_active?: boolean
  is_admin?: boolean
  is_verified?: boolean
  created_at?: string | null
}

export interface BrowserAuthSessionResponse {
  access_token: string
  token_type: string
  expires_in: number
  user: BackendUserDto
}

export function mapBackendUserToProfile(dto: BackendUserDto): UserProfile {
  let memberSince = String(new Date().getFullYear())
  if (dto.created_at) {
    const parsedYear = new Date(dto.created_at).getFullYear()
    if (!Number.isNaN(parsedYear)) {
      memberSince = String(parsedYear)
    }
  }
  return {
    id: dto.id,
    username: dto.username,
    full_name: dto.full_name,
    email: dto.email,
    phone: dto.phone ?? null,
    avatar: dto.avatar ?? undefined,
    is_admin: Boolean(dto.is_admin),
    is_verified: Boolean(dto.is_verified),
    member_since: memberSince,
    loyalty_tier: dto.loyalty_tier || 'Silver',
    loyalty_points: dto.loyalty_points ?? 0,
  }
}

// Short-lived access token lives strictly in JS module memory (never localStorage/Zustand).
let inMemoryAccessToken: string | null = null
let activeRefreshPromise: Promise<UserProfile | null> | null = null

let authSyncCallbacks: {
  onUserUpdated?: (user: UserProfile) => void
  onSessionCleared?: () => void
} = {}

export function registerAuthSyncCallbacks(callbacks: {
  onUserUpdated?: (user: UserProfile) => void
  onSessionCleared?: () => void
}): void {
  authSyncCallbacks = callbacks
}

export function setInMemoryAccessToken(token: string | null): void {
  inMemoryAccessToken = token
}

export function getInMemoryAccessToken(): string | null {
  return inMemoryAccessToken
}

export function clearInMemoryAccessToken(): void {
  inMemoryAccessToken = null
}

function extractApiErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'detail' in payload) {
    const detail = (payload as { detail: unknown }).detail
    if (typeof detail === 'string' && detail.trim()) {
      return detail.trim()
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const messages = detail
        .map((item) => {
          if (item && typeof item === 'object' && 'msg' in item) {
            return String((item as { msg: unknown }).msg).replace(
              /^Value error,\s*/i,
              ''
            )
          }
          return null
        })
        .filter((msg): msg is string => Boolean(msg))
      if (messages.length > 0) {
        return messages.join(' • ')
      }
    }
  }
  return `Request failed (${status})`
}

export interface ApiRequestOptions extends RequestInit {
  token?: string | null
  skipAuthRefresh?: boolean
}

async function refreshSessionSingleFlight(): Promise<UserProfile | null> {
  if (activeRefreshPromise) {
    return activeRefreshPromise
  }

  activeRefreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      })
      if (!response.ok) {
        clearInMemoryAccessToken()
        authSyncCallbacks.onSessionCleared?.()
        return null
      }
      const data = (await response.json()) as BrowserAuthSessionResponse
      setInMemoryAccessToken(data.access_token)
      const profile = mapBackendUserToProfile(data.user)
      authSyncCallbacks.onUserUpdated?.(profile)
      return profile
    } catch {
      clearInMemoryAccessToken()
      authSyncCallbacks.onSessionCleared?.()
      return null
    } finally {
      activeRefreshPromise = null
    }
  })()

  return activeRefreshPromise
}

async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
  isRetry = false
): Promise<T> {
  const { token, headers, skipAuthRefresh, ...rest } = options
  const mergedHeaders = new Headers(headers || {})
  if (
    !mergedHeaders.has('Content-Type') &&
    rest.body &&
    !(rest.body instanceof FormData)
  ) {
    mergedHeaders.set('Content-Type', 'application/json')
  }

  const effectiveToken = token !== undefined ? token : inMemoryAccessToken
  if (effectiveToken) {
    mergedHeaders.set('Authorization', `Bearer ${effectiveToken}`)
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...rest,
      credentials: rest.credentials ?? 'include',
      headers: mergedHeaders,
    })
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      'name' in err &&
      (err as { name?: unknown }).name === 'AbortError'
    ) {
      throw err
    }
    throw new ApiError('Network connection error', 0)
  }

  if (
    response.status === 401 &&
    !isRetry &&
    !skipAuthRefresh &&
    !path.startsWith('/auth/')
  ) {
    const refreshedUser = await refreshSessionSingleFlight()
    if (refreshedUser && inMemoryAccessToken) {
      return apiFetch<T>(
        path,
        { ...options, token: inMemoryAccessToken },
        true
      )
    }
  }

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}))
    throw new ApiError(
      extractApiErrorMessage(errorPayload, response.status),
      response.status
    )
  }

  return response.json() as Promise<T>
}

export const aruApi = {
  auth: {
    register: async (data: {
      email: string
      full_name: string
      password: string
      phone?: string
      username?: string
    }): Promise<{ user: UserProfile }> => {
      const payload = await apiFetch<BrowserAuthSessionResponse>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(data),
          token: null,
          skipAuthRefresh: true,
        }
      )
      setInMemoryAccessToken(payload.access_token)
      return { user: mapBackendUserToProfile(payload.user) }
    },

    login: async (
      email_or_username: string,
      password: string
    ): Promise<{ user: UserProfile }> => {
      const payload = await apiFetch<BrowserAuthSessionResponse>(
        '/auth/login/json',
        {
          method: 'POST',
          body: JSON.stringify({ email_or_username, password }),
          token: null,
          skipAuthRefresh: true,
        }
      )
      setInMemoryAccessToken(payload.access_token)
      return { user: mapBackendUserToProfile(payload.user) }
    },

    refresh: async (): Promise<UserProfile | null> => {
      return refreshSessionSingleFlight()
    },

    logout: async (): Promise<void> => {
      const currentToken = inMemoryAccessToken
      try {
        await apiFetch(
          '/auth/logout',
          {
            method: 'POST',
            token: currentToken,
            skipAuthRefresh: true,
          },
          true
        )
      } catch {
        // Even if token already expired on server, ensure local state clears cleanly.
      } finally {
        clearInMemoryAccessToken()
      }
    },
  },
  users: {
    me: async (): Promise<UserProfile> => {
      const dto = await apiFetch<BackendUserDto>('/users/me')
      return mapBackendUserToProfile(dto)
    },
  },
  admin: {
    dashboard: () => apiFetch<Record<string, unknown>>('/admin/dashboard'),
  },
  catalog: {
    listProducts: <T = unknown>(query = '', options?: ApiRequestOptions) =>
      apiFetch<T>(`/products/${query ? `?${query}` : ''}`, {
        skipAuthRefresh: true,
        ...options,
      }),
    getProduct: <T = unknown>(
      slugOrId: string | number,
      options?: ApiRequestOptions
    ) =>
      apiFetch<T>(`/products/${encodeURIComponent(String(slugOrId))}`, {
        skipAuthRefresh: true,
        ...options,
      }),
    getRelatedProducts: <T = unknown>(
      productId: number,
      limit = 4,
      options?: ApiRequestOptions
    ) =>
      apiFetch<T>(`/products/${productId}/related?limit=${limit}`, {
        skipAuthRefresh: true,
        ...options,
      }),
    listCategories: <T = unknown>(options?: ApiRequestOptions) =>
      apiFetch<T>('/categories/', {
        skipAuthRefresh: true,
        ...options,
      }),
    listBrands: <T = unknown>(options?: ApiRequestOptions) =>
      apiFetch<T>('/brands/', {
        skipAuthRefresh: true,
        ...options,
      }),
  },
  cart: {
    get: <T = unknown>(promoCode?: string | null, options?: ApiRequestOptions) =>
      apiFetch<T>(
        `/cart/${promoCode ? `?promo_code=${encodeURIComponent(promoCode)}` : ''}`,
        options
      ),
    addItem: <T = unknown>(
      payload: {
        product_id: number
        quantity: number
        selected_color?: Record<string, unknown> | null
        selected_edition?: string | null
      },
      options?: ApiRequestOptions
    ) =>
      apiFetch<T>('/cart/items', {
        method: 'POST',
        body: JSON.stringify(payload),
        ...options,
      }),
    updateItem: <T = unknown>(
      itemId: number,
      quantity: number,
      options?: ApiRequestOptions
    ) =>
      apiFetch<T>(`/cart/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
        ...options,
      }),
    removeItem: <T = unknown>(itemId: number, options?: ApiRequestOptions) =>
      apiFetch<T>(`/cart/items/${itemId}`, {
        method: 'DELETE',
        ...options,
      }),
    clear: <T = unknown>(options?: ApiRequestOptions) =>
      apiFetch<T>('/cart/', {
        method: 'DELETE',
        ...options,
      }),
    applyPromo: <T = unknown>(code: string, options?: ApiRequestOptions) =>
      apiFetch<T>('/cart/apply-promo', {
        method: 'POST',
        body: JSON.stringify({ code }),
        ...options,
      }),
  },
  orders: {
    create: (token: string | undefined, payload: Record<string, unknown>) =>
      apiFetch('/orders/', {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      }),
    listMine: (token?: string) => apiFetch('/orders/', { token }),
  },
  reviews: {
    listForProduct: <T = unknown>(
      productId: number,
      options?: ApiRequestOptions
    ) =>
      apiFetch<T>(`/reviews/product/${productId}`, {
        skipAuthRefresh: true,
        ...options,
      }),
    create: (
      token: string | undefined,
      payload: {
        product_id: number
        rating: number
        title?: string
        comment: string
      }
    ) =>
      apiFetch('/reviews/', {
        method: 'POST',
        token,
        body: JSON.stringify(payload),
      }),
  },
  wishlist: {
    list: <T = unknown>(options?: ApiRequestOptions) =>
      apiFetch<T>('/wishlist/', options),
    add: <T = unknown>(productId: number, options?: ApiRequestOptions) =>
      apiFetch<T>(`/wishlist/${productId}`, { method: 'POST', ...options }),
    remove: <T = unknown>(productId: number, options?: ApiRequestOptions) =>
      apiFetch<T>(`/wishlist/${productId}`, { method: 'DELETE', ...options }),
  },
  analytics: {
    trackEvent: (
      event_type: string,
      product_id?: number,
      metadata: Record<string, unknown> = {}
    ) =>
      apiFetch('/analytics/events', {
        method: 'POST',
        body: JSON.stringify({ event_type, product_id, metadata }),
      }),
  },
}
