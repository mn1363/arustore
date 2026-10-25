'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  AlertCircle,
  Check,
  Heart,
  Minus,
  PackageX,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import ProductGallery from '@/components/product/ProductGallery'
import ProductSpecs from '@/components/product/ProductSpecs'
import RelatedProducts from '@/components/product/RelatedProducts'
import { Product } from '@/types'
import { ApiError } from '@/lib/api/client'
import {
  fetchCatalogProductByIdentifier,
  fetchProductReviews,
} from '@/lib/api/catalog'
import {
  getProductPrimaryFinish,
  isProductAvailable,
} from '@/lib/data/catalog'
import { useStore } from '@/lib/store/useStore'
import { getDict } from '@/lib/data/i18n'
import {
  formatNumber,
  formatPrice,
  getProductDescription,
  getProductTitle,
} from '@/lib/utils'

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>()
  const rawSlug = params?.slug ? decodeURIComponent(String(params.slug)) : ''

  const locale = useStore((s) => s.locale)
  const addToCart = useStore((s) => s.addToCart)
  const wishlistIds = useStore((s) => s.wishlistIds)
  const toggleWishlist = useStore((s) => s.toggleWishlist)
  const upsertCatalogProducts = useStore((s) => s.upsertCatalogProducts)
  const dict = getDict(locale)

  const [product, setProduct] = useState<Product | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'not_found' | 'error'>(
    'loading'
  )
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reloadTick, setReloadTick] = useState(0)

  const [colorIdx, setColorIdx] = useState(0)
  const [editionId, setEditionId] = useState('default')
  const [quantity, setQuantity] = useState(1)

  const reload = useCallback(() => {
    setReloadTick((v) => v + 1)
  }, [])

  useEffect(() => {
    if (!rawSlug) {
      setProduct(null)
      setStatus('not_found')
      return
    }

    const controller = new AbortController()
    setStatus('loading')
    setErrorMessage(null)

    fetchCatalogProductByIdentifier(rawSlug, { signal: controller.signal })
      .then((loaded) => {
        if (controller.signal.aborted) return
        setProduct(loaded)
        setColorIdx(0)
        setEditionId(loaded.editions?.[0]?.id || 'default')
        setQuantity(1)
        upsertCatalogProducts([loaded])
        setStatus('ready')

        fetchProductReviews(loaded.id, { signal: controller.signal })
          .then((reviews) => {
            if (controller.signal.aborted || !reviews.length) return
            setProduct((prev) =>
              prev && prev.id === loaded.id ? { ...prev, reviews } : prev
            )
          })
          .catch(() => {
            // Optional review enrichment failure must not block product detail view.
          })
      })
      .catch((err: unknown) => {
        if (
          controller.signal.aborted ||
          (err &&
            typeof err === 'object' &&
            'name' in err &&
            (err as { name?: unknown }).name === 'AbortError')
        ) {
          return
        }
        setProduct(null)
        if (err instanceof ApiError && err.status === 404) {
          setStatus('not_found')
          return
        }
        setErrorMessage(
          err instanceof Error ? err.message : 'Unable to load product details'
        )
        setStatus('error')
      })

    return () => {
      controller.abort()
    }
  }, [rawSlug, reloadTick, upsertCatalogProducts])

  if (status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        <div className="h-4 w-56 rounded bg-white/10 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 h-[380px] sm:h-[470px] rounded-3xl hero-sanctuary-stage animate-pulse" />
          <div className="lg:col-span-5 rounded-3xl glass-panel p-6 sm:p-8 space-y-6 animate-pulse">
            <div className="h-8 w-3/4 rounded bg-white/10" />
            <div className="h-7 w-1/3 rounded bg-white/10" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-white/5" />
              <div className="h-3 w-5/6 rounded bg-white/5" />
            </div>
            <div className="h-12 w-full rounded-xl bg-white/10" />
          </div>
        </div>
      </div>
    )
  }

  if (status === 'not_found') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <Breadcrumb
          items={[
            {
              label: locale === 'fa' ? 'محصولات' : 'Products',
              href: '/products',
            },
            {
              label: locale === 'fa' ? 'یافت نشد' : 'Not Found',
            },
          ]}
        />
        <div className="rounded-3xl surface-level-1 p-12 sm:p-16 text-center space-y-5 max-w-2xl mx-auto">
          <PackageX className="w-11 h-11 text-[#dfc08e] mx-auto" />
          <h1 className="text-xl sm:text-2xl font-bold text-[#f4f4f6]">
            {locale === 'fa'
              ? 'محصول مورد نظر یافت نشد یا در دسترس نیست'
              : 'Product Not Found or Unavailable'}
          </h1>
          <p className="text-xs sm:text-sm text-[#979fb2] leading-relaxed">
            {locale === 'fa'
              ? 'نشانی واردشده معتبر نیست یا این اثر از ویترین آرو استور خارج شده است.'
              : 'The requested item does not exist or is no longer available in the catalog.'}
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex px-6 py-3 rounded-xl champagne-btn font-bold text-sm"
            >
              {locale === 'fa' ? 'بازگشت به فهرست محصولات' : 'Back to Products'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error' || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <Breadcrumb
          items={[
            {
              label: locale === 'fa' ? 'محصولات' : 'Products',
              href: '/products',
            },
          ]}
        />
        <div className="rounded-3xl surface-level-1 p-12 sm:p-16 text-center space-y-5 max-w-2xl mx-auto">
          <AlertCircle className="w-10 h-10 text-[#dfc08e] mx-auto" />
          <h1 className="text-xl sm:text-2xl font-bold text-[#f4f4f6]">
            {locale === 'fa'
              ? 'خطا در بارگذاری اطلاعات محصول'
              : 'Unable to Load Product'}
          </h1>
          {errorMessage && (
            <p className="text-xs text-[#979fb2]">{errorMessage}</p>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={reload}
              className="px-6 py-3 rounded-xl champagne-btn font-bold text-sm"
            >
              {locale === 'fa' ? 'تلاش مجدد' : 'Retry'}
            </button>
            <Link
              href="/products"
              className="px-5 py-3 rounded-xl secondary-3d-btn text-sm font-medium"
            >
              {locale === 'fa' ? 'مشاهده همه محصولات' : 'All Products'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const selectedColor = getProductPrimaryFinish(product, colorIdx)
  const selectedEdition = product.editions?.find((e) => e.id === editionId)
  const finalUsd = product.price + (selectedEdition?.priceDelta || 0)
  const finalToman =
    product.price_toman + (selectedEdition?.priceDeltaToman || 0)
  const compareUsd = product.compare_price
    ? product.compare_price + (selectedEdition?.priceDelta || 0)
    : undefined
  const compareToman = product.compare_price_toman
    ? product.compare_price_toman + (selectedEdition?.priceDeltaToman || 0)
    : undefined
  const available = isProductAvailable(product)
  const maxSelectableQty = Math.max(1, product.stock_quantity)
  const isWishlisted = wishlistIds.includes(product.id)

  const breadcrumbItems = [
    {
      label: locale === 'fa' ? 'محصولات' : 'Products',
      href: '/products',
    },
    ...(product.category
      ? [
          {
            label:
              locale === 'fa'
                ? product.category.name_fa
                : product.category.name,
            href: `/products?category=${product.category.slug}`,
          },
        ]
      : []),
    { label: getProductTitle(product, locale) },
  ]

  const activeHighlights =
    locale === 'fa' ? product.highlights_fa : product.highlights

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-20">
      <div>
        <Breadcrumb items={breadcrumbItems} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-6">
          <div className="lg:col-span-7">
            <ProductGallery product={product} selectedColor={selectedColor} />
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl glass-panel p-6 sm:p-8 space-y-6">
              <div>
                {product.brand && (
                  <div className="text-xs font-medium text-[#979fb2] mb-1.5">
                    {locale === 'fa'
                      ? product.brand.name_fa
                      : product.brand.name}
                  </div>
                )}

                <h1 className="text-2xl sm:text-3xl font-bold text-[#f4f4f6]">
                  {getProductTitle(product, locale)}
                </h1>

                <div className="flex flex-wrap items-baseline gap-3 mt-3">
                  <div className="text-xl sm:text-2xl font-bold text-[#dfc08e]">
                    {formatPrice(finalUsd, locale, finalToman)}
                  </div>
                  {compareUsd && compareUsd > finalUsd && (
                    <div className="text-sm text-[#6e768a] line-through">
                      {formatPrice(compareUsd, locale, compareToman)}
                    </div>
                  )}
                </div>

                <div className="mt-2.5 flex items-center gap-2 text-xs">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      available ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                  <span
                    className={
                      available ? 'text-[#b4bccf]' : 'text-rose-300 font-semibold'
                    }
                  >
                    {available
                      ? locale === 'fa'
                        ? `موجود در انبار (${formatNumber(product.stock_quantity, locale)} عدد)`
                        : `In stock (${formatNumber(product.stock_quantity, locale)} available)`
                      : locale === 'fa'
                      ? 'ناموجود در انبار'
                      : 'Out of stock'}
                  </span>
                </div>
              </div>

              <p className="text-sm text-[#979fb2] leading-relaxed">
                {getProductDescription(product, locale)}
              </p>

              {/* Color Swatches */}
              {product.colors.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-xs text-[#979fb2]">
                    {dict.common.color}:{' '}
                    <span className="font-bold text-[#f4f4f6]">
                      {locale === 'fa'
                        ? selectedColor.name_fa
                        : selectedColor.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((c, idx) => (
                      <button
                        key={c.id}
                        onClick={() => setColorIdx(idx)}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
                          colorIdx === idx
                            ? 'bg-[#1b2030] border-[#dfc08e]/65 text-[#f4f4f6] shadow-[0_6px_16px_-6px_rgba(223,192,142,0.28)]'
                            : 'bg-[#0b0e17]/80 border-white/[0.08] text-[#979fb2] hover:text-white hover:border-white/20'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/25"
                          style={{
                            background: `linear-gradient(135deg, ${c.hex} 40%, ${c.accentHex} 100%)`,
                          }}
                        />
                        <span>{locale === 'fa' ? c.name_fa : c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Edition Selector */}
              {product.editions && product.editions.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2">
                    {product.editions.map((ed) => {
                      const active = ed.id === editionId
                      return (
                        <button
                          key={ed.id}
                          onClick={() => setEditionId(ed.id)}
                          className={`px-4 py-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                            active
                              ? 'bg-[#1b2030] border-[#dfc08e]/65 text-[#f4f4f6]'
                              : 'bg-[#0b0e17]/80 border-white/[0.08] text-[#979fb2] hover:border-white/20'
                          }`}
                        >
                          <span>{locale === 'fa' ? ed.label_fa : ed.label}</span>
                          {ed.priceDelta > 0 && (
                            <span className="text-[#dfc08e]">
                              +{' '}
                              {formatPrice(
                                ed.priceDelta,
                                locale,
                                ed.priceDeltaToman
                              )}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Highlights */}
              {activeHighlights.length > 0 && (
                <div className="space-y-2 pt-1">
                  {activeHighlights.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-[#b4bccf]"
                    >
                      <Check className="w-3.5 h-3.5 text-[#dfc08e] flex-shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2.5 pt-2">
                <div className="flex items-center gap-2 px-3 py-3 rounded-xl border border-white/[0.1] bg-[#0a0c14] shadow-[inset_0_2px_4px_rgba(0,0,0,0.45)]">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={!available}
                    aria-label="Decrease quantity"
                    className="p-0.5 text-[#979fb2] hover:text-white disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center font-bold text-sm text-[#f4f4f6]">
                    {formatNumber(quantity, locale)}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity((q) => Math.min(maxSelectableQty, q + 1))
                    }
                    disabled={!available || quantity >= maxSelectableQty}
                    aria-label="Increase quantity"
                    className="p-0.5 text-[#979fb2] hover:text-white disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (!available) return
                    addToCart(product, quantity, selectedColor, editionId)
                  }}
                  disabled={!available}
                  className="flex-1 py-3.5 px-5 rounded-xl champagne-btn font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    {available
                      ? dict.common.addToCart
                      : locale === 'fa'
                      ? 'ناموجود در انبار'
                      : 'Out of Stock'}
                  </span>
                </button>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Wishlist"
                  className={`p-3.5 rounded-xl secondary-3d-btn ${
                    isWishlisted ? 'text-[#dfc08e] border-[#dfc08e]/50' : ''
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`}
                  />
                </button>
              </div>

              <div className="pt-4 border-t border-white/[0.07] grid grid-cols-2 gap-3 text-xs text-[#979fb2]">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#dfc08e] flex-shrink-0" />
                  <span>{dict.common.freeShipping}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#dfc08e] flex-shrink-0" />
                  <span>
                    {locale === 'fa'
                      ? 'ضمانت ۵ ساله ثبات رنگ'
                      : '5-Year Warranty'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {product.specs.length > 0 && <ProductSpecs specs={product.specs} />}
      <RelatedProducts currentProduct={product} />
    </div>
  )
}
