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
const tmpOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arustore-cart-test-'))

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
let cartApiMod
let catalogApiMod

function makeBackendProductDto(id, overrides = {}) {
  return {
    id,
    sku: `ARU-10${id}`,
    name: `Serving Vessel ${id}`,
    name_fa: `ظرف پذیرایی ${id}`,
    slug: `serving-vessel-${id}`,
    description: 'Brushed aluminum piece',
    description_fa: 'ساخته شده از آلومینیوم خالص',
    price: 100 + id * 10,
    price_toman: (100 + id * 10) * 55000,
    brand: 'Aru Studio',
    brand_fa: 'استودیو آرو',
    category_slug: 'serving-dishes',
    category_fa: 'ظروف پذیرایی',
    image_url: '/images/products/serving-dish.png',
    colors: [
      {
        id: 'champagne',
        name: 'Celestial Champagne',
        name_fa: 'شامپاینی آسمانی',
        hex: '#dfc08e',
        accentHex: '#f3dec0',
      },
      {
        id: 'silver',
        name: 'Brushed Silver',
        name_fa: 'نقره‌ای برس‌خورده',
        hex: '#cfd5df',
        accentHex: '#e6eaf0',
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
      {
        id: 'gift',
        label: 'Velvet Gift Box',
        label_fa: 'جعبه هدیه مخمل',
        priceDelta: 12,
        priceDeltaToman: 660000,
      },
    ],
    in_stock: true,
    stock_quantity: 6,
    is_featured: true,
    is_new: false,
    is_active: true,
    rating_avg: 4.8,
    rating_count: 14,
    reviews: [],
    ...overrides,
  }
}

function makeCartSummaryDto(items, promoCode = null, promoPercent = 0) {
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = Number(
    items.reduce((sum, i) => sum + i.line_total, 0).toFixed(2)
  )
  const subtotalToman = items.reduce((sum, i) => sum + i.line_total_toman, 0)
  const discountAmount = promoCode
    ? Number(((subtotal * promoPercent) / 100).toFixed(2))
    : 0
  const discountToman = promoCode
    ? Math.floor((subtotalToman * promoPercent) / 100)
    : 0
  return {
    items,
    item_count: itemCount,
    subtotal,
    subtotal_toman: subtotalToman,
    discount_amount: discountAmount,
    discount_toman: discountToman,
    total: Number((subtotal - discountAmount).toFixed(2)),
    total_toman: subtotalToman - discountToman,
    promo_code: promoCode,
    promo_percent: promoCode ? promoPercent : 0,
  }
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

before(() => {
  const tscBin = path.join(
    frontendRoot,
    'node_modules',
    'typescript',
    'bin',
    'tsc'
  )
  const tmpTsconfig = path.join(tmpOutDir, 'tsconfig.cart.verify.json')
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

  const req = Module.createRequire(import.meta.url)
  clientMod = req(path.join(tmpOutDir, 'lib/api/client.js'))
  catalogApiMod = req(path.join(tmpOutDir, 'lib/api/catalog.js'))
  cartApiMod = req(path.join(tmpOutDir, 'lib/api/cart.js'))
  storeMod = req(path.join(tmpOutDir, 'lib/store/useStore.js'))
})

beforeEach(() => {
  mockLocalStorage.clear()
  clientMod.clearInMemoryAccessToken()
  storeMod.resetCartWishlistRuntimeLocks()
  storeMod.useStore.setState({
    locale: 'en',
    products: [],
    cart: [],
    guestCart: [],
    authCartSummary: null,
    authPromoCode: null,
    cartLoading: false,
    cartError: null,
    mergeError: null,
    promoCode: null,
    promoPercent: 0,
    wishlistIds: [],
    guestWishlistIds: [],
    authWishlistIds: [],
    authWishlistProducts: [],
    wishlistLoading: false,
    wishlistError: null,
    orders: [],
    user: null,
    authStatus: 'idle',
    hasSessionHint: false,
    toasts: [],
  })
})

after(() => {
  fs.rmSync(tmpOutDir, { recursive: true, force: true })
})

test('1. Guest cart & wishlist start empty (no fake [2,4] IDs), enforce stock bounds, and never fake-validate promos', async () => {
  const { useStore } = storeMod
  const { mapProductDtoToProduct } = catalogApiMod

  // Verify initial state has no hardcoded demo wishlist or cart entries
  assert.deepEqual(useStore.getState().wishlistIds, [])
  assert.deepEqual(useStore.getState().guestWishlistIds, [])
  assert.deepEqual(useStore.getState().cart, [])

  const prod1 = mapProductDtoToProduct(
    makeBackendProductDto(1, { stock_quantity: 3 })
  )

  // Add 2 units as guest -> succeeds
  const ok1 = await useStore.getState().addToCart(prod1, 2, prod1.colors[0], 'gift')
  assert.equal(ok1, true)
  assert.equal(useStore.getState().guestCart.length, 1)
  assert.equal(useStore.getState().cart[0].quantity, 2)

  // Adding 2 more (2 + 2 = 4 > 3 stock) -> rejected without clamping to 3!
  const okExceed = await useStore
    .getState()
    .addToCart(prod1, 2, prod1.colors[0], 'gift')
  assert.equal(okExceed, false)
  assert.equal(useStore.getState().cart[0].quantity, 2)
  assert.match(useStore.getState().cartError || '', /exceeds available stock/i)

  // Guest promo code attempt must NOT claim backend validation
  const promoRes = await useStore.getState().applyPromoCode('WELCOME10')
  assert.equal(promoRes.ok, false)
  assert.match(promoRes.error || '', /sign in/i)
  assert.equal(useStore.getState().promoCode, null)

  // Guest wishlist toggle works locally
  await useStore.getState().toggleWishlist(prod1.id, prod1)
  assert.deepEqual(useStore.getState().wishlistIds, [1])
  assert.deepEqual(useStore.getState().guestWishlistIds, [1])
})

test('2. Authenticated cart CRUD, server-authoritative totals, promo errors, stock errors, and logout isolation', async () => {
  const { useStore } = storeMod
  const { getCartItemUnitPrices, getCartItemLineTotals, mapProductDtoToProduct } =
    cartApiMod.getCartItemUnitPrices
      ? { ...cartApiMod, ...catalogApiMod }
      : { ...cartApiMod, ...catalogApiMod }

  const prod2Dto = makeBackendProductDto(2, { stock_quantity: 4 })
  const prod2 = mapProductDtoToProduct(prod2Dto)

  // Server computes authoritative unit_price / line_total
  let serverItems = [
    {
      id: 501,
      product_id: 2,
      quantity: 2,
      selected_color: prod2Dto.colors[0],
      selected_edition: 'gift',
      unit_price: 132,
      unit_price_toman: 7260000,
      line_total: 264,
      line_total_toman: 14520000,
      product: prod2Dto,
    },
  ]
  let serverWishlist = [prod2Dto]

  globalThis.fetch = async (url, init = {}) => {
    const u = String(url)
    const method = init.method || 'GET'
    if (u.endsWith('/auth/login/json')) {
      return jsonResponse({
        access_token: 'jwt-auth-cart-test',
        token_type: 'bearer',
        user: {
          id: 10,
          email: 'buyer@arustore.ir',
          full_name: 'Buyer One',
          is_admin: false,
        },
      })
    }
    if (u.includes('/cart/apply-promo') && method === 'POST') {
      const { code } = JSON.parse(init.body)
      if (code.toUpperCase() === 'ARU3D') {
        return jsonResponse(makeCartSummaryDto(serverItems, 'ARU3D', 15))
      }
      return jsonResponse({ detail: 'Invalid or inactive promo code' }, 404)
    }
    if (u.includes('/cart/items/') && method === 'PATCH') {
      const id = Number(u.split('/cart/items/')[1])
      const { quantity } = JSON.parse(init.body)
      if (quantity > prod2Dto.stock_quantity) {
        return jsonResponse(
          { detail: 'Requested quantity exceeds available stock (4 available)' },
          400
        )
      }
      serverItems = serverItems.map((it) =>
        it.id === id
          ? {
              ...it,
              quantity,
              line_total: it.unit_price * quantity,
              line_total_toman: it.unit_price_toman * quantity,
            }
          : it
      )
      return jsonResponse(makeCartSummaryDto(serverItems))
    }
    if (u.includes('/cart/items/') && method === 'DELETE') {
      const id = Number(u.split('/cart/items/')[1])
      serverItems = serverItems.filter((it) => it.id !== id)
      return jsonResponse(makeCartSummaryDto(serverItems))
    }
    if (u.includes('/cart/')) {
      if (method === 'DELETE') {
        serverItems = []
        return jsonResponse({ message: 'Cleared' })
      }
      const promoMatch = u.match(/promo_code=([^&]+)/)
      const promo = promoMatch ? decodeURIComponent(promoMatch[1]) : null
      if (promo === 'ARU3D') {
        return jsonResponse(makeCartSummaryDto(serverItems, 'ARU3D', 15))
      }
      return jsonResponse(makeCartSummaryDto(serverItems))
    }
    if (u.includes('/wishlist/')) {
      return jsonResponse(serverWishlist)
    }
    if (u.endsWith('/auth/logout')) {
      return jsonResponse({ message: 'Logged out' })
    }
    throw new Error(`Unexpected fetch: ${method} ${u}`)
  }

  await useStore.getState().loginUser('buyer@arustore.ir', 'StrongPass123!')

  const stateAfterLogin = useStore.getState()
  assert.equal(stateAfterLogin.authCartSummary?.itemCount, 2)
  assert.equal(stateAfterLogin.authCartSummary?.subtotalUsd, 264)
  assert.equal(stateAfterLogin.cart[0].serverItemId, 501)
  assert.deepEqual(getCartItemUnitPrices(stateAfterLogin.cart[0]), {
    unitUsd: 132,
    unitToman: 7260000,
  })
  assert.deepEqual(getCartItemLineTotals(stateAfterLogin.cart[0]), {
    lineUsd: 264,
    lineToman: 14520000,
  })
  assert.deepEqual(stateAfterLogin.wishlistIds, [2])

  // Stock limit error on PATCH surfaces clear message and keeps quantity at 2
  const stockFail = await useStore.getState().updateCartQuantity('501', 9)
  assert.equal(stockFail, false)
  assert.match(useStore.getState().cartError || '', /exceeds available stock/i)
  assert.equal(useStore.getState().cart[0].quantity, 2)

  // Invalid promo preserves cart untouched
  const badPromo = await useStore.getState().applyPromoCode('WELCOME10')
  assert.equal(badPromo.ok, false)
  assert.equal(useStore.getState().cart.length, 1)
  assert.equal(useStore.getState().authCartSummary?.totalUsd, 264)

  // Valid promo ARU3D updates discount & total from server
  const goodPromo = await useStore.getState().applyPromoCode('ARU3D')
  assert.equal(goodPromo.ok, true)
  assert.equal(useStore.getState().authCartSummary?.promoCode, 'ARU3D')
  assert.equal(useStore.getState().authCartSummary?.discountUsd, 39.6)
  assert.equal(useStore.getState().authCartSummary?.totalUsd, 224.4)

  // Verify zero token / user / serverItemId leakage in localStorage while logged in
  const rawStorage = JSON.stringify(
    Object.fromEntries(mockLocalStorage.map.entries())
  )
  assert.equal(rawStorage.includes('jwt-auth-cart-test'), false)
  assert.equal(rawStorage.includes('buyer@arustore.ir'), false)
  assert.equal(rawStorage.includes('501'), false)

  // Logout wipes all authenticated cart & wishlist state (never exposed after logout!)
  await useStore.getState().logoutUser()
  assert.equal(useStore.getState().user, null)
  assert.equal(useStore.getState().authCartSummary, null)
  assert.deepEqual(useStore.getState().cart, [])
  assert.deepEqual(useStore.getState().wishlistIds, [])
  assert.deepEqual(useStore.getState().authWishlistProducts, [])
})

test('3. Guest-to-user merge combines matching variants without duplicates and preserves failed guest entries', async () => {
  const { useStore } = storeMod
  const { mapProductDtoToProduct } = catalogApiMod

  const prod1Dto = makeBackendProductDto(1, { stock_quantity: 10 })
  const prod2Dto = makeBackendProductDto(2, { stock_quantity: 10 })
  const prod3Dto = makeBackendProductDto(3, { stock_quantity: 2 })

  const prod1 = mapProductDtoToProduct(prod1Dto)
  const prod2 = mapProductDtoToProduct(prod2Dto)
  const prod3 = mapProductDtoToProduct(prod3Dto)

  // Guest adds:
  // - 2 x Prod #2 (champagne, standard) -> matches existing server line (qty 3 -> merged 5!)
  // - 1 x Prod #1 (champagne, standard) -> new server line
  // - 2 x Prod #3 (champagne, standard) -> server stock was reduced to 1 on server -> 400 fail!
  await useStore.getState().addToCart(prod2, 2, prod2.colors[0], 'standard')
  await useStore.getState().addToCart(prod1, 1, prod1.colors[0], 'standard')
  await useStore.getState().addToCart(prod3, 2, prod3.colors[0], 'standard')

  // Guest wishlist has [2, 999] where 999 fails 404 on server
  useStore.setState({
    guestWishlistIds: [2, 999],
    wishlistIds: [2, 999],
  })

  let serverItems = [
    {
      id: 41,
      product_id: 2,
      quantity: 3,
      selected_color: prod2Dto.colors[0],
      selected_edition: 'standard',
      unit_price: 120,
      unit_price_toman: 6600000,
      line_total: 360,
      line_total_toman: 19800000,
      product: prod2Dto,
    },
  ]
  let serverWishlist = []
  let nextId = 42

  globalThis.fetch = async (url, init = {}) => {
    const u = String(url)
    const method = init.method || 'GET'
    if (u.endsWith('/auth/login/json')) {
      return jsonResponse({
        access_token: 'jwt-merge-token',
        token_type: 'bearer',
        user: {
          id: 22,
          email: 'merge@arustore.ir',
          full_name: 'Merge User',
          is_admin: false,
        },
      })
    }
    if (u.includes('/cart/items/') && method === 'PATCH') {
      const id = Number(u.split('/cart/items/')[1])
      const { quantity } = JSON.parse(init.body)
      serverItems = serverItems.map((it) =>
        it.id === id
          ? {
              ...it,
              quantity,
              line_total: it.unit_price * quantity,
              line_total_toman: it.unit_price_toman * quantity,
            }
          : it
      )
      return jsonResponse(makeCartSummaryDto(serverItems))
    }
    if (u.endsWith('/cart/items') && method === 'POST') {
      const body = JSON.parse(init.body)
      if (body.product_id === 3) {
        return jsonResponse(
          { detail: 'Requested quantity exceeds available stock (1 available)' },
          400
        )
      }
      const dto = body.product_id === 1 ? prod1Dto : prod2Dto
      serverItems.push({
        id: nextId++,
        product_id: body.product_id,
        quantity: body.quantity,
        selected_color: body.selected_color || dto.colors[0],
        selected_edition: body.selected_edition || 'standard',
        unit_price: dto.price,
        unit_price_toman: dto.price_toman,
        line_total: dto.price * body.quantity,
        line_total_toman: dto.price_toman * body.quantity,
        product: dto,
      })
      return jsonResponse(makeCartSummaryDto(serverItems), 201)
    }
    if (u.includes('/cart/')) {
      return jsonResponse(makeCartSummaryDto(serverItems))
    }
    if (u.includes('/wishlist/')) {
      if (method === 'POST') {
        const pid = Number(u.split('/wishlist/')[1])
        if (pid === 999) {
          return jsonResponse({ detail: 'Product not found' }, 404)
        }
        serverWishlist.push(prod2Dto)
        return jsonResponse({ message: 'Added' }, 201)
      }
      return jsonResponse(serverWishlist)
    }
    throw new Error(`Unexpected fetch: ${method} ${u}`)
  }

  await useStore.getState().loginUser('merge@arustore.ir', 'StrongPass123!')

  const st = useStore.getState()
  // Server cart has NO duplicate lines: Prod #2 merged to qty 5, Prod #1 added with qty 1
  assert.equal(st.cart.length, 2)
  const mergedProd2 = st.cart.find((i) => i.product.id === 2)
  const mergedProd1 = st.cart.find((i) => i.product.id === 1)
  assert.equal(mergedProd2?.quantity, 5)
  assert.equal(mergedProd1?.quantity, 1)

  // Confirmed guest entries were removed, while failed Prod #3 and wishlist #999 were preserved!
  assert.equal(st.guestCart.length, 1)
  assert.equal(st.guestCart[0].product.id, 3)
  assert.equal(st.guestCart[0].quantity, 2)
  assert.deepEqual(st.guestWishlistIds, [999])
  assert.ok(st.mergeError)
})

test('4. Idempotent merge retry after network timeout NEVER doubles quantities (both PATCH and POST)', async () => {
  const { useStore } = storeMod
  const { mapProductDtoToProduct } = catalogApiMod

  const prod1Dto = makeBackendProductDto(1, { stock_quantity: 20 })
  const prod2Dto = makeBackendProductDto(2, { stock_quantity: 20 })
  const prod1 = mapProductDtoToProduct(prod1Dto)
  const prod2 = mapProductDtoToProduct(prod2Dto)

  // Guest has 3 x Prod #2 (server already has 2 -> target = 5) AND 2 x Prod #1 (server has 0 -> target = 2)
  await useStore.getState().addToCart(prod2, 3, prod2.colors[0], 'standard')
  await useStore.getState().addToCart(prod1, 2, prod1.colors[0], 'standard')

  let serverItems = [
    {
      id: 77,
      product_id: 2,
      quantity: 2,
      selected_color: prod2Dto.colors[0],
      selected_edition: 'standard',
      unit_price: prod2Dto.price,
      unit_price_toman: prod2Dto.price_toman,
      line_total: prod2Dto.price * 2,
      line_total_toman: prod2Dto.price_toman * 2,
      product: prod2Dto,
    },
  ]

  let simulateNetworkDropAfterServerCommit = true
  let patchCount = 0
  let postCount = 0

  globalThis.fetch = async (url, init = {}) => {
    const u = String(url)
    const method = init.method || 'GET'
    if (u.endsWith('/auth/login/json')) {
      return jsonResponse({
        access_token: 'jwt-retry-token',
        token_type: 'bearer',
        user: {
          id: 33,
          email: 'retry@arustore.ir',
          full_name: 'Retry User',
          is_admin: false,
        },
      })
    }
    if (u.includes('/cart/items/77') && method === 'PATCH') {
      patchCount += 1
      const { quantity } = JSON.parse(init.body)
      // Server commits the update BEFORE connection drops!
      serverItems = serverItems.map((it) =>
        it.id === 77
          ? {
              ...it,
              quantity,
              line_total: it.unit_price * quantity,
              line_total_toman: it.unit_price_toman * quantity,
            }
          : it
      )
      if (simulateNetworkDropAfterServerCommit) {
        throw new TypeError('network timeout after server commit')
      }
      return jsonResponse(makeCartSummaryDto(serverItems))
    }
    if (u.endsWith('/cart/items') && method === 'POST') {
      postCount += 1
      const body = JSON.parse(init.body)
      // Server commits the new item BEFORE connection drops!
      serverItems.push({
        id: 88,
        product_id: body.product_id,
        quantity: body.quantity,
        selected_color: body.selected_color || prod1Dto.colors[0],
        selected_edition: body.selected_edition || 'standard',
        unit_price: prod1Dto.price,
        unit_price_toman: prod1Dto.price_toman,
        line_total: prod1Dto.price * body.quantity,
        line_total_toman: prod1Dto.price_toman * body.quantity,
        product: prod1Dto,
      })
      if (simulateNetworkDropAfterServerCommit) {
        throw new TypeError('network timeout after server commit')
      }
      return jsonResponse(makeCartSummaryDto(serverItems), 201)
    }
    if (u.includes('/cart/')) {
      return jsonResponse(makeCartSummaryDto(serverItems))
    }
    if (u.includes('/wishlist/')) {
      return jsonResponse([])
    }
    throw new Error(`Unexpected fetch: ${method} ${u}`)
  }

  // Attempt 1: Both mutations commit on server (Prod #2 -> 5, Prod #1 -> 2), then network drops!
  await useStore.getState().loginUser('retry@arustore.ir', 'StrongPass123!')
  assert.equal(useStore.getState().guestCart.length, 2)
  assert.equal(patchCount, 1)
  assert.equal(postCount, 1)

  // Attempt 2: Network recovers and syncAuthenticatedState() retries!
  simulateNetworkDropAfterServerCommit = false
  await useStore.getState().syncAuthenticatedState()

  const finalState = useStore.getState()
  // Guest cart is now empty (confirmed!) AND quantities are 5 and 2 — NEVER doubled to 8 or 4!
  assert.equal(finalState.guestCart.length, 0)
  assert.equal(
    finalState.cart.find((i) => i.product.id === 2)?.quantity,
    5
  )
  assert.equal(
    finalState.cart.find((i) => i.product.id === 1)?.quantity,
    2
  )
  // Because server already had target quantities (5 and 2), retry did NOT even need extra PATCH/POST!
  assert.equal(patchCount, 1)
  assert.equal(postCount, 1)
})

test('5. Authenticated wishlist sync deduplicates concurrent toggles and updates from server state', async () => {
  const { useStore } = storeMod
  const prod2Dto = makeBackendProductDto(2)
  let serverWishlist = []
  let addCalls = 0
  let removeCalls = 0

  globalThis.fetch = async (url, init = {}) => {
    const u = String(url)
    const method = init.method || 'GET'
    if (u.endsWith('/auth/login/json')) {
      return jsonResponse({
        access_token: 'jwt-wish-token',
        token_type: 'bearer',
        user: {
          id: 44,
          email: 'wish@arustore.ir',
          full_name: 'Wish User',
          is_admin: false,
        },
      })
    }
    if (u.includes('/cart/')) {
      return jsonResponse(makeCartSummaryDto([]))
    }
    if (u.endsWith('/wishlist/2') && method === 'POST') {
      addCalls += 1
      await new Promise((r) => setTimeout(r, 15))
      serverWishlist = [prod2Dto]
      return jsonResponse({ message: 'Added' }, 201)
    }
    if (u.endsWith('/wishlist/2') && method === 'DELETE') {
      removeCalls += 1
      serverWishlist = []
      return jsonResponse({ message: 'Removed' }, 200)
    }
    if (u.includes('/wishlist/')) {
      return jsonResponse(serverWishlist)
    }
    throw new Error(`Unexpected fetch: ${method} ${u}`)
  }

  await useStore.getState().loginUser('wish@arustore.ir', 'StrongPass123!')

  // Fire two concurrent toggles for product #2 -> deduplicated to 1 POST
  const [r1, r2] = await Promise.all([
    useStore.getState().toggleWishlist(2),
    useStore.getState().toggleWishlist(2),
  ])
  assert.equal(r1, true)
  assert.equal(r2, false)
  assert.equal(addCalls, 1)
  assert.deepEqual(useStore.getState().wishlistIds, [2])
  assert.equal(useStore.getState().authWishlistProducts.length, 1)

  // Toggle again -> removes from server wishlist
  const r3 = await useStore.getState().toggleWishlist(2)
  assert.equal(r3, true)
  assert.equal(removeCalls, 1)
  assert.deepEqual(useStore.getState().wishlistIds, [])
  assert.equal(useStore.getState().authWishlistProducts.length, 0)
})

test('6. Checkout cannot fake a successful order, collect card credentials, or clear the cart', () => {
  const { useStore } = storeMod

  // Store-level guard rejects simulated order creation
  assert.throws(
    () =>
      useStore.getState().placeOrder({
        customerName: 'Test',
        shippingAddress: 'Tehran',
      }),
    /disabled/i
  )
  assert.equal(useStore.getState().orders.length, 0)

  const checkoutPageSrc = fs.readFileSync(
    path.join(frontendRoot, 'app/(main)/checkout/page.tsx'),
    'utf8'
  )
  const paymentFormSrc = fs.readFileSync(
    path.join(frontendRoot, 'components/checkout/PaymentForm.tsx'),
    'utf8'
  )
  const shippingFormSrc = fs.readFileSync(
    path.join(frontendRoot, 'components/checkout/ShippingForm.tsx'),
    'utf8'
  )

  // No simulated order placement, timeout confirmation, or cart clearing in Checkout
  assert.equal(checkoutPageSrc.includes('placeOrder('), false)
  assert.equal(checkoutPageSrc.includes('setTimeout('), false)
  assert.equal(checkoutPageSrc.includes('clearCart('), false)
  assert.equal(checkoutPageSrc.includes('role="status"'), true)

  // No prefilled card details or live card-number inputs in PaymentForm / ShippingForm
  assert.equal(paymentFormSrc.includes('6037'), false)
  assert.equal(paymentFormSrc.includes('9975'), false)
  assert.equal(paymentFormSrc.includes('08/29'), false)
  assert.equal(paymentFormSrc.includes('ARIAN RADMEHR'), false)
  assert.equal(checkoutPageSrc.includes('6037'), false)
  assert.equal(checkoutPageSrc.includes('ARIAN RADMEHR'), false)
  assert.equal(checkoutPageSrc.includes('آرین رادمهر'), false)
  assert.equal(checkoutPageSrc.includes('09123456789'), false)
  assert.equal(shippingFormSrc.includes('آرین رادمهر'), false)
  assert.equal(shippingFormSrc.includes('09123456789'), false)
})
