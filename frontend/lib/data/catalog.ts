import { Model3DArchetype, Product, ProductColorOption } from '@/types'

/**
 * Purely visual 3D/archetype presentation metadata and non-destructive URL
 * compatibility aliases. Commercial product, category, brand, price, and stock
 * data are fetched exclusively from the FastAPI `/api/v1` backend.
 */

export const VALID_MODEL_ARCHETYPES: readonly Model3DArchetype[] = [
  'tiered-stand',
  'fruit-bowl',
  'serving-tray',
  'nut-dish',
  'ordu-platter',
  'tea-set',
  'candelabra',
  'kashkool-vessel',
] as const

export function normalizeModelArchetype(raw?: string | null): Model3DArchetype {
  if (
    raw &&
    (VALID_MODEL_ARCHETYPES as readonly string[]).includes(raw)
  ) {
    return raw as Model3DArchetype
  }
  return 'fruit-bowl'
}

export const DEFAULT_ALUMINUM_FINISH: ProductColorOption = {
  id: 'default-silver-champagne',
  name: 'Satin Silver & Champagne Gold',
  name_fa: 'سیلور ساتن و طلایی شامپاینی',
  hex: '#d8dee9',
  accentHex: '#d6b88a',
}

export function getProductPrimaryFinish(
  product: Pick<Product, 'colors'>,
  index = 0
): ProductColorOption {
  return product.colors[index] || product.colors[0] || DEFAULT_ALUMINUM_FINISH
}

export function isProductAvailable(
  product: Pick<Product, 'in_stock' | 'stock_quantity'>
): boolean {
  if (product.in_stock === false) return false
  return product.stock_quantity > 0
}

export const ACCENT_TOKEN_TO_HEX: Record<string, string> = {
  gold: '#fbbf24',
  silver: '#e2e8f0',
  amber: '#f59e0b',
  bronze: '#d97706',
  champagne: '#dfc08e',
}

export function resolveAccentHex(raw?: string | null, fallback = '#dfc08e'): string {
  if (!raw || !raw.trim()) return fallback
  const trimmed = raw.trim()
  if (trimmed.startsWith('#')) return trimmed
  return ACCENT_TOKEN_TO_HEX[trimmed.toLowerCase()] || fallback
}

export const ARCHETYPE_ACCENT_HEX: Record<Model3DArchetype, string> = {
  'tiered-stand': '#fbbf24',
  'fruit-bowl': '#e2e8f0',
  'serving-tray': '#f59e0b',
  'nut-dish': '#eab308',
  'ordu-platter': '#d97706',
  'tea-set': '#cbd5e1',
  candelabra: '#fbbf24',
  'kashkool-vessel': '#f59e0b',
}

export interface CategoryVisualPresentation {
  archetype: Model3DArchetype
  icon: string
  gradient: string
  defaultAccent: string
  defaultImage: string
}

export const CATEGORY_PRESENTATION_BY_SLUG: Record<
  string,
  CategoryVisualPresentation
> = {
  'pastry-stands': {
    archetype: 'tiered-stand',
    icon: 'Crown',
    gradient: 'from-amber-400/20 via-slate-300/10 to-transparent',
    defaultAccent: '#fbbf24',
    defaultImage: '/images/categories/pastry-stands.png',
  },
  'fruit-vessels': {
    archetype: 'fruit-bowl',
    icon: 'Sparkles',
    gradient: 'from-slate-200/20 via-amber-300/10 to-transparent',
    defaultAccent: '#e2e8f0',
    defaultImage: '/images/categories/fruit-vessels.png',
  },
  'serving-trays': {
    archetype: 'serving-tray',
    icon: 'Layers',
    gradient: 'from-amber-500/20 via-zinc-300/10 to-transparent',
    defaultAccent: '#f59e0b',
    defaultImage: '/images/categories/serving-trays.png',
  },
  'nut-ordur': {
    archetype: 'ordu-platter',
    icon: 'Gem',
    gradient: 'from-yellow-500/20 via-stone-300/10 to-transparent',
    defaultAccent: '#d97706',
    defaultImage: '/images/categories/nut-ordur.png',
  },
}

export const DEFAULT_CATEGORY_PRESENTATION: CategoryVisualPresentation = {
  archetype: 'fruit-bowl',
  icon: 'Layers',
  gradient: 'from-amber-400/20 via-slate-300/10 to-transparent',
  defaultAccent: '#dfc08e',
  defaultImage: '/images/categories/fruit-vessels.png',
}

/**
 * Verified canonical backend SKUs & slugs for the 4 HeroStage3D showcase pieces.
 * Matched explicitly by SKU or canonical slug — never by array index.
 */
export const HERO_SHOWCASE_ITEMS: readonly {
  sku: string
  slug: string
}[] = [
  { sku: 'ARU-101', slug: 'shahnameh-3tier-aluminum-pastry-stand' },
  { sku: 'ARU-102', slug: 'lotus-fluted-aluminum-fruit-bowl' },
  { sku: 'ARU-104', slug: 'domed-hammered-aluminum-nut-chalice' },
  { sku: 'ARU-108', slug: 'kashkool-sculptural-aluminum-centerpiece' },
] as const

export const LEGACY_PRODUCT_SLUG_ALIASES: Readonly<Record<string, string>> = {
  'royal-3tier-aluminum-stand': 'shahnameh-3tier-aluminum-pastry-stand',
  'imperial-engraved-aluminum-tray': 'persepolis-engraved-aluminum-serving-tray',
  'zarrin-hammered-aluminum-nut-dish': 'domed-hammered-aluminum-nut-chalice',
  'negin-4bowl-aluminum-ordu-platter': 'chaharbagh-4bowl-aluminum-ordur-platter',
  'isfahan-aluminum-tea-sugar-service': 'isfahan-anodized-aluminum-tea-hospitality-set',
  'arulux-3arm-aluminum-candelabra': 'aria-3arm-cast-aluminum-candelabra',
  'mowj-sculptural-aluminum-kashkool': 'kashkool-sculptural-aluminum-centerpiece',
}

export const LEGACY_CATEGORY_SLUG_ALIASES: Readonly<Record<string, string>> = {
  'stands-fruit-bowls': 'pastry-stands',
  'trays-tea-sets': 'serving-trays',
  'nut-ordu-dishes': 'nut-ordur',
  'candelabra-centerpieces': 'fruit-vessels',
}

export const LEGACY_BRAND_SLUG_ALIASES: Readonly<Record<string, string>> = {
  'arumetal-atelier': 'aru-atelier',
  'aruanodize-royal': 'zarrin-anodize',
  'aruform-cnc': 'parsia-form',
  'arubridal-heritage': 'simin-craft',
}

export function resolveCanonicalProductIdentifier(raw: string): string {
  const trimmed = raw.trim()
  return LEGACY_PRODUCT_SLUG_ALIASES[trimmed] || trimmed
}

export function resolveCategorySlugAlias(raw: string): string {
  const trimmed = raw.trim()
  return LEGACY_CATEGORY_SLUG_ALIASES[trimmed] || trimmed
}

export function resolveBrandSlugAlias(raw: string): string {
  const trimmed = raw.trim()
  return LEGACY_BRAND_SLUG_ALIASES[trimmed] || trimmed
}

/**
 * Real anodized finishes backed by backend `Product.colors` JSON entries.
 * Additional finishes returned by backend products are merged dynamically.
 */
export interface FinishFilterOption {
  id: string
  label: string
  label_fa: string
  hex: string
}

export const CANONICAL_FINISH_OPTIONS: readonly FinishFilterOption[] = [
  {
    id: 'champagne',
    label: 'Satin Silver & Champagne Gold',
    label_fa: 'سیلور ساتن و طلایی شامپاینی',
    hex: '#d6b88a',
  },
  {
    id: 'silver',
    label: 'Mirror Silver Anodized',
    label_fa: 'آلومینیوم نقره‌ای آینه‌ای',
    hex: '#e2e8f0',
  },
] as const
