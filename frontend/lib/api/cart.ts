import {
  CartItemType,
  Product,
  ProductColorOption,
  ServerCartSummary,
} from '@/types'
import { DEFAULT_ALUMINUM_FINISH } from '@/lib/data/catalog'
import { ApiError, ApiRequestOptions, aruApi } from '@/lib/api/client'
import {
  assertProductDto,
  mapProductDtoToProduct,
  ProductColorOptionDto,
  ProductDto,
} from '@/lib/api/catalog'

export interface CartItemDto {
  id: number
  product_id: number
  quantity: number
  selected_color?: ProductColorOptionDto | null
  selected_edition?: string | null
  unit_price: number
  unit_price_toman: number
  line_total: number
  line_total_toman: number
  product: ProductDto
}

export interface CartSummaryDto {
  items: CartItemDto[]
  item_count: number
  subtotal: number
  subtotal_toman: number
  discount_amount: number
  discount_toman: number
  total: number
  total_toman: number
  promo_code?: string | null
  promo_percent: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

export function assertCartItemDto(raw: unknown): CartItemDto {
  if (
    !isRecord(raw) ||
    typeof raw.id !== 'number' ||
    typeof raw.product_id !== 'number' ||
    typeof raw.quantity !== 'number' ||
    typeof raw.unit_price !== 'number' ||
    typeof raw.unit_price_toman !== 'number' ||
    typeof raw.line_total !== 'number' ||
    typeof raw.line_total_toman !== 'number' ||
    !('product' in raw)
  ) {
    throw new ApiError('Invalid cart item payload from server', 502)
  }

  return {
    id: raw.id,
    product_id: raw.product_id,
    quantity: raw.quantity,
    selected_color: isRecord(raw.selected_color)
      ? (raw.selected_color as ProductColorOptionDto)
      : null,
    selected_edition:
      typeof raw.selected_edition === 'string' ? raw.selected_edition : null,
    unit_price: raw.unit_price,
    unit_price_toman: raw.unit_price_toman,
    line_total: raw.line_total,
    line_total_toman: raw.line_total_toman,
    product: assertProductDto(raw.product),
  }
}

export function assertCartSummaryDto(raw: unknown): CartSummaryDto {
  if (
    !isRecord(raw) ||
    !Array.isArray(raw.items) ||
    typeof raw.item_count !== 'number' ||
    typeof raw.subtotal !== 'number' ||
    typeof raw.subtotal_toman !== 'number' ||
    typeof raw.total !== 'number' ||
    typeof raw.total_toman !== 'number'
  ) {
    throw new ApiError('Invalid cart summary payload from server', 502)
  }

  return {
    items: raw.items.map(assertCartItemDto),
    item_count: raw.item_count,
    subtotal: raw.subtotal,
    subtotal_toman: raw.subtotal_toman,
    discount_amount:
      typeof raw.discount_amount === 'number' ? raw.discount_amount : 0,
    discount_toman:
      typeof raw.discount_toman === 'number' ? raw.discount_toman : 0,
    total: raw.total,
    total_toman: raw.total_toman,
    promo_code: typeof raw.promo_code === 'string' ? raw.promo_code : null,
    promo_percent:
      typeof raw.promo_percent === 'number' ? raw.promo_percent : 0,
  }
}

function mapCartSelectedColor(
  raw: ProductColorOptionDto | null | undefined,
  product: Product
): ProductColorOption {
  if (raw && typeof raw.id === 'string' && raw.id.trim()) {
    const matched = product.colors.find(
      (c) => c.id.toLowerCase() === raw.id!.trim().toLowerCase()
    )
    if (matched) return matched
    if (typeof raw.hex === 'string' && raw.hex.trim()) {
      return {
        id: raw.id.trim(),
        name: raw.name?.trim() || raw.id.trim(),
        name_fa: raw.name_fa?.trim() || raw.name?.trim() || raw.id.trim(),
        hex: raw.hex.trim(),
        accentHex: raw.accentHex?.trim() || raw.hex.trim(),
      }
    }
  }
  return product.colors[0] || DEFAULT_ALUMINUM_FINISH
}

export function mapCartItemDtoToCartItem(dto: CartItemDto): CartItemType {
  const product = mapProductDtoToProduct(dto.product)
  const selectedColor = mapCartSelectedColor(dto.selected_color, product)
  const selectedEdition =
    dto.selected_edition ??
    (product.editions && product.editions.length > 0
      ? product.editions[0].id
      : undefined)

  return {
    id: String(dto.id),
    serverItemId: dto.id,
    product,
    quantity: dto.quantity,
    selectedColor,
    selectedEdition,
    unitPrice: dto.unit_price,
    unitPriceToman: dto.unit_price_toman,
    lineTotal: dto.line_total,
    lineTotalToman: dto.line_total_toman,
  }
}

export function mapCartSummaryDtoToServerCartSummary(
  dto: CartSummaryDto
): ServerCartSummary {
  return {
    items: dto.items.map(mapCartItemDtoToCartItem),
    itemCount: dto.item_count,
    subtotalUsd: dto.subtotal,
    subtotalToman: dto.subtotal_toman,
    discountUsd: dto.discount_amount,
    discountToman: dto.discount_toman,
    totalUsd: dto.total,
    totalToman: dto.total_toman,
    promoCode: dto.promo_code ?? null,
    promoPercent: dto.promo_percent,
  }
}

export function normalizeCanonicalEditionId(
  product: Pick<Product, 'editions'>,
  requestedEdition?: string | null
): string | undefined {
  const editions = product.editions || []
  const cleaned = requestedEdition?.trim() || ''
  if (editions.length === 0) {
    if (!cleaned || cleaned === 'default') return undefined
    return cleaned
  }
  if (!cleaned || cleaned === 'default') {
    return editions[0].id
  }
  return cleaned
}

export function resolveValidatedProductOptions(
  product: Product,
  requestedColor?: ProductColorOption,
  requestedEdition?: string
): {
  color: ProductColorOption
  colorPayload: Record<string, unknown> | null
  edition?: string
} {
  let resolvedColor: ProductColorOption
  let colorPayload: Record<string, unknown> | null = null

  if (product.colors.length > 0) {
    if (!requestedColor) {
      resolvedColor = product.colors[0]
    } else {
      const matched = product.colors.find(
        (c) => c.id.toLowerCase() === requestedColor.id.trim().toLowerCase()
      )
      if (!matched) {
        throw new Error('Selected finish is not available for this product')
      }
      resolvedColor = matched
    }
    colorPayload = {
      id: resolvedColor.id,
      name: resolvedColor.name,
      name_fa: resolvedColor.name_fa,
      hex: resolvedColor.hex,
      accentHex: resolvedColor.accentHex,
    }
  } else {
    if (
      requestedColor &&
      requestedColor.id &&
      requestedColor.id !== DEFAULT_ALUMINUM_FINISH.id
    ) {
      throw new Error('Selected finish is not available for this product')
    }
    resolvedColor = DEFAULT_ALUMINUM_FINISH
    colorPayload = null
  }

  const editions = product.editions || []
  const cleanedEdition = requestedEdition?.trim() || ''
  let resolvedEdition: string | undefined

  if (editions.length > 0) {
    if (!cleanedEdition || cleanedEdition === 'default') {
      resolvedEdition = editions[0].id
    } else {
      const matchedEd = editions.find((ed) => ed.id === cleanedEdition)
      if (!matchedEd) {
        throw new Error('Selected edition is not available for this product')
      }
      resolvedEdition = matchedEd.id
    }
  } else {
    if (cleanedEdition && cleanedEdition !== 'default') {
      throw new Error('Selected edition is not available for this product')
    }
    resolvedEdition = undefined
  }

  return {
    color: resolvedColor,
    colorPayload,
    edition: resolvedEdition,
  }
}

export function buildCartLineIdentityKey(
  product: Pick<Product, 'id' | 'colors' | 'editions'>,
  selectedColor?: Pick<ProductColorOption, 'id'> | null,
  selectedEdition?: string | null
): string {
  const colorId = (
    selectedColor?.id ||
    product.colors[0]?.id ||
    DEFAULT_ALUMINUM_FINISH.id
  )
    .trim()
    .toLowerCase()
  const editionId =
    normalizeCanonicalEditionId(product, selectedEdition) || 'none'
  return `${product.id}::${colorId}::${editionId}`
}

export function getCartItemUnitPrices(item: CartItemType): {
  unitUsd: number
  unitToman: number
} {
  if (
    typeof item.unitPrice === 'number' &&
    typeof item.unitPriceToman === 'number'
  ) {
    return {
      unitUsd: item.unitPrice,
      unitToman: item.unitPriceToman,
    }
  }
  const ed = item.product.editions?.find((e) => e.id === item.selectedEdition)
  return {
    unitUsd: Number((item.product.price + (ed?.priceDelta || 0)).toFixed(2)),
    unitToman: item.product.price_toman + (ed?.priceDeltaToman || 0),
  }
}

export function getCartItemLineTotals(item: CartItemType): {
  lineUsd: number
  lineToman: number
} {
  if (
    typeof item.lineTotal === 'number' &&
    typeof item.lineTotalToman === 'number'
  ) {
    return {
      lineUsd: item.lineTotal,
      lineToman: item.lineTotalToman,
    }
  }
  const { unitUsd, unitToman } = getCartItemUnitPrices(item)
  return {
    lineUsd: Number((unitUsd * item.quantity).toFixed(2)),
    lineToman: unitToman * item.quantity,
  }
}

export async function fetchServerCart(
  promoCode?: string | null,
  options?: ApiRequestOptions
): Promise<ServerCartSummary> {
  const raw = await aruApi.cart.get(promoCode, options)
  return mapCartSummaryDtoToServerCartSummary(assertCartSummaryDto(raw))
}

export async function addServerCartItem(
  payload: {
    product_id: number
    quantity: number
    selected_color?: Record<string, unknown> | null
    selected_edition?: string | null
  },
  options?: ApiRequestOptions
): Promise<ServerCartSummary> {
  const raw = await aruApi.cart.addItem(payload, options)
  return mapCartSummaryDtoToServerCartSummary(assertCartSummaryDto(raw))
}

export async function updateServerCartItemQuantity(
  serverItemId: number,
  quantity: number,
  options?: ApiRequestOptions
): Promise<ServerCartSummary> {
  const raw = await aruApi.cart.updateItem(serverItemId, quantity, options)
  return mapCartSummaryDtoToServerCartSummary(assertCartSummaryDto(raw))
}

export async function removeServerCartItem(
  serverItemId: number,
  options?: ApiRequestOptions
): Promise<ServerCartSummary> {
  const raw = await aruApi.cart.removeItem(serverItemId, options)
  return mapCartSummaryDtoToServerCartSummary(assertCartSummaryDto(raw))
}

export async function clearServerCart(
  options?: ApiRequestOptions
): Promise<void> {
  await aruApi.cart.clear(options)
}

export async function applyServerCartPromo(
  code: string,
  options?: ApiRequestOptions
): Promise<ServerCartSummary> {
  const raw = await aruApi.cart.applyPromo(code, options)
  return mapCartSummaryDtoToServerCartSummary(assertCartSummaryDto(raw))
}

export async function fetchServerWishlist(
  options?: ApiRequestOptions
): Promise<Product[]> {
  const raw = await aruApi.wishlist.list(options)
  if (!Array.isArray(raw)) {
    throw new ApiError('Invalid wishlist payload from server', 502)
  }
  return raw.map((entry) => mapProductDtoToProduct(assertProductDto(entry)))
}

export async function addServerWishlistItem(
  productId: number,
  options?: ApiRequestOptions
): Promise<void> {
  await aruApi.wishlist.add(productId, options)
}

export async function removeServerWishlistItem(
  productId: number,
  options?: ApiRequestOptions
): Promise<void> {
  await aruApi.wishlist.remove(productId, options)
}
