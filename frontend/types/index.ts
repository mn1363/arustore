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

export interface Brand {
  id: number
  name: string
  name_fa: string
  slug: string
  tagline: string
  tagline_fa: string
  product_count: number
}

export interface Category {
  id: number
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
  rating_avg: number
  rating_count: number
  is_featured?: boolean
  is_new?: boolean
  badge?: string
  badge_fa?: string
  archetype: Model3DArchetype
  accent_color: string
  colors: ProductColorOption[]
  editions?: { id: string; label: string; label_fa: string; priceDelta: number; priceDeltaToman: number }[]
  brand: Brand
  category: Category
  images: ProductImage[]
  specs: ProductSpec[]
  highlights: string[]
  highlights_fa: string[]
  reviews: ProductReview[]
}

export interface CartItemType {
  id: string
  product: Product
  quantity: number
  selectedColor: ProductColorOption
  selectedEdition?: string
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

export interface Order {
  id: string
  orderNumber: string
  createdAt: string
  status: 'processing' | 'shipped' | 'delivered'
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
