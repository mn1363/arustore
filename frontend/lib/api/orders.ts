import {
  CartItemType,
  CreateOrderPayload,
  ServerOrder,
  ServerOrderItem,
  ServerOrderStatusHistoryEntry,
} from '@/types'
import { aruApi } from '@/lib/api/client'
import { buildCartLineIdentityKey } from '@/lib/api/cart'

export interface BackendOrderItemDto {
  id: number
  product_id?: number | null
  product_name: string
  product_name_fa: string
  product_image?: string | null
  color_name?: string | null
  color_name_fa?: string | null
  edition?: string | null
  quantity: number
  unit_price: number
  unit_price_toman: number
}

export interface BackendOrderStatusHistoryDto {
  id: number
  status: string
  note?: string | null
  created_at?: string | null
}

export interface BackendOrderDto {
  id: number
  order_number: string
  user_id?: number | null
  status: string
  payment_status: string
  payment_reference?: string | null
  stock_reserved?: boolean
  subtotal: number
  discount_amount: number
  shipping_cost: number
  total: number
  total_toman: number
  promo_code?: string | null
  customer_name: string
  customer_phone?: string | null
  shipping_address: string
  postal_code?: string | null
  notes?: string | null
  created_at?: string | null
  items?: BackendOrderItemDto[]
  status_history?: BackendOrderStatusHistoryDto[]
}

export function mapOrderItemDto(dto: BackendOrderItemDto): ServerOrderItem {
  return {
    id: dto.id,
    productId: dto.product_id ?? null,
    productName: dto.product_name,
    productNameFa: dto.product_name_fa,
    productImage: dto.product_image ?? null,
    colorName: dto.color_name ?? null,
    colorNameFa: dto.color_name_fa ?? null,
    edition: dto.edition ?? null,
    quantity: dto.quantity,
    unitPriceUsd: dto.unit_price,
    unitPriceToman: dto.unit_price_toman,
  }
}

export function mapOrderStatusHistoryDto(
  dto: BackendOrderStatusHistoryDto
): ServerOrderStatusHistoryEntry {
  return {
    id: dto.id,
    status: dto.status,
    note: dto.note ?? null,
    createdAt: dto.created_at ?? null,
  }
}

export function mapOrderDtoToServerOrder(dto: BackendOrderDto): ServerOrder {
  const stockReserved =
    typeof dto.stock_reserved === 'boolean'
      ? dto.stock_reserved
      : dto.payment_status === 'paid' && dto.status !== 'cancelled'

  return {
    id: dto.id,
    orderNumber: dto.order_number,
    userId: dto.user_id ?? null,
    status: dto.status,
    paymentStatus: dto.payment_status,
    paymentReference: dto.payment_reference ?? null,
    stockReserved,
    subtotalUsd: dto.subtotal,
    discountUsd: dto.discount_amount,
    shippingCostUsd: dto.shipping_cost,
    totalUsd: dto.total,
    totalToman: dto.total_toman,
    promoCode: dto.promo_code ?? null,
    customerName: dto.customer_name,
    customerPhone: dto.customer_phone ?? null,
    shippingAddress: dto.shipping_address,
    postalCode: dto.postal_code ?? null,
    notes: dto.notes ?? null,
    createdAt: dto.created_at ?? null,
    items: Array.isArray(dto.items) ? dto.items.map(mapOrderItemDto) : [],
    statusHistory: Array.isArray(dto.status_history)
      ? dto.status_history.map(mapOrderStatusHistoryDto)
      : [],
  }
}

export function normalizeDigitsToAscii(raw: string): string {
  return raw
    .replace(/[۰-۹]/g, (ch) => String(ch.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (ch) => String(ch.charCodeAt(0) - 0x0660))
}

function hashStringFNV64(input: string): string {
  // Deterministic dual-seed 32-bit FNV-1a fingerprint (64-bit hex, zero PII retained)
  let h1 = 0x811c9dc5
  let h2 = 0x9e3779b9
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i)
    h1 ^= code
    h1 = Math.imul(h1, 0x01000193)
    h2 ^= code ^ ((i & 0xff) << 1)
    h2 = Math.imul(h2, 0x85ebca6b)
  }
  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0')
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0')
  return `${hex1}${hex2}`
}

export function computeCheckoutPayloadFingerprint(
  payload: CreateOrderPayload
): string {
  const canonical = JSON.stringify({
    customer_name: (payload.customer_name || '').trim(),
    customer_phone: normalizeDigitsToAscii(payload.customer_phone || '').trim(),
    shipping_address: (payload.shipping_address || '').trim(),
    postal_code: normalizeDigitsToAscii(payload.postal_code || '').trim(),
    notes: (payload.notes || '').trim(),
    promo_code: (payload.promo_code || '').trim().toUpperCase(),
  })
  return hashStringFNV64(canonical)
}

export function computeCheckoutCartFingerprint(items: CartItemType[]): string {
  const lines = items
    .map(
      (item) =>
        `${buildCartLineIdentityKey(
          item.product,
          item.selectedColor,
          item.selectedEdition
        )}#${item.quantity}`
    )
    .sort()
  return hashStringFNV64(JSON.stringify(lines))
}

export function generateCheckoutIdempotencyKey(): string {
  const gCrypto =
    typeof globalThis !== 'undefined'
      ? (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
      : undefined
  if (gCrypto && typeof gCrypto.randomUUID === 'function') {
    return `aru-chk-${gCrypto.randomUUID()}`
  }
  const randA = Math.random().toString(36).slice(2, 12)
  const randB = Math.random().toString(36).slice(2, 12)
  return `aru-chk-${Date.now().toString(36)}-${randA}${randB}`
}

export async function createServerOrder(
  payload: CreateOrderPayload,
  idempotencyKey: string
): Promise<ServerOrder> {
  // Strip any accidental extra properties so only authoritative checkout metadata + promo_code are sent
  const cleanBody: CreateOrderPayload = {
    customer_name: payload.customer_name.trim(),
    customer_phone: payload.customer_phone?.trim() || null,
    shipping_address: payload.shipping_address.trim(),
    postal_code: payload.postal_code?.trim() || null,
    notes: payload.notes?.trim() || null,
    promo_code: payload.promo_code?.trim() || null,
  }

  const dto = await aruApi.orders.create<BackendOrderDto>(
    cleanBody,
    idempotencyKey.trim()
  )
  return mapOrderDtoToServerOrder(dto)
}

export async function fetchServerOrders(): Promise<ServerOrder[]> {
  const rows = await aruApi.orders.listMine<BackendOrderDto[]>()
  return Array.isArray(rows) ? rows.map(mapOrderDtoToServerOrder) : []
}

export async function fetchServerOrderDetail(
  orderId: number
): Promise<ServerOrder> {
  const dto = await aruApi.orders.detail<BackendOrderDto>(orderId)
  return mapOrderDtoToServerOrder(dto)
}

export async function fetchAdminOrders(): Promise<ServerOrder[]> {
  const rows = await aruApi.admin.listOrders<BackendOrderDto[]>()
  return Array.isArray(rows) ? rows.map(mapOrderDtoToServerOrder) : []
}

export async function updateAdminOrderStatus(
  orderId: number,
  status: string,
  note?: string
): Promise<ServerOrder> {
  const dto = await aruApi.admin.updateOrderStatus<BackendOrderDto>(orderId, {
    status,
    note: note?.trim() || null,
  })
  return mapOrderDtoToServerOrder(dto)
}
