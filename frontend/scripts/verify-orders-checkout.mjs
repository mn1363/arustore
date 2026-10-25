import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import Module from 'node:module'
import os from 'node:os'
import path from 'node:path'
import test, { after, before, beforeEach } from 'node:test'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const frontendRoot = path.resolve(path.dirname(__filename), '..')
const tmpOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arustore-orders-test-'))

class MemoryStorage {
  constructor() {
    this.map = new Map()
  }
  getItem(key) {
    return this.map.has(key) ? this.map.get(key) : null
  }
  setItem(key, value) {
    this.map.set(key, String(value))
  }
  removeItem(key) {
    this.map.delete(key)
  }
  clear() {
    this.map.clear()
  }
}

const mockLocalStorage = new MemoryStorage()
globalThis.localStorage = mockLocalStorage
globalThis.window = {
  localStorage: mockLocalStorage,
  location: { search: '' },
}

let storeMod
let clientMod
let ordersApiMod
let validationMod
let catalogApiMod
let nodeRequire

function simulateBrowserPageReload() {
  const clientPath = path.join(tmpOutDir, 'lib/api/client.js')
  const cartPath = path.join(tmpOutDir, 'lib/api/cart.js')
  const ordersPath = path.join(tmpOutDir, 'lib/api/orders.js')
  const storePath = path.join(tmpOutDir, 'lib/store/useStore.js')

  delete nodeRequire.cache[storePath]
  delete nodeRequire.cache[ordersPath]
  delete nodeRequire.cache[cartPath]
  delete nodeRequire.cache[clientPath]

  clientMod = nodeRequire(clientPath)
  ordersApiMod = nodeRequire(ordersPath)
  storeMod = nodeRequire(storePath)

  return { clientMod, ordersApiMod, storeMod }
}

function makeBackendProductDto(id, overrides = {}) {
  return {
    id,
    sku: `ARU-20${id}`,
    name: `Aluminum Pedestal Bowl ${id}`,
    name_fa: `میوه‌خوری پایه‌دار آلومینیومی ${id}`,
    slug: `aluminum-pedestal-bowl-${id}`,
    description: 'Anodized cast aluminum bowl',
    description_fa: 'ساخته‌شده از شمش آلومینیوم خالص',
    price: 120,
    price_toman: 6_600_000,
    brand: 'Aru Studio',
    brand_fa: 'استودیو آرو',
    category_slug: 'fruit-bowls',
    category_fa: 'میوه‌خوری',
    image_url: '/images/products/fruit-bowl.png',
    colors: [
      {
        id: 'champagne',
        name: 'Celestial Champagne',
        name_fa: 'شامپاینی آسمانی',
        hex: '#dfc08e',
        accentHex: '#f3dec0',
      },
    ],
    editions: [
      {
        id: 'standard',
        label: 'Standard Box',
        label_fa: 'بسته‌بندی استاندارد',
        priceDelta: 0,
        priceDeltaToman: 0,
      },
    ],
    in_stock: true,
    stock_quantity: 10,
    is_featured: true,
    is_new: false,
    rating_avg: 4.9,
    rating_count: 14,
    reviews: [],
    ...overrides,
  }
}

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeCartSummaryDto(items, promoCode = null, promoPercent = 0) {
  const subtotal = Number(
    items.reduce((acc, it) => acc + it.line_total, 0).toFixed(2)
  )
  const subtotalToman = items.reduce((acc, it) => acc + it.line_total_toman, 0)
  const discountUsd = promoCode
    ? Number(((subtotal * promoPercent) / 100).toFixed(2))
    : 0
  const discountToman = promoCode
    ? Math.round((subtotalToman * promoPercent) / 100)
    : 0
  return {
    items,
    item_count: items.reduce((acc, it) => acc + it.quantity, 0),
    subtotal,
    subtotal_toman: subtotalToman,
    discount_amount: discountUsd,
    discount_toman: discountToman,
    total: Number((subtotal - discountUsd).toFixed(2)),
    total_toman: subtotalToman - discountToman,
    promo_code: promoCode,
    promo_percent: promoPercent,
  }
}

before(() => {
  const tscBin = path.join(frontendRoot, 'node_modules', 'typescript', 'bin', 'tsc')
  const tmpTsconfig = path.join(tmpOutDir, 'tsconfig.verify-orders.json')
  fs.writeFileSync(
    tmpTsconfig,
    JSON.stringify({
      compilerOptions: {
        outDir: tmpOutDir,
        rootDir: frontendRoot,
        baseUrl: frontendRoot,
        typeRoots: [path.join(frontendRoot, 'node_modules/@types')],
        paths: { '@/*': ['./*'] },
        module: 'commonjs',
        target: 'es2020',
        moduleResolution: 'node',
        esModuleInterop: true,
        skipLibCheck: true,
        strict: true,
      },
      files: [
        path.join(frontendRoot, 'types/index.ts'),
        path.join(frontendRoot, 'lib/data/catalog.ts'),
        path.join(frontendRoot, 'lib/api/client.ts'),
        path.join(frontendRoot, 'lib/api/catalog.ts'),
        path.join(frontendRoot, 'lib/api/cart.ts'),
        path.join(frontendRoot, 'lib/api/orders.ts'),
        path.join(frontendRoot, 'lib/checkoutValidation.ts'),
        path.join(frontendRoot, 'lib/store/useStore.ts'),
      ],
    })
  )

  execFileSync(process.execPath, [tscBin, '-p', tmpTsconfig], {
    cwd: frontendRoot,
    stdio: 'inherit',
  })

  const originalResolve = Module._resolveFilename
  Module._resolveFilename = function resolveWithAlias(
    request,
    parent,
    isMain,
    options
  ) {
    if (request.startsWith('@/')) {
      const mapped = path.join(tmpOutDir, request.slice(2))
      return originalResolve.call(this, mapped, parent, isMain, options)
    }
    if (!request.startsWith('.') && !path.isAbsolute(request)) {
      return originalResolve.call(this, request, parent, isMain, {
        ...options,
        paths: [
          path.join(frontendRoot, 'node_modules'),
          ...(options?.paths || []),
        ],
      })
    }
    return originalResolve.call(this, request, parent, isMain, options)
  }

  nodeRequire = Module.createRequire(import.meta.url)
  clientMod = nodeRequire(path.join(tmpOutDir, 'lib/api/client.js'))
  catalogApiMod = nodeRequire(path.join(tmpOutDir, 'lib/api/catalog.js'))
  ordersApiMod = nodeRequire(path.join(tmpOutDir, 'lib/api/orders.js'))
  validationMod = nodeRequire(path.join(tmpOutDir, 'lib/checkoutValidation.js'))
  storeMod = nodeRequire(path.join(tmpOutDir, 'lib/store/useStore.js'))
})

after(() => {
  fs.rmSync(tmpOutDir, { recursive: true, force: true })
})

beforeEach(() => {
  mockLocalStorage.clear()
  clientMod.clearInMemoryAccessToken()
  storeMod.resetCartWishlistRuntimeLocks()
  storeMod.useStore.setState({
    user: null,
    authStatus: 'idle',
    hasSessionHint: false,
    guestCart: [],
    guestWishlistIds: [],
    pendingCartMergeIntents: {},
    pendingCheckoutAttempt: null,
    authCartSummary: null,
    authPromoCode: null,
    authWishlistProducts: [],
    authWishlistIds: [],
    authOrders: [],
    orders: [],
    ordersLoading: false,
    ordersError: null,
    orderSubmitting: false,
    orderSubmitError: null,
    cart: [],
    wishlistIds: [],
    promoCode: null,
    promoPercent: 0,
    locale: 'fa',
  })
})

test('1. Shipping validation & payload builder normalize Persian numerals and omit all client item/price fields', () => {
  const { validateShippingForm, buildCreateOrderPayload } = validationMod

  const invalid = validateShippingForm(
    {
      fullName: 'ا',
      phone: '123',
      city: '',
      address: 'پ۱',
      postalCode: 'abc',
    },
    'fa'
  )
  assert.equal(invalid.valid, false)
  assert.ok(invalid.errors.fullName)
  assert.ok(invalid.errors.phone)
  assert.ok(invalid.errors.city)
  assert.ok(invalid.errors.address)
  assert.ok(invalid.errors.postalCode)

  const valid = validateShippingForm(
    {
      fullName: 'نگار رادمهر',
      phone: '۰۹۱۲۳۳۳۴۴۵۵',
      city: 'تهران',
      address: 'خیابان فرشته، پلاک ۲۴، واحد ۳',
      postalCode: '۱۹۶۵۴-۳۲۱۰۰',
      notes: 'تحویل به نگهبانی',
    },
    'fa'
  )
  assert.equal(valid.valid, true)
  assert.deepEqual(valid.errors, {})

  const payload = buildCreateOrderPayload(
    {
      fullName: 'نگار رادمهر',
      phone: '۰۹۱۲۳۳۳۴۴۵۵',
      city: 'تهران',
      address: 'خیابان فرشته، پلاک ۲۴، واحد ۳',
      postalCode: '۱۹۶۵۴-۳۲۱۰۰',
      notes: 'تحویل به نگهبانی',
    },
    'ARU3D',
    'fa'
  )

  assert.deepEqual(Object.keys(payload).sort(), [
    'customer_name',
    'customer_phone',
    'notes',
    'postal_code',
    'promo_code',
    'shipping_address',
  ])
  assert.equal(payload.customer_phone, '09123334455')
  assert.equal(payload.postal_code, '1965432100')
  assert.equal(payload.promo_code, 'ARU3D')
  assert.equal('items' in payload, false)
  assert.equal('total' in payload, false)
  assert.equal('subtotal' in payload, false)
})

test('2. Guest order submission requires authentication and preserves guest cart intact', async () => {
  const prod = catalogApiMod.mapProductDtoToProduct(makeBackendProductDto(1))
  let networkCalled = false
  globalThis.fetch = async () => {
    networkCalled = true
    throw new Error('Guest checkout must not call backend /orders/')
  }

  await storeMod.useStore.getState().addToCart(prod, 2)
  assert.equal(storeMod.useStore.getState().guestCart.length, 1)

  const res = await storeMod.useStore.getState().submitCheckoutOrder({
    customer_name: 'مهمان',
    shipping_address: 'تهران، میدان ونک، پلاک ۱۰',
  })

  assert.equal(res.ok, false)
  assert.equal(res.requiresAuth, true)
  assert.equal(networkCalled, false)
  assert.equal(storeMod.useStore.getState().guestCart.length, 1)
  assert.equal(storeMod.useStore.getState().guestCart[0].quantity, 2)
})

test('3. Real API order submission sends Idempotency-Key, blocks double-clicks, refreshes cart & orders, and never persists PII or orders in localStorage', async () => {
  const prodDto = makeBackendProductDto(1)
  let serverCartItems = [
    {
      id: 101,
      product_id: 1,
      quantity: 2,
      selected_color: prodDto.colors[0],
      selected_edition: 'standard',
      unit_price: 120,
      unit_price_toman: 6_600_000,
      line_total: 240,
      line_total_toman: 13_200_000,
      product: prodDto,
    },
  ]
  let serverOrders = []
  const orderPosts = []

  globalThis.fetch = async (url, init = {}) => {
    const u = String(url)
    const method = init.method || 'GET'
    if (u.endsWith('/auth/login/json')) {
      return jsonResponse({
        access_token: 'jwt-order-buyer',
        token_type: 'bearer',
        user: {
          id: 71,
          email: 'buyer71@arustore.ir',
          username: 'buyer71',
          full_name: 'خریدار آرو',
          is_admin: false,
        },
      })
    }
    if (u.includes('/cart/')) {
      return jsonResponse(makeCartSummaryDto(serverCartItems, 'ARU3D', 15))
    }
    if (u.includes('/wishlist/')) {
      return jsonResponse([])
    }
    if (u.endsWith('/orders/') && method === 'POST') {
      const headers = new Headers(init.headers || {})
      const idemKey = headers.get('Idempotency-Key')
      const body = JSON.parse(init.body)
      orderPosts.push({ idemKey, body })

      // Delay slightly so concurrent double-click overlaps while in-flight
      await new Promise((r) => setTimeout(r, 25))

      const created = {
        id: 501,
        order_number: 'ARU-2026-AB12CD34',
        user_id: 71,
        status: 'pending_payment',
        payment_status: 'pending',
        payment_reference: null,
        stock_reserved: false,
        subtotal: 240,
        discount_amount: 36,
        shipping_cost: 0,
        total: 204,
        total_toman: 11_220_000,
        promo_code: 'ARU3D',
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        shipping_address: body.shipping_address,
        postal_code: body.postal_code,
        notes: body.notes,
        created_at: '2026-10-25T10:00:00Z',
        items: [
          {
            id: 9001,
            product_id: 1,
            product_name: prodDto.name,
            product_name_fa: prodDto.name_fa,
            product_image: prodDto.image_url,
            color_name: 'Celestial Champagne',
            color_name_fa: 'شامپاینی آسمانی',
            edition: 'standard',
            quantity: 2,
            unit_price: 120,
            unit_price_toman: 6_600_000,
          },
        ],
        status_history: [
          {
            id: 1,
            status: 'pending_payment',
            note: 'Saved with pending payment',
            created_at: '2026-10-25T10:00:00Z',
          },
        ],
      }
      serverCartItems = []
      serverOrders = [created]
      return jsonResponse(created, 201)
    }
    if (u.endsWith('/orders/') && method === 'GET') {
      return jsonResponse(serverOrders)
    }
    if (u.endsWith('/auth/logout')) {
      return jsonResponse({ message: 'ok' })
    }
    throw new Error(`Unexpected URL: ${u} (${method})`)
  }

  await storeMod.useStore.getState().loginUser('buyer71@arustore.ir', 'Pass123!')
  storeMod.useStore.setState({ authPromoCode: 'ARU3D', promoCode: 'ARU3D' })

  const submitPayload = {
    customer_name: 'نگار رادمهر',
    customer_phone: '09123334455',
    shipping_address: 'تهران، الهیه، خیابان فرشته، پلاک ۲۴',
    postal_code: '1965432100',
  }

  // Simulate rapid double-click while request is in-flight
  const [firstClick, secondClick] = await Promise.all([
    storeMod.useStore.getState().submitCheckoutOrder(submitPayload),
    storeMod.useStore.getState().submitCheckoutOrder(submitPayload),
  ])

  assert.equal(orderPosts.length, 1, 'Double-click must send only ONE POST /orders/')
  assert.ok(orderPosts[0].idemKey && orderPosts[0].idemKey.startsWith('aru-chk-'))
  assert.equal('items' in orderPosts[0].body, false)
  assert.equal('total' in orderPosts[0].body, false)

  assert.equal(firstClick.ok, true)
  assert.equal(secondClick.ok, false, 'Concurrent duplicate click is blocked while in-flight')

  const createdOrder = firstClick.order
  assert.equal(createdOrder.orderNumber, 'ARU-2026-AB12CD34')
  assert.equal(createdOrder.status, 'pending_payment')
  assert.equal(createdOrder.paymentStatus, 'pending')
  assert.equal(createdOrder.paymentReference, null)
  assert.equal(createdOrder.stockReserved, false)

  // Authoritative cart is now empty and authOrders holds the server order
  const stateAfter = storeMod.useStore.getState()
  assert.equal(stateAfter.cart.length, 0)
  assert.equal(stateAfter.authOrders.length, 1)
  assert.equal(stateAfter.authOrders[0].orderNumber, 'ARU-2026-AB12CD34')
  assert.equal(stateAfter.pendingCheckoutAttempt, null)

  // Verify NO orders and NO checkout PII were written to localStorage
  const rawStorage = mockLocalStorage.getItem('arustore-aluminum-v3') || ''
  assert.equal(rawStorage.includes('ARU-2026-AB12CD34'), false)
  assert.equal(rawStorage.includes('نگار رادمهر'), false)
  assert.equal(rawStorage.includes('09123334455'), false)
  assert.equal(rawStorage.includes('فرشته'), false)

  // Logout clears authOrders
  await storeMod.useStore.getState().logoutUser()
  assert.deepEqual(storeMod.useStore.getState().authOrders, [])
})

test('4. Retry across network drop + full page reload reuses exact Idempotency-Key (both pre-commit and post-commit reload) without storing PII', async () => {
  const prodDto = makeBackendProductDto(2)

  // --- Scenario A: Network drops BEFORE server commits, page reloads, user retries -> same Idempotency-Key ---
  let serverCartItems = [
    {
      id: 202,
      product_id: 2,
      quantity: 1,
      selected_color: prodDto.colors[0],
      selected_edition: 'standard',
      unit_price: 120,
      unit_price_toman: 6_600_000,
      line_total: 120,
      line_total_toman: 6_600_000,
      product: prodDto,
    },
  ]
  let serverOrders = []
  let failNextOrderPostWithNetworkDrop = true
  let commitBeforeNetworkDrop = false
  const observedIdemKeys = []

  const installFetchMock = () => {
    globalThis.fetch = async (url, init = {}) => {
      const u = String(url)
      const method = init.method || 'GET'
      if (u.endsWith('/auth/login/json') || u.endsWith('/auth/refresh')) {
        return jsonResponse({
          access_token: 'jwt-reload-user-88',
          token_type: 'bearer',
          user: {
            id: 88,
            email: 'reload88@arustore.ir',
            username: 'reload88',
            full_name: 'کاربر تست ریلود',
            is_admin: false,
          },
        })
      }
      if (u.includes('/cart/')) {
        return jsonResponse(makeCartSummaryDto(serverCartItems))
      }
      if (u.includes('/wishlist/')) {
        return jsonResponse([])
      }
      if (u.endsWith('/orders/') && method === 'POST') {
        const idemKey = new Headers(init.headers || {}).get('Idempotency-Key')
        observedIdemKeys.push(idemKey)

        if (commitBeforeNetworkDrop && serverOrders.length === 0) {
          serverOrders = [
            {
              id: 777,
              order_number: 'ARU-2026-RELOAD77',
              user_id: 88,
              status: 'pending_payment',
              payment_status: 'pending',
              payment_reference: null,
              stock_reserved: false,
              subtotal: 120,
              discount_amount: 0,
              shipping_cost: 0,
              total: 120,
              total_toman: 6_600_000,
              customer_name: 'کاربر تست ریلود',
              shipping_address: 'اصفهان، خیابان چهارباغ بالا، پلاک ۱۸',
              items: [],
              status_history: [],
            },
          ]
          serverCartItems = []
        }

        if (failNextOrderPostWithNetworkDrop) {
          failNextOrderPostWithNetworkDrop = false
          throw new TypeError('Network connection lost mid-checkout')
        }

        if (serverOrders.length === 0) {
          serverOrders = [
            {
              id: 778,
              order_number: 'ARU-2026-RELOAD78',
              user_id: 88,
              status: 'pending_payment',
              payment_status: 'pending',
              payment_reference: null,
              stock_reserved: false,
              subtotal: 120,
              discount_amount: 0,
              shipping_cost: 0,
              total: 120,
              total_toman: 6_600_000,
              customer_name: 'کاربر تست ریلود',
              shipping_address: 'اصفهان، خیابان چهارباغ بالا، پلاک ۱۸',
              items: [],
              status_history: [],
            },
          ]
          serverCartItems = []
        }
        return jsonResponse(serverOrders[0], 201)
      }
      if (u.endsWith('/orders/') && method === 'GET') {
        return jsonResponse(serverOrders)
      }
      throw new Error(`Unexpected URL: ${u}`)
    }
  }

  installFetchMock()
  await storeMod.useStore.getState().loginUser('reload88@arustore.ir', 'Pass123!')

  const payload = {
    customer_name: 'کاربر تست ریلود',
    customer_phone: '09131112233',
    shipping_address: 'اصفهان، خیابان چهارباغ بالا، پلاک ۱۸',
    postal_code: '8165432100',
  }

  const droppedRes = await storeMod.useStore
    .getState()
    .submitCheckoutOrder(payload)
  assert.equal(droppedRes.ok, false)
  assert.equal(storeMod.useStore.getState().cart.length, 1, 'Cart remains intact on network error')

  // Verify localStorage saved ONLY opaque attempt metadata (zero PII)
  const persistedDuringDrop = mockLocalStorage.getItem('arustore-aluminum-v3') || ''
  assert.equal(persistedDuringDrop.includes('چهارباغ'), false)
  assert.equal(persistedDuringDrop.includes('09131112233'), false)
  assert.equal(persistedDuringDrop.includes('کاربر تست ریلود'), false)
  assert.equal(persistedDuringDrop.includes(observedIdemKeys[0]), true)

  // Simulate full browser page reload (wipe module cache + rehydrate from localStorage + bootstrapAuth)
  simulateBrowserPageReload()
  installFetchMock()
  await storeMod.useStore.persist.rehydrate()
  await storeMod.useStore.getState().bootstrapAuth()

  const retriedRes = await storeMod.useStore
    .getState()
    .submitCheckoutOrder(payload)
  assert.equal(retriedRes.ok, true)
  assert.equal(observedIdemKeys.length, 2)
  assert.equal(
    observedIdemKeys[1],
    observedIdemKeys[0],
    'Retry after full page reload MUST reuse the exact same Idempotency-Key'
  )
  assert.equal(storeMod.useStore.getState().pendingCheckoutAttempt, null)

  // --- Scenario B: Server commits & clears cart BEFORE network drop, page reloads -> retry still reuses key! ---
  serverCartItems = [
    {
      id: 203,
      product_id: 2,
      quantity: 1,
      selected_color: prodDto.colors[0],
      selected_edition: 'standard',
      unit_price: 120,
      unit_price_toman: 6_600_000,
      line_total: 120,
      line_total_toman: 6_600_000,
      product: prodDto,
    },
  ]
  serverOrders = []
  failNextOrderPostWithNetworkDrop = true
  commitBeforeNetworkDrop = true
  observedIdemKeys.length = 0

  await storeMod.useStore.getState().loadServerCart()
  const dropAfterCommit = await storeMod.useStore
    .getState()
    .submitCheckoutOrder(payload)
  assert.equal(dropAfterCommit.ok, false)

  simulateBrowserPageReload()
  installFetchMock()
  await storeMod.useStore.persist.rehydrate()
  await storeMod.useStore.getState().bootstrapAuth()
  // Note: server cart is now empty after reload, yet pendingCheckoutAttempt matches payloadFingerprint!
  assert.equal(storeMod.useStore.getState().cart.length, 0)

  const recoveredAfterCommit = await storeMod.useStore
    .getState()
    .submitCheckoutOrder(payload)
  assert.equal(recoveredAfterCommit.ok, true)
  assert.equal(
    recoveredAfterCommit.order?.orderNumber,
    'ARU-2026-RELOAD77'
  )
  assert.equal(observedIdemKeys[1], observedIdemKeys[0])
})

test('5. Deterministic 4xx API errors keep cart intact and rotate attempt key on next submission', async () => {
  const prodDto = makeBackendProductDto(3)
  const serverCartItems = [
    {
      id: 303,
      product_id: 3,
      quantity: 2,
      selected_color: prodDto.colors[0],
      selected_edition: 'standard',
      unit_price: 120,
      unit_price_toman: 6_600_000,
      line_total: 240,
      line_total_toman: 13_200_000,
      product: prodDto,
    },
  ]
  let failWith400 = true
  const keys = []

  globalThis.fetch = async (url, init = {}) => {
    const u = String(url)
    const method = init.method || 'GET'
    if (u.endsWith('/auth/login/json')) {
      return jsonResponse({
        access_token: 'jwt-err-99',
        token_type: 'bearer',
        user: {
          id: 99,
          email: 'err99@arustore.ir',
          username: 'err99',
          full_name: 'کاربر خطا',
          is_admin: false,
        },
      })
    }
    if (u.includes('/cart/')) {
      return jsonResponse(makeCartSummaryDto(serverCartItems))
    }
    if (u.includes('/wishlist/')) {
      return jsonResponse([])
    }
    if (u.endsWith('/orders/') && method === 'POST') {
      keys.push(new Headers(init.headers || {}).get('Idempotency-Key'))
      if (failWith400) {
        failWith400 = false
        return jsonResponse(
          { detail: "Promo code 'BADCODE' was not found" },
          400
        )
      }
      return jsonResponse(
        {
          id: 901,
          order_number: 'ARU-2026-FIXED901',
          user_id: 99,
          status: 'pending_payment',
          payment_status: 'pending',
          payment_reference: null,
          stock_reserved: false,
          subtotal: 240,
          discount_amount: 0,
          shipping_cost: 0,
          total: 240,
          total_toman: 13_200_000,
          customer_name: 'کاربر خطا',
          shipping_address: 'تبریز، ولیعصر، خیابان فروغی، پلاک ۷',
          items: [],
          status_history: [],
        },
        201
      )
    }
    if (u.endsWith('/orders/') && method === 'GET') {
      return jsonResponse([])
    }
    throw new Error(`Unexpected URL: ${u}`)
  }

  await storeMod.useStore.getState().loginUser('err99@arustore.ir', 'Pass123!')

  const badRes = await storeMod.useStore.getState().submitCheckoutOrder({
    customer_name: 'کاربر خطا',
    shipping_address: 'تبریز، ولیعصر، خیابان فروغی، پلاک ۷',
    promo_code: 'BADCODE',
  })
  assert.equal(badRes.ok, false)
  assert.match(badRes.error || '', /BADCODE/)
  // Cart MUST remain completely intact on 400 error!
  assert.equal(storeMod.useStore.getState().cart.length, 1)
  assert.equal(storeMod.useStore.getState().cart[0].quantity, 2)
  assert.equal(storeMod.useStore.getState().pendingCheckoutAttempt, null)

  // Fixing promo_code issues a fresh Idempotency-Key and succeeds
  const goodRes = await storeMod.useStore.getState().submitCheckoutOrder({
    customer_name: 'کاربر خطا',
    shipping_address: 'تبریز، ولیعصر، خیابان فروغی، پلاک ۷',
    promo_code: null,
  })
  assert.equal(goodRes.ok, true)
  assert.equal(keys.length, 2)
  assert.notEqual(keys[0], keys[1])
})

test('6. Checkout, PaymentForm, and Orders pages enforce pending-payment truthfulness and zero card credential collection', () => {
  const checkoutSrc = fs.readFileSync(
    path.join(frontendRoot, 'app/(main)/checkout/page.tsx'),
    'utf8'
  )
  const paymentSrc = fs.readFileSync(
    path.join(frontendRoot, 'components/checkout/PaymentForm.tsx'),
    'utf8'
  )
  const ordersPageSrc = fs.readFileSync(
    path.join(frontendRoot, 'app/(main)/orders/page.tsx'),
    'utf8'
  )
  const adminOrdersSrc = fs.readFileSync(
    path.join(frontendRoot, 'app/(admin)/admin/orders/page.tsx'),
    'utf8'
  )

  // PaymentForm collects ZERO card credentials
  assert.equal(/<input\b/i.test(paymentSrc), false)
  assert.equal(/<Input\b/.test(paymentSrc), false)
  assert.equal(paymentSrc.includes('6037'), false)
  assert.equal(paymentSrc.includes('CVV'), false)
  assert.equal(paymentSrc.includes('CVC'), false)

  // Checkout explicitly communicates pending payment & stock non-reservation (never claims paid/fulfilled)
  assert.equal(checkoutSrc.includes('در انتظار پرداخت'), true)
  assert.equal(checkoutSrc.includes('Pending Payment'), true)
  assert.equal(checkoutSrc.includes('رزرو نشده'), true)
  assert.equal(checkoutSrc.includes('NOT reserved'), true)
  assert.equal(checkoutSrc.includes('پرداخت با موفقیت انجام شد'), false)
  assert.equal(checkoutSrc.includes('Payment successful'), false)

  // Orders page & Admin Orders page render `pending_payment` explicitly and read server orders
  assert.equal(ordersPageSrc.includes("case 'pending_payment'"), true)
  assert.equal(ordersPageSrc.includes('در انتظار پرداخت'), true)
  assert.equal(ordersPageSrc.includes('Pending Payment'), true)
  assert.equal(ordersPageSrc.includes('loadServerOrders'), true)
  assert.equal(ordersPageSrc.includes('s.orders)'), false)
  assert.equal(
    adminOrdersSrc.includes('getAllowedAdminOrderStatusOptions'),
    true
  )
  assert.equal(adminOrdersSrc.includes('fetchAdminOrders'), true)
})

test('7. Admin status options enforce payment-state transitions and createServerOrder rejects missing/blank Idempotency-Key', async () => {
  const { getAllowedAdminOrderStatusOptions, createServerOrder } = ordersApiMod

  // Unpaid pending_payment order can ONLY display pending_payment and cancelled (no processing, shipped, delivered)
  const unpaidPendingOpts = getAllowedAdminOrderStatusOptions(
    { status: 'pending_payment', paymentStatus: 'pending' },
    'en'
  ).map((o) => o.value)
  assert.deepEqual(unpaidPendingOpts, ['pending_payment', 'cancelled'])

  // Cancelled order is terminal
  const unpaidCancelledOpts = getAllowedAdminOrderStatusOptions(
    { status: 'cancelled', paymentStatus: 'pending' },
    'fa'
  ).map((o) => o.value)
  assert.deepEqual(unpaidCancelledOpts, ['cancelled'])

  // Paid order follows strict sequential fulfillment and NEVER reverts to pending_payment or skips stages
  const paidPendingOpts = getAllowedAdminOrderStatusOptions(
    { status: 'pending_payment', paymentStatus: 'paid' },
    'en'
  ).map((o) => o.value)
  assert.deepEqual(paidPendingOpts, ['processing', 'cancelled'])

  const paidProcessingOpts = getAllowedAdminOrderStatusOptions(
    { status: 'processing', paymentStatus: 'paid' },
    'en'
  ).map((o) => o.value)
  assert.deepEqual(paidProcessingOpts, ['processing', 'shipped', 'cancelled'])
  assert.equal(paidProcessingOpts.includes('delivered'), false)
  assert.equal(paidProcessingOpts.includes('pending_payment'), false)

  const paidShippedOpts = getAllowedAdminOrderStatusOptions(
    { status: 'shipped', paymentStatus: 'paid' },
    'en'
  ).map((o) => o.value)
  assert.deepEqual(paidShippedOpts, ['shipped', 'delivered', 'cancelled'])
  assert.equal(paidShippedOpts.includes('processing'), false)

  const paidDeliveredOpts = getAllowedAdminOrderStatusOptions(
    { status: 'delivered', paymentStatus: 'paid' },
    'en'
  ).map((o) => o.value)
  assert.deepEqual(paidDeliveredOpts, ['delivered'])

  const paidCancelledOpts = getAllowedAdminOrderStatusOptions(
    { status: 'cancelled', paymentStatus: 'paid' },
    'en'
  ).map((o) => o.value)
  assert.deepEqual(paidCancelledOpts, ['cancelled'])

  // Client API helper rejects blank / whitespace / >128-char Idempotency-Key before network call
  for (const invalidKey of ['', '   ', 'x'.repeat(129)]) {
    await assert.rejects(
      () =>
        createServerOrder(
          {
            customer_name: 'Buyer',
            shipping_address: 'Tehran Valiasr St 10',
          },
          invalidKey
        ),
      (err) => err.status === 400
    )
  }
})
