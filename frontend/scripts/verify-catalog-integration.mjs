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
const tmpOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arustore-catalog-test-'))

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

let catalogApiMod
let catalogDataMod
let clientMod
let storeMod

before(() => {
  const tscBin = path.join(frontendRoot, 'node_modules', 'typescript', 'bin', 'tsc')
  const tmpTsconfig = path.join(tmpOutDir, 'tsconfig.catalog.json')
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
        path.join(frontendRoot, 'lib/store/useStore.ts'),
      ],
    })
  )

  execFileSync(process.execPath, [tscBin, '-p', tmpTsconfig], {
    cwd: frontendRoot,
    stdio: 'inherit',
  })

  const originalResolve = Module._resolveFilename
  Module._resolveFilename = function resolveWithAlias(request, parent, isMain, options) {
    if (request.startsWith('@/')) {
      const mapped = path.join(tmpOutDir, request.slice(2))
      return originalResolve.call(this, mapped, parent, isMain, options)
    }
    if (!request.startsWith('.') && !path.isAbsolute(request)) {
      return originalResolve.call(this, request, parent, isMain, {
        ...options,
        paths: [path.join(frontendRoot, 'node_modules'), ...(options?.paths || [])],
      })
    }
    return originalResolve.call(this, request, parent, isMain, options)
  }

  const req = Module.createRequire(import.meta.url)
  clientMod = req(path.join(tmpOutDir, 'lib/api/client.js'))
  catalogDataMod = req(path.join(tmpOutDir, 'lib/data/catalog.js'))
  catalogApiMod = req(path.join(tmpOutDir, 'lib/api/catalog.js'))
  storeMod = req(path.join(tmpOutDir, 'lib/store/useStore.js'))
})

after(() => {
  fs.rmSync(tmpOutDir, { recursive: true, force: true })
})

beforeEach(() => {
  mockLocalStorage.clear()
  catalogApiMod.clearCatalogCache()
  storeMod.useStore.setState({ products: [] })
})

test('1. Shadowing Next.js mock catalog routes and static commercial arrays are absent', () => {
  for (const rel of [
    'app/api/v1/products/route.ts',
    'app/api/v1/categories/route.ts',
    'app/api/v1/brands/route.ts',
  ]) {
    assert.equal(
      fs.existsSync(path.join(frontendRoot, rel)),
      false,
      `Shadowing mock route ${rel} must not exist`
    )
  }

  assert.equal('PRODUCTS' in catalogDataMod, false)
  assert.equal('CATEGORIES' in catalogDataMod, false)
  assert.equal('BRANDS' in catalogDataMod, false)
  assert.deepEqual(storeMod.useStore.getState().products, [])
})

test('2. Product DTO mapping maps backend fields explicitly without fabricating commercial values', () => {
  const mapped = catalogApiMod.mapProductDtoToProduct({
    id: 1,
    sku: 'ARU-101',
    slug: 'shahnameh-3tier-aluminum-pastry-stand',
    name: 'Shahnameh 3-Tier Cast Aluminum Pastry Stand',
    name_fa: 'شیرینی‌خوری سه‌طبقه آلومینیومی مدل شاهنامه',
    description: 'Precision cast aluminum stand.',
    description_fa: 'شیرینی‌خوری ریخته‌گری‌شده.',
    price: 118,
    compare_at_price: 139,
    price_toman: 6490000,
    compare_at_toman: 7650000,
    stock_quantity: 14,
    in_stock: true,
    is_featured: true,
    is_new: true,
    is_on_sale: true,
    archetype: 'tiered-stand',
    colors: [
      {
        id: 'champagne',
        name: 'Satin Silver & Champagne Gold',
        name_fa: 'سیلور ساتن و طلایی شامپاینی',
        hex: '#d8dee9',
        accentHex: '#d6b88a',
      },
    ],
    specs: [
      {
        label: 'Height',
        label_fa: 'ارتفاع',
        value: '42 cm',
        value_fa: '۴۲ سانتی‌متر',
      },
    ],
    highlights: ['Tarnish-free anodize'],
    highlights_fa: ['آنودایز رنگ‌ثابت'],
    editions: [
      {
        id: 'bridal',
        name: 'Velvet Gift Chest',
        name_fa: 'جعبه مخملی تشریفاتی',
        priceDelta: 14,
        priceDeltaToman: 770000,
      },
    ],
    rating_avg: 4.9,
    review_count: 42,
    images: [
      {
        id: 10,
        url: '/images/products/tiered-stand.png',
        alt: 'استند شاهنامه',
        is_primary: true,
      },
    ],
    brand: {
      id: 1,
      name: 'Aru Cast Atelier',
      name_fa: 'کارگاه ریخته‌گری آرو',
      slug: 'aru-atelier',
      description: 'Fine cast aluminum',
      description_fa: 'ریخته‌گری ظریف آلومینیوم',
      country: 'Iran',
      product_count: 2,
    },
    category: {
      id: 1,
      name: 'Pastry & Tiered Stands',
      name_fa: 'شیرینی‌خوری و استند طبقاتی',
      slug: 'pastry-stands',
      description: 'Tiered stands',
      description_fa: 'استندهای طبقاتی',
      accent: 'gold',
      image: '/images/categories/pastry-stands.png',
      product_count: 2,
    },
  })

  assert.equal(mapped.sku, 'ARU-101')
  assert.equal(mapped.price, 118)
  assert.equal(mapped.compare_price, 139)
  assert.equal(mapped.price_toman, 6490000)
  assert.equal(mapped.compare_price_toman, 7650000)
  assert.equal(mapped.rating_count, 42)
  assert.equal(mapped.in_stock, true)
  assert.equal(mapped.editions?.[0].label, 'Velvet Gift Chest')
  assert.equal(mapped.editions?.[0].label_fa, 'جعبه مخملی تشریفاتی')
  assert.equal(mapped.brand?.tagline, 'Fine cast aluminum')
  assert.equal(mapped.brand?.tagline_fa, 'ریخته‌گری ظریف آلومینیوم')
  assert.equal(mapped.category?.accent, '#fbbf24')
  assert.equal(mapped.category?.product_count, 2)
})

test('3. Optional/missing fields and zero-stock availability are handled safely without fake options', () => {
  const minimal = catalogApiMod.mapProductDtoToProduct({
    id: 99,
    sku: 'ARU-MIN',
    slug: 'minimal-vessel',
    name: 'Minimal Vessel',
    name_fa: 'ظرف مینیمال',
    description: 'Desc',
    description_fa: 'توضیح',
    price: 60,
    compare_at_price: null,
    price_toman: 3300000,
    compare_at_toman: null,
    stock_quantity: 0,
    in_stock: true,
    is_featured: false,
    is_new: false,
    is_on_sale: false,
    archetype: 'unknown-archetype',
    colors: [],
    specs: [],
    highlights: [],
    highlights_fa: [],
    editions: [],
    rating_avg: 0,
    review_count: 0,
    images: [],
    brand: null,
    category: null,
  })

  assert.equal(minimal.compare_price, undefined)
  assert.equal(minimal.compare_price_toman, undefined)
  assert.equal(minimal.in_stock, false)
  assert.equal(catalogDataMod.isProductAvailable(minimal), false)
  assert.equal(minimal.archetype, 'fruit-bowl')
  assert.deepEqual(minimal.colors, [])
  assert.equal(minimal.editions, undefined)
  assert.deepEqual(minimal.images, [])
  assert.equal(minimal.brand, null)
  assert.equal(minimal.category, null)
  assert.deepEqual(minimal.reviews, [])
  // Pure 3D shader fallback finish works even when selectable colors array is empty
  assert.equal(catalogDataMod.getProductPrimaryFinish(minimal).hex, '#d8dee9')
})

test('4. Category and Brand mappers accept array DTOs and reject legacy { items, total } mock shapes', () => {
  assert.throws(
    () => catalogApiMod.assertCategoryDtoArray({ items: [], total: 0 }),
    (err) => err instanceof clientMod.ApiError
  )
  assert.throws(
    () => catalogApiMod.assertBrandDtoArray({ items: [], total: 0 }),
    (err) => err instanceof clientMod.ApiError
  )
  assert.throws(
    () => catalogApiMod.assertPaginatedProductsDto({ items: [], total: 0 }),
    (err) => err instanceof clientMod.ApiError
  )

  const cats = catalogApiMod
    .assertCategoryDtoArray([
      {
        id: 2,
        name: 'Fruit Bowls & Centerpieces',
        name_fa: 'میوه‌خوری و کشکول',
        slug: 'fruit-vessels',
        accent: 'silver',
        product_count: 3,
      },
    ])
    .map(catalogApiMod.mapCategoryDtoToCategory)

  assert.equal(cats[0].product_count, 3)
  assert.equal(cats[0].accent, '#e2e8f0')

  const brands = catalogApiMod
    .assertBrandDtoArray([
      {
        id: 4,
        name: 'Parsia CNC Form',
        name_fa: 'پارسیا فرم CNC',
        slug: 'parsia-form',
        country: 'Iran',
        product_count: 2,
      },
    ])
    .map(catalogApiMod.mapBrandDtoToBrand)

  assert.equal(brands[0].product_count, 2)
  assert.equal(brands[0].tagline, '')
})

test('5. Query param construction supports multi-brand, legacy slug aliases, filters, and pagination', () => {
  const singleBrandQs = catalogApiMod.buildProductListQuery({
    categorySlug: 'trays-tea-sets',
    brandSlugs: ['arumetal-atelier'],
    maxPrice: 110,
    inStock: true,
    isOnSale: true,
    search: 'سینی',
    sortBy: 'price-asc',
    page: 2,
    pageSize: 6,
  })
  const singleParams = new URLSearchParams(singleBrandQs)
  assert.equal(singleParams.get('category_slug'), 'serving-trays')
  assert.equal(singleParams.get('brand_slug'), 'aru-atelier')
  assert.equal(singleParams.get('max_price'), '110')
  assert.equal(singleParams.get('in_stock'), 'true')
  assert.equal(singleParams.get('is_on_sale'), 'true')
  assert.equal(singleParams.get('search'), 'سینی')
  assert.equal(singleParams.get('sort_by'), 'price-asc')
  assert.equal(singleParams.get('page'), '2')
  assert.equal(singleParams.get('page_size'), '6')

  const multiBrandQs = catalogApiMod.buildProductListQuery({
    brandSlugs: ['aru-atelier', 'zarrin-anodize'],
    color: 'champagne',
  })
  const multiParams = new URLSearchParams(multiBrandQs)
  assert.deepEqual(multiParams.getAll('brand_slugs'), [
    'aru-atelier',
    'zarrin-anodize',
  ])
  assert.equal(multiParams.get('color'), 'champagne')
})

test('6. Pagination state, 404 missing product, API error propagation, and zero fallback to products[0] or mock data', async () => {
  // Missing product returns 404 ApiError — never products[0]
  globalThis.fetch = async (url) => {
    if (String(url).includes('/products/does-not-exist')) {
      return new Response(JSON.stringify({ detail: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    throw new Error(`Unexpected URL: ${url}`)
  }

  await assert.rejects(
    () => catalogApiMod.fetchCatalogProductByIdentifier('does-not-exist'),
    (err) => err instanceof clientMod.ApiError && err.status === 404
  )

  // Backend 500 error propagates cleanly without falling back to static mock data
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ detail: 'Database unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })

  await assert.rejects(
    () => catalogApiMod.fetchCatalogProducts({ page: 1, pageSize: 6 }),
    (err) => err instanceof clientMod.ApiError && err.status === 503
  )
  await assert.rejects(
    () => catalogApiMod.fetchCatalogCategories(true),
    (err) => err instanceof clientMod.ApiError && err.status === 503
  )
  assert.deepEqual(storeMod.useStore.getState().products, [])

  // Valid paginated response preserves full `meta`
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        items: [
          {
            id: 3,
            sku: 'ARU-103',
            slug: 'persepolis-engraved-aluminum-serving-tray',
            name: 'Persepolis Serving Tray',
            name_fa: 'سینی پذیرایی پرسپولیس',
            description: 'Engraved tray',
            description_fa: 'سینی قلم‌زنی',
            price: 84,
            price_toman: 4620000,
            stock_quantity: 9,
            in_stock: true,
            is_featured: true,
            is_new: false,
            is_on_sale: false,
            archetype: 'serving-tray',
            rating_avg: 4.8,
            review_count: 11,
          },
        ],
        meta: {
          total: 8,
          page: 2,
          page_size: 6,
          total_pages: 2,
          has_next: false,
          has_prev: true,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  const pageResult = await catalogApiMod.fetchCatalogProducts({
    page: 2,
    pageSize: 6,
  })
  assert.equal(pageResult.meta.total, 8)
  assert.equal(pageResult.meta.page, 2)
  assert.equal(pageResult.meta.total_pages, 2)
  assert.equal(pageResult.meta.has_prev, true)
  assert.equal(pageResult.meta.has_next, false)

  // HeroStage3D selector never falls back to products[0] when showcase SKUs/slugs are absent
  assert.deepEqual(
    catalogApiMod.selectHeroShowcaseProducts(pageResult.items),
    []
  )
})
