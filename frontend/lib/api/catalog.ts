import {
  Brand,
  Category,
  Product,
  ProductColorOption,
  ProductEditionOption,
  ProductImage,
  ProductReview,
  ProductSpec,
} from '@/types'
import {
  ARCHETYPE_ACCENT_HEX,
  CANONICAL_FINISH_OPTIONS,
  CATEGORY_PRESENTATION_BY_SLUG,
  DEFAULT_CATEGORY_PRESENTATION,
  FinishFilterOption,
  HERO_SHOWCASE_ITEMS,
  normalizeModelArchetype,
  resolveAccentHex,
  resolveBrandSlugAlias,
  resolveCanonicalProductIdentifier,
  resolveCategorySlugAlias,
} from '@/lib/data/catalog'
import { ApiError, ApiRequestOptions, aruApi } from '@/lib/api/client'

export interface PaginationMetaDto {
  total: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface BrandDto {
  id: number
  name: string
  name_fa: string
  slug: string
  description?: string | null
  description_fa?: string | null
  logo?: string | null
  country: string
  product_count?: number
}

export interface CategoryDto {
  id: number
  parent_id?: number | null
  name: string
  name_fa: string
  slug: string
  description?: string | null
  description_fa?: string | null
  image?: string | null
  accent?: string | null
  product_count?: number
}

export interface ProductImageDto {
  id?: number | null
  url: string
  alt?: string | null
  is_primary?: boolean
}

export interface ProductColorOptionDto {
  id?: string
  name?: string
  name_fa?: string
  hex?: string
  accentHex?: string
}

export interface ProductSpecDto {
  label?: string
  label_fa?: string
  value?: string
  value_fa?: string
}

export interface ProductEditionDto {
  id?: string
  name?: string
  name_fa?: string
  label?: string
  label_fa?: string
  priceDelta?: number
  priceDeltaToman?: number
}

export interface ProductDto {
  id: number
  sku: string
  slug: string
  name: string
  name_fa: string
  description: string
  description_fa: string
  price: number
  compare_at_price?: number | null
  price_toman: number
  compare_at_toman?: number | null
  stock_quantity: number
  in_stock: boolean
  is_featured: boolean
  is_new: boolean
  is_on_sale: boolean
  archetype: string
  colors?: ProductColorOptionDto[] | null
  specs?: ProductSpecDto[] | null
  highlights?: string[] | null
  highlights_fa?: string[] | null
  editions?: ProductEditionDto[] | null
  rating_avg: number
  review_count: number
  images?: ProductImageDto[] | null
  brand?: BrandDto | null
  category?: CategoryDto | null
  created_at?: string | null
}

export interface PaginatedProductsDto {
  items: ProductDto[]
  meta: PaginationMetaDto
}

export interface ReviewDto {
  id: number
  product_id: number
  user_id: number
  author_name?: string
  rating: number
  title?: string | null
  comment: string
  is_verified_purchase: boolean
  created_at?: string | null
}

export type ProductSortOption =
  | 'featured'
  | 'newest'
  | 'price-asc'
  | 'price-desc'
  | 'rating'

export interface CatalogProductsQuery {
  categoryId?: number
  categorySlug?: string
  brandId?: number
  brandSlugs?: string[]
  color?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  inStock?: boolean
  isOnSale?: boolean
  isFeatured?: boolean
  isNew?: boolean
  sortBy?: ProductSortOption
  page?: number
  pageSize?: number
}

export interface PaginatedCatalogProducts {
  items: Product[]
  meta: PaginationMetaDto
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function assertPaginationMetaDto(raw: unknown): PaginationMetaDto {
  if (
    !isRecord(raw) ||
    typeof raw.total !== 'number' ||
    typeof raw.page !== 'number' ||
    typeof raw.page_size !== 'number' ||
    typeof raw.total_pages !== 'number' ||
    typeof raw.has_next !== 'boolean' ||
    typeof raw.has_prev !== 'boolean'
  ) {
    throw new ApiError('Invalid catalog pagination metadata from server', 502)
  }
  return {
    total: raw.total,
    page: raw.page,
    page_size: raw.page_size,
    total_pages: raw.total_pages,
    has_next: raw.has_next,
    has_prev: raw.has_prev,
  }
}

export function assertProductDto(raw: unknown): ProductDto {
  if (
    !isRecord(raw) ||
    typeof raw.id !== 'number' ||
    typeof raw.slug !== 'string' ||
    typeof raw.name !== 'string' ||
    typeof raw.name_fa !== 'string' ||
    typeof raw.price !== 'number' ||
    typeof raw.price_toman !== 'number' ||
    typeof raw.stock_quantity !== 'number'
  ) {
    throw new ApiError('Invalid product payload from server', 502)
  }
  return raw as unknown as ProductDto
}

export function assertPaginatedProductsDto(raw: unknown): PaginatedProductsDto {
  if (!isRecord(raw) || !Array.isArray(raw.items) || !('meta' in raw)) {
    throw new ApiError('Invalid paginated products payload from server', 502)
  }
  return {
    items: raw.items.map(assertProductDto),
    meta: assertPaginationMetaDto(raw.meta),
  }
}

export function assertCategoryDtoArray(raw: unknown): CategoryDto[] {
  if (!Array.isArray(raw)) {
    throw new ApiError('Invalid categories payload from server (expected array)', 502)
  }
  return raw.map((item) => {
    if (
      !isRecord(item) ||
      typeof item.id !== 'number' ||
      typeof item.slug !== 'string' ||
      typeof item.name !== 'string' ||
      typeof item.name_fa !== 'string'
    ) {
      throw new ApiError('Invalid category item from server', 502)
    }
    return item as unknown as CategoryDto
  })
}

export function assertBrandDtoArray(raw: unknown): BrandDto[] {
  if (!Array.isArray(raw)) {
    throw new ApiError('Invalid brands payload from server (expected array)', 502)
  }
  return raw.map((item) => {
    if (
      !isRecord(item) ||
      typeof item.id !== 'number' ||
      typeof item.slug !== 'string' ||
      typeof item.name !== 'string' ||
      typeof item.name_fa !== 'string'
    ) {
      throw new ApiError('Invalid brand item from server', 502)
    }
    return item as unknown as BrandDto
  })
}

export function mapBrandDtoToBrand(dto: BrandDto): Brand {
  const desc = dto.description?.trim() || ''
  const descFa = dto.description_fa?.trim() || desc
  return {
    id: dto.id,
    name: dto.name,
    name_fa: dto.name_fa,
    slug: dto.slug,
    description: dto.description ?? null,
    description_fa: dto.description_fa ?? null,
    logo: dto.logo ?? null,
    country: dto.country,
    tagline: desc,
    tagline_fa: descFa,
    product_count: typeof dto.product_count === 'number' ? dto.product_count : 0,
  }
}

export function mapCategoryDtoToCategory(dto: CategoryDto): Category {
  const presentation =
    CATEGORY_PRESENTATION_BY_SLUG[dto.slug] || DEFAULT_CATEGORY_PRESENTATION
  return {
    id: dto.id,
    parent_id: dto.parent_id ?? null,
    name: dto.name,
    name_fa: dto.name_fa,
    slug: dto.slug,
    description: dto.description ?? '',
    description_fa: dto.description_fa ?? '',
    icon: presentation.icon,
    gradient: presentation.gradient,
    accent: resolveAccentHex(dto.accent, presentation.defaultAccent),
    image: dto.image?.trim() || presentation.defaultImage,
    archetype: presentation.archetype,
    product_count: typeof dto.product_count === 'number' ? dto.product_count : 0,
  }
}

export function mapReviewDtoToProductReview(dto: ReviewDto): ProductReview {
  const title = dto.title?.trim() || ''
  const createdDate = dto.created_at ? dto.created_at.slice(0, 10) : ''
  return {
    id: dto.id,
    user_name: dto.author_name?.trim() || `User #${dto.user_id}`,
    rating: dto.rating,
    title,
    title_fa: title,
    comment: dto.comment,
    comment_fa: dto.comment,
    created_at: createdDate,
    verified: Boolean(dto.is_verified_purchase),
  }
}

function mapColorOptionDto(
  raw: ProductColorOptionDto,
  index: number
): ProductColorOption | null {
  const hex = typeof raw.hex === 'string' && raw.hex.trim() ? raw.hex.trim() : null
  if (!hex) return null
  const id =
    typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : `finish-${index + 1}`
  const name =
    typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : id
  const nameFa =
    typeof raw.name_fa === 'string' && raw.name_fa.trim()
      ? raw.name_fa.trim()
      : name
  const accentHex =
    typeof raw.accentHex === 'string' && raw.accentHex.trim()
      ? raw.accentHex.trim()
      : hex
  return {
    id,
    name,
    name_fa: nameFa,
    hex,
    accentHex,
  }
}

function mapEditionOptionDto(
  raw: ProductEditionDto,
  index: number
): ProductEditionOption | null {
  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id.trim()
      : `edition-${index + 1}`
  const label =
    (typeof raw.label === 'string' && raw.label.trim()) ||
    (typeof raw.name === 'string' && raw.name.trim()) ||
    ''
  const labelFa =
    (typeof raw.label_fa === 'string' && raw.label_fa.trim()) ||
    (typeof raw.name_fa === 'string' && raw.name_fa.trim()) ||
    label
  if (!label && !labelFa) return null
  return {
    id,
    label: label || labelFa,
    label_fa: labelFa || label,
    priceDelta: typeof raw.priceDelta === 'number' ? raw.priceDelta : 0,
    priceDeltaToman:
      typeof raw.priceDeltaToman === 'number' ? raw.priceDeltaToman : 0,
  }
}

function mapSpecDto(raw: ProductSpecDto): ProductSpec | null {
  const label = typeof raw.label === 'string' ? raw.label.trim() : ''
  const labelFa = typeof raw.label_fa === 'string' ? raw.label_fa.trim() : ''
  const value = typeof raw.value === 'string' ? raw.value.trim() : ''
  const valueFa = typeof raw.value_fa === 'string' ? raw.value_fa.trim() : ''
  if (!label && !labelFa) return null
  if (!value && !valueFa) return null
  return {
    label: label || labelFa,
    label_fa: labelFa || label,
    value: value || valueFa,
    value_fa: valueFa || value,
  }
}

function mapImageDto(
  raw: ProductImageDto,
  index: number,
  fallbackAlt: string
): ProductImage | null {
  if (typeof raw.url !== 'string' || !raw.url.trim()) return null
  return {
    id: typeof raw.id === 'number' ? raw.id : index + 1,
    url: raw.url.trim(),
    alt:
      typeof raw.alt === 'string' && raw.alt.trim()
        ? raw.alt.trim()
        : fallbackAlt,
    is_primary: Boolean(raw.is_primary ?? index === 0),
  }
}

export function mapProductDtoToProduct(
  dto: ProductDto,
  reviews: ProductReview[] = []
): Product {
  const archetype = normalizeModelArchetype(dto.archetype)
  const colors = Array.isArray(dto.colors)
    ? dto.colors
        .map((c, idx) => mapColorOptionDto(c, idx))
        .filter((c): c is ProductColorOption => c !== null)
    : []

  const editions = Array.isArray(dto.editions)
    ? dto.editions
        .map((ed, idx) => mapEditionOptionDto(ed, idx))
        .filter((ed): ed is ProductEditionOption => ed !== null)
    : []

  const specs = Array.isArray(dto.specs)
    ? dto.specs
        .map((s) => mapSpecDto(s))
        .filter((s): s is ProductSpec => s !== null)
    : []

  const highlights = Array.isArray(dto.highlights)
    ? dto.highlights.filter((h): h is string => typeof h === 'string' && Boolean(h.trim()))
    : []

  const highlightsFa = Array.isArray(dto.highlights_fa)
    ? dto.highlights_fa.filter(
        (h): h is string => typeof h === 'string' && Boolean(h.trim())
      )
    : []

  const images = Array.isArray(dto.images)
    ? dto.images
        .map((img, idx) => mapImageDto(img, idx, dto.name_fa || dto.name))
        .filter((img): img is ProductImage => img !== null)
    : []

  const comparePrice =
    typeof dto.compare_at_price === 'number' && dto.compare_at_price > 0
      ? dto.compare_at_price
      : undefined

  const comparePriceToman =
    typeof dto.compare_at_toman === 'number' && dto.compare_at_toman > 0
      ? dto.compare_at_toman
      : undefined

  const available = Boolean(dto.in_stock) && dto.stock_quantity > 0

  return {
    id: dto.id,
    sku: dto.sku,
    name: dto.name,
    name_fa: dto.name_fa,
    slug: dto.slug,
    subtitle: highlights[0] || '',
    subtitle_fa: highlightsFa[0] || '',
    description: dto.description,
    description_fa: dto.description_fa,
    price: dto.price,
    compare_price: comparePrice,
    price_toman: dto.price_toman,
    compare_price_toman: comparePriceToman,
    stock_quantity: dto.stock_quantity,
    in_stock: available,
    is_on_sale: Boolean(dto.is_on_sale),
    rating_avg: dto.rating_avg,
    rating_count: dto.review_count,
    is_featured: Boolean(dto.is_featured),
    is_new: Boolean(dto.is_new),
    archetype,
    accent_color:
      colors[0]?.accentHex || ARCHETYPE_ACCENT_HEX[archetype] || '#dfc08e',
    colors,
    editions: editions.length > 0 ? editions : undefined,
    brand: dto.brand ? mapBrandDtoToBrand(dto.brand) : null,
    category: dto.category ? mapCategoryDtoToCategory(dto.category) : null,
    images,
    specs,
    highlights,
    highlights_fa: highlightsFa,
    reviews,
  }
}

export function buildProductListQuery(query: CatalogProductsQuery = {}): string {
  const params = new URLSearchParams()

  if (typeof query.categoryId === 'number') {
    params.set('category_id', String(query.categoryId))
  }
  if (query.categorySlug && query.categorySlug !== 'all') {
    params.set('category_slug', resolveCategorySlugAlias(query.categorySlug))
  }
  if (typeof query.brandId === 'number') {
    params.set('brand_id', String(query.brandId))
  }
  if (query.brandSlugs && query.brandSlugs.length > 0) {
    const uniqueBrands = Array.from(
      new Set(
        query.brandSlugs
          .map((slug) => resolveBrandSlugAlias(slug))
          .filter(Boolean)
      )
    )
    if (uniqueBrands.length === 1) {
      params.set('brand_slug', uniqueBrands[0])
    } else {
      for (const slug of uniqueBrands) {
        params.append('brand_slugs', slug)
      }
    }
  }
  if (query.color && query.color.trim()) {
    params.set('color', query.color.trim())
  }
  if (typeof query.minPrice === 'number') {
    params.set('min_price', String(query.minPrice))
  }
  if (typeof query.maxPrice === 'number') {
    params.set('max_price', String(query.maxPrice))
  }
  if (query.search && query.search.trim()) {
    params.set('search', query.search.trim())
  }
  if (typeof query.inStock === 'boolean') {
    params.set('in_stock', String(query.inStock))
  }
  if (typeof query.isOnSale === 'boolean') {
    params.set('is_on_sale', String(query.isOnSale))
  }
  if (typeof query.isFeatured === 'boolean') {
    params.set('is_featured', String(query.isFeatured))
  }
  if (typeof query.isNew === 'boolean') {
    params.set('is_new', String(query.isNew))
  }
  if (query.sortBy) {
    params.set('sort_by', query.sortBy)
  }
  if (typeof query.page === 'number' && query.page >= 1) {
    params.set('page', String(query.page))
  }
  if (typeof query.pageSize === 'number' && query.pageSize >= 1) {
    params.set('page_size', String(query.pageSize))
  }

  return params.toString()
}

export function selectHeroShowcaseProducts(products: Product[]): Product[] {
  const matched: Product[] = []
  for (const target of HERO_SHOWCASE_ITEMS) {
    const found = products.find(
      (p) =>
        (p.sku && p.sku.toUpperCase() === target.sku) || p.slug === target.slug
    )
    if (found && !matched.some((m) => m.id === found.id)) {
      matched.push(found)
    }
  }
  return matched
}

export function deriveAvailableFinishOptions(
  products: Product[]
): FinishFilterOption[] {
  const map = new Map<string, FinishFilterOption>()
  for (const base of CANONICAL_FINISH_OPTIONS) {
    map.set(base.id.toLowerCase(), base)
  }
  for (const product of products) {
    for (const color of product.colors) {
      const key = color.id.trim().toLowerCase()
      if (!key || map.has(key)) continue
      map.set(key, {
        id: color.id.trim(),
        label: color.name,
        label_fa: color.name_fa,
        hex: color.accentHex || color.hex,
      })
    }
  }
  return Array.from(map.values())
}

let cachedCategories: Category[] | null = null
let inFlightCategories: Promise<Category[]> | null = null

let cachedBrands: Brand[] | null = null
let inFlightBrands: Promise<Brand[]> | null = null

export function clearCatalogCache(): void {
  cachedCategories = null
  inFlightCategories = null
  cachedBrands = null
  inFlightBrands = null
}

export async function fetchCatalogProducts(
  query: CatalogProductsQuery = {},
  options?: ApiRequestOptions
): Promise<PaginatedCatalogProducts> {
  const qs = buildProductListQuery(query)
  const raw = await aruApi.catalog.listProducts(qs, options)
  const dto = assertPaginatedProductsDto(raw)
  return {
    items: dto.items.map((item) => mapProductDtoToProduct(item)),
    meta: dto.meta,
  }
}

export async function fetchCatalogProductByIdentifier(
  slugOrId: string | number,
  options?: ApiRequestOptions
): Promise<Product> {
  const resolved =
    typeof slugOrId === 'string'
      ? resolveCanonicalProductIdentifier(slugOrId)
      : slugOrId
  const raw = await aruApi.catalog.getProduct(resolved, options)
  const dto = assertProductDto(raw)
  return mapProductDtoToProduct(dto)
}

export async function fetchRelatedCatalogProducts(
  productId: number,
  limit = 4,
  options?: ApiRequestOptions
): Promise<Product[]> {
  const raw = await aruApi.catalog.getRelatedProducts(productId, limit, options)
  if (!Array.isArray(raw)) {
    throw new ApiError('Invalid related products payload from server', 502)
  }
  return raw.map((entry) => mapProductDtoToProduct(assertProductDto(entry)))
}

export async function fetchProductReviews(
  productId: number,
  options?: ApiRequestOptions
): Promise<ProductReview[]> {
  const raw = await aruApi.reviews.listForProduct(productId, options)
  if (!Array.isArray(raw)) {
    return []
  }
  return raw
    .filter((r): r is ReviewDto => isRecord(r) && typeof r.id === 'number')
    .map(mapReviewDtoToProductReview)
}

export async function fetchCatalogCategories(
  forceRefresh = false,
  options?: ApiRequestOptions
): Promise<Category[]> {
  if (!forceRefresh && cachedCategories) {
    return cachedCategories
  }
  if (!forceRefresh && inFlightCategories) {
    return inFlightCategories
  }
  const request = (async () => {
    try {
      const raw = await aruApi.catalog.listCategories(options)
      const dtos = assertCategoryDtoArray(raw)
      const mapped = dtos.map(mapCategoryDtoToCategory)
      cachedCategories = mapped
      return mapped
    } finally {
      inFlightCategories = null
    }
  })()

  if (!forceRefresh) {
    inFlightCategories = request
  }
  return request
}

export async function fetchCatalogBrands(
  forceRefresh = false,
  options?: ApiRequestOptions
): Promise<Brand[]> {
  if (!forceRefresh && cachedBrands) {
    return cachedBrands
  }
  if (!forceRefresh && inFlightBrands) {
    return inFlightBrands
  }
  const request = (async () => {
    try {
      const raw = await aruApi.catalog.listBrands(options)
      const dtos = assertBrandDtoArray(raw)
      const mapped = dtos.map(mapBrandDtoToBrand)
      cachedBrands = mapped
      return mapped
    } finally {
      inFlightBrands = null
    }
  })()

  if (!forceRefresh) {
    inFlightBrands = request
  }
  return request
}
