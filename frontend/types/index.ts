export type Locale = 'fa' | 'en'

export type Model3DArchetype =
  | 'tiered-stand'
  | 'fruit-bowl'
  | 'serving-tray'
  | 'nut-dish'
  | 'ordu-platter'
  | 'tea-set'
  | 'candelabra'
  | 'kashkool-vessel'

export interface ProductImage {
  id: number
  url: string
  alt: string
  is_primary?: boolean
}

export interface ProductColorOption {
  id: string
  name: string
  name_fa: string
  hex: string
  accentHex: string
}

export interface ProductEditionOption {
  id: string
  label: string
  label_fa: string
  priceDelta: number
  priceDeltaToman: number
}

export interface Brand {
  id: number
  name: string
  name_fa: string
  slug: string
  description?: string | null
  description_fa?: string | null
  logo?: string | null
  country?: string
  tagline: string
  tagline_fa: string
  product_count: number
}

export interface Category {
  id: number
  parent_id?: number | null
  name: string
  name_fa: string
  slug: string
  description: string
  description_fa: string
  icon: string
  gradient: string
  accent: string
  image: string
  archetype: Model3DArchetype
  product_count: number
}

export interface ProductSpec {
  label: string
  label_fa: string
  value: string
  value_fa: string
}

export interface ProductReview {
  id: number
  user_name: string
  user_avatar?: string
  rating: number
  title: string
  title_fa: string
  comment: string
  comment_fa: string
  created_at: string
  verified: boolean
}

export interface Product {
  id: number
  sku?: string
  name: string
  name_fa: string
  slug: string
  subtitle: string
  subtitle_fa: string
  description: string
  description_fa: string
  price: number
  compare_price?: number
  price_toman: number
  compare_price_toman?: number
  stock_quantity: number
  in_stock?: boolean
  is_on_sale?: boolean
  rating_avg: number
  rating_count: number
  is_featured?: boolean
  is_new?: boolean
  badge?: string
  badge_fa?: string
  archetype: Model3DArchetype
  accent_color: string
  colors: ProductColorOption[]
  editions?: ProductEditionOption[]
  brand?: Brand | null
  category?: Category | null
  images: ProductImage[]
  specs: ProductSpec[]
  highlights: string[]
  highlights_fa: string[]
  reviews: ProductReview[]
}

export interface CartItemType {
  id: string
  serverItemId?: number
  product: Product
  quantity: number
  selectedColor: ProductColorOption
  selectedEdition?: string
  unitPrice?: number
  unitPriceToman?: number
  lineTotal?: number
  lineTotalToman?: number
}

export interface ServerCartSummary {
  items: CartItemType[]
  itemCount: number
  subtotalUsd: number
  subtotalToman: number
  discountUsd: number
  discountToman: number
  totalUsd: number
  totalToman: number
  promoCode: string | null
  promoPercent: number
}

export interface OrderItemSummary {
  productId: number
  name: string
  name_fa: string
  image: string
  quantity: number
  price: number
  price_toman: number
  colorName: string
  colorName_fa: string
}

export type OrderLifecycleStatus =
  | 'pending_payment'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type OrderPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface ServerOrderItem {
  id: number
  productId: number | null
  productName: string
  productNameFa: string
  productImage: string | null
  colorName: string | null
  colorNameFa: string | null
  edition: string | null
  quantity: number
  unitPriceUsd: number
  unitPriceToman: number
}

export interface ServerOrderStatusHistoryEntry {
  id: number
  status: string
  note: string | null
  createdAt: string | null
}

export interface ServerOrder {
  id: number
  orderNumber: string
  userId: number | null
  status: OrderLifecycleStatus | string
  paymentStatus: OrderPaymentStatus | string
  paymentReference: string | null
  stockReserved: boolean
  subtotalUsd: number
  discountUsd: number
  shippingCostUsd: number
  totalUsd: number
  totalToman: number
  promoCode: string | null
  customerName: string
  customerPhone: string | null
  shippingAddress: string
  postalCode: string | null
  notes: string | null
  createdAt: string | null
  items: ServerOrderItem[]
  statusHistory: ServerOrderStatusHistoryEntry[]
}

export interface CreateOrderPayload {
  customer_name: string
  customer_phone?: string | null
  shipping_address: string
  postal_code?: string | null
  notes?: string | null
  promo_code?: string | null
}

export interface Order {
  id: string
  orderNumber: string
  createdAt: string
  status: 'pending_payment' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  total_toman: number
  shippingAddress: string
  customerName: string
  items: OrderItemSummary[]
}

export interface UserProfile {
  id: number
  username?: string
  full_name: string
  email: string
  phone?: string | null
  avatar?: string | null
  is_admin: boolean
  is_verified?: boolean
  member_since: string
  loyalty_tier: string
  loyalty_points: number
}
