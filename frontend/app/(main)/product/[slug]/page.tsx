'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  CheckCircle2,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import ProductGallery from '@/components/product/ProductGallery'
import ProductSpecs from '@/components/product/ProductSpecs'
import ProductReviews from '@/components/product/ProductReviews'
import RelatedProducts from '@/components/product/RelatedProducts'
import { useStore } from '@/lib/store/useStore'
import { getDict } from '@/lib/data/i18n'
import {
  calculateDiscount,
  formatNumber,
  formatPrice,
  getProductDescription,
  getProductSubtitle,
  getProductTitle,
} from '@/lib/utils'

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>()
  const locale = useStore((s) => s.locale)
  const products = useStore((s) => s.products)
  const addToCart = useStore((s) => s.addToCart)
  const wishlistIds = useStore((s) => s.wishlistIds)
  const toggleWishlist = useStore((s) => s.toggleWishlist)
  const dict = getDict(locale)

  const product = products.find((p) => p.slug === params?.slug) || products[0]
  const [colorIdx, setColorIdx] = useState(0)
  const [editionId, setEditionId] = useState(product.editions?.[0]?.id || 'default')
  const [quantity, setQuantity] = useState(1)

  const selectedColor = product.colors[colorIdx] || product.colors[0]
  const selectedEdition = product.editions?.find((e) => e.id === editionId)
  const finalUsd = product.price + (selectedEdition?.priceDelta || 0)
  const finalToman = product.price_toman + (selectedEdition?.priceDeltaToman || 0)
  const discount = calculateDiscount(product.price, product.compare_price)
  const isWishlisted = wishlistIds.includes(product.id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-20">
      <div>
        <Breadcrumb
          items={[
            {
              label: locale === 'fa' ? 'فروشگاه سه‌بعدی' : '3D Store',
              href: '/products',
            },
            {
              label:
                locale === 'fa' ? product.category.name_fa : product.category.name,
              href: `/products?category=${product.category.slug}`,
            },
            { label: getProductTitle(product, locale) },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Dual 3D WebGL + Studio Render Gallery */}
          <div className="lg:col-span-7">
            <ProductGallery product={product} selectedColor={selectedColor} />
          </div>

          {/* Configuration & Buy Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-[2rem] p-6 sm:p-8 border border-white/10 space-y-6">
              {/* Brand & Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                  {locale === 'fa' ? product.brand.name_fa : product.brand.name}
                </span>
                <div className="flex items-center gap-2">
                  {discount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                      {formatNumber(discount, locale)}٪ {dict.common.off}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {locale === 'fa' ? product.badge_fa || 'پرچمدار' : product.badge || 'Flagship'}
                  </span>
                </div>
              </div>

              {/* Title & Rating */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {getProductTitle(product, locale)}
                </h1>
                <p className="text-sm text-slate-400 mt-1.5">
                  {getProductSubtitle(product, locale)}
                </p>

                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-bold text-white">
                      {product.rating_avg.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    ({formatNumber(product.rating_count, locale)}{' '}
                    {locale === 'fa' ? 'رای خریداران' : 'verified ratings'})
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold ms-auto">
                    ● {dict.common.inStock}
                  </span>
                </div>
              </div>

              {/* Price Display */}
              <div className="p-4 rounded-2xl bg-obsidian-950/85 border border-white/[0.08] flex items-baseline justify-between gap-4">
                <div>
                  <div className="text-xs text-slate-400">{dict.common.price}</div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-0.5">
                    {formatPrice(finalUsd, locale, finalToman)}
                  </div>
                </div>
                {product.compare_price && (
                  <div className="text-sm text-slate-500 line-through">
                    {formatPrice(
                      product.compare_price,
                      locale,
                      product.compare_price_toman
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {getProductDescription(product, locale)}
              </p>

              {/* Color Finish Swatches (Updates 3D Mesh Live!) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">{dict.common.color}:</span>
                  <span className="font-bold text-white">
                    {locale === 'fa' ? selectedColor.name_fa : selectedColor.name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((c, idx) => (
                    <button
                      key={c.id}
                      onClick={() => setColorIdx(idx)}
                      className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                        colorIdx === idx
                          ? 'bg-white/15 border-amber-400 text-white shadow-neon-cyan'
                          : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-white/30"
                        style={{
                          background: `linear-gradient(135deg, ${c.hex} 40%, ${c.accentHex} 100%)`,
                        }}
                      />
                      <span>{locale === 'fa' ? c.name_fa : c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Edition Selector */}
              {product.editions && product.editions.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-xs text-slate-400">{dict.common.edition}:</div>
                  <div className="grid grid-cols-1 gap-2">
                    {product.editions.map((ed) => {
                      const active = ed.id === editionId
                      return (
                        <button
                          key={ed.id}
                          onClick={() => setEditionId(ed.id)}
                          className={`px-4 py-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                            active
                              ? 'bg-amber-500/15 border-amber-400 text-white'
                              : 'bg-white/[0.02] border-white/10 text-slate-300 hover:border-white/25'
                          }`}
                        >
                          <span>{locale === 'fa' ? ed.label_fa : ed.label}</span>
                          {ed.priceDelta > 0 && (
                            <span className="text-amber-300">
                              + {formatPrice(ed.priceDelta, locale, ed.priceDeltaToman)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Highlights */}
              <div className="space-y-2 pt-1">
                {(locale === 'fa' ? product.highlights_fa : product.highlights).map(
                  (h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span>{h}</span>
                    </div>
                  )
                )}
              </div>

              {/* Quantity + Add to Cart + Wishlist */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white/[0.05] border border-white/10">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-1 text-slate-300 hover:text-white"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-7 text-center font-bold text-sm">
                    {formatNumber(quantity, locale)}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-1 text-slate-300 hover:text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() =>
                    addToCart(product, quantity, selectedColor, editionId)
                  }
                  className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-neon-cyan hover:brightness-110 transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{dict.common.addToCart}</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isWishlisted
                      ? 'bg-rose-500/20 border-rose-400 text-rose-400'
                      : 'bg-white/[0.04] border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Shipping & Warranty */}
              <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>{dict.common.freeShipping}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <span>
                    {locale === 'fa' ? 'گارانتی ۱۸ ماهه تعویض آرو' : '24-Month VIP Warranty'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specs */}
      <ProductSpecs specs={product.specs} />

      {/* Reviews */}
      <ProductReviews product={product} />

      {/* Related Products */}
      <RelatedProducts currentProduct={product} />
    </div>
  )
}
