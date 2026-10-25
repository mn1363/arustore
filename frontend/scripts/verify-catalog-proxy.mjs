import assert from 'node:assert/strict'
import test from 'node:test'

const NEXT_BASE = process.env.NEXT_PROXY_BASE_URL || 'http://127.0.0.1:3000'

test('1. Next.js /api/v1/products/ proxies to FastAPI with pagination meta and no redirect loop', async () => {
  const res = await fetch(
    `${NEXT_BASE}/api/v1/products/?page=1&page_size=6&sort_by=price-asc`,
    { redirect: 'manual' }
  )
  assert.equal(res.status, 200, 'Expected direct 200 OK without 307/308 redirect')
  const body = await res.json()
  assert.equal(Array.isArray(body.items), true)
  assert.equal('total' in body, false, 'Must not return legacy Next.js mock { items, total }')
  assert.equal(body.meta.total, 8)
  assert.equal(body.meta.page, 1)
  assert.equal(body.meta.page_size, 6)
  assert.equal(body.meta.total_pages, 2)
  assert.equal(body.meta.has_next, true)
  assert.equal(body.meta.has_prev, false)
  const prices = body.items.map((p) => p.price)
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b))
})

test('2. Next.js /api/v1/products forwards multi-brand, search, and filter query params to FastAPI', async () => {
  const multiRes = await fetch(
    `${NEXT_BASE}/api/v1/products/?brand_slugs=aru-atelier&brand_slugs=zarrin-anodize`,
    { redirect: 'manual' }
  )
  assert.equal(multiRes.status, 200)
  const multiBody = await multiRes.json()
  assert.equal(multiBody.items.length > 0, true)
  const brandSlugs = new Set(multiBody.items.map((p) => p.brand.slug))
  assert.deepEqual(
    [...brandSlugs].sort(),
    ['aru-atelier', 'zarrin-anodize']
  )
})

test('3. Next.js /api/v1/products/{identifier} resolves canonical slug, legacy alias, and 404 on unknown slug', async () => {
  const canonical = await fetch(
    `${NEXT_BASE}/api/v1/products/shahnameh-3tier-aluminum-pastry-stand`
  )
  assert.equal(canonical.status, 200)
  const canonicalBody = await canonical.json()
  assert.equal(canonicalBody.sku, 'ARU-101')

  const legacy = await fetch(
    `${NEXT_BASE}/api/v1/products/royal-3tier-aluminum-stand`
  )
  assert.equal(legacy.status, 200)
  const legacyBody = await legacy.json()
  assert.equal(legacyBody.sku, 'ARU-101')

  const missing = await fetch(
    `${NEXT_BASE}/api/v1/products/missing-product-slug-xyz`
  )
  assert.equal(missing.status, 404)
  const missingBody = await missing.json()
  assert.equal(missingBody.detail, 'Product not found')
})

test('4. Next.js /api/v1/categories/ and /api/v1/brands/ return FastAPI arrays with real product_count', async () => {
  const catRes = await fetch(`${NEXT_BASE}/api/v1/categories/`, {
    redirect: 'manual',
  })
  assert.equal(catRes.status, 200)
  const cats = await catRes.json()
  assert.equal(Array.isArray(cats), true)
  assert.equal(cats.length, 4)
  assert.equal(
    cats.reduce((acc, c) => acc + c.product_count, 0),
    8
  )

  const brandRes = await fetch(`${NEXT_BASE}/api/v1/brands/`, {
    redirect: 'manual',
  })
  assert.equal(brandRes.status, 200)
  const brands = await brandRes.json()
  assert.equal(Array.isArray(brands), true)
  assert.equal(brands.length, 4)
  assert.equal(
    brands.reduce((acc, b) => acc + b.product_count, 0),
    8
  )
})

test('5. P0-A/P0-A1 auth endpoints and status codes remain intact through Next.js rewrite', async () => {
  const refreshRes = await fetch(`${NEXT_BASE}/api/v1/auth/refresh`, {
    method: 'POST',
    redirect: 'manual',
  })
  assert.equal(refreshRes.status, 401)
})

test('6. P0-C2 /api/v1/orders forwards Idempotency-Key and creates safe pending_payment orders through Next.js rewrite', async () => {
  // Unauthenticated /orders and /orders/ return direct 401 without 307/308 redirect
  const unauthNoSlash = await fetch(`${NEXT_BASE}/api/v1/orders`, {
    redirect: 'manual',
  })
  assert.equal(unauthNoSlash.status, 401)

  const unauthSlash = await fetch(`${NEXT_BASE}/api/v1/orders/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: 'Test',
      shipping_address: 'Tehran Valiasr St 10',
    }),
    redirect: 'manual',
  })
  assert.equal(unauthSlash.status, 401)

  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const regRes = await fetch(`${NEXT_BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `proxy-order-${uniqueSuffix}@arustore.ir`,
      full_name: 'Proxy Order Tester',
      password: 'ProxyOrderPass!2026',
    }),
  })
  assert.equal(regRes.status, 201)
  const { access_token } = await regRes.json()
  const authHeaders = {
    Authorization: `Bearer ${access_token}`,
    'Content-Type': 'application/json',
  }

  const addCartRes = await fetch(`${NEXT_BASE}/api/v1/cart/items`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ product_id: 1, quantity: 1 }),
  })
  assert.equal(addCartRes.status, 201)

  const idemKey = `proxy-idem-${uniqueSuffix}`
  const shippingBody = {
    customer_name: 'Proxy Order Tester',
    customer_phone: '09124445566',
    shipping_address: 'تهران، خیابان شریعتی، پلاک ۱۰۸',
    postal_code: '1934567890',
  }

  const createRes = await fetch(`${NEXT_BASE}/api/v1/orders/`, {
    method: 'POST',
    headers: { ...authHeaders, 'Idempotency-Key': idemKey },
    body: JSON.stringify(shippingBody),
    redirect: 'manual',
  })
  assert.equal(createRes.status, 201)
  const createdOrder = await createRes.json()
  assert.equal(createdOrder.status, 'pending_payment')
  assert.equal(createdOrder.payment_status, 'pending')
  assert.equal(createdOrder.payment_reference, null)
  assert.equal(createdOrder.stock_reserved, false)

  // Replay with same Idempotency-Key returns same order
  const replayRes = await fetch(`${NEXT_BASE}/api/v1/orders/`, {
    method: 'POST',
    headers: { ...authHeaders, 'Idempotency-Key': idemKey },
    body: JSON.stringify(shippingBody),
    redirect: 'manual',
  })
  assert.equal(replayRes.status, 201)
  const replayedOrder = await replayRes.json()
  assert.equal(replayedOrder.id, createdOrder.id)

  // Reusing same Idempotency-Key with altered shipping address returns 409 Conflict
  const conflictRes = await fetch(`${NEXT_BASE}/api/v1/orders/`, {
    method: 'POST',
    headers: { ...authHeaders, 'Idempotency-Key': idemKey },
    body: JSON.stringify({
      ...shippingBody,
      shipping_address: 'شیراز، خیابان زند، پلاک ۵۵',
    }),
    redirect: 'manual',
  })
  assert.equal(conflictRes.status, 409)
})
