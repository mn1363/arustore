'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Check,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
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
              label: locale === 'fa' ? 'آثار و ظروف' : 'Objects',
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
          {/* Dual 3D WebGL + Studio Plate Vitrine */}
          <div className="lg:col-span-7">
            <ProductGallery product={product} selectedColor={selectedColor} />
          </div>

          {/* Specimen Dossier & Order Panel */}
          <div className="lg:col-span-5">
            <div className="atelier-corners border border-[#ece6dc]/18 bg-[#151310] p-6 sm:p-8 space-y-6">
              {/* SKU & Workshop Stamp */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#ece6dc]/12 pb-3">
                <span className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#c59b5f]">
                  ARU-{100 + product.id} · {locale === 'fa' ? product.brand.name_fa : product.brand.name}
                </span>
                {discount > 0 && (
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-[#c59b5f]/20 text-[#dfc08e]">
                    {formatNumber(discount, locale)}٪ {dict.common.off}
                  </span>
                )}
              </div>

              {/* Editorial Title */}
              <div>
                <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-[#f7f4ee] leading-[1.08]">
                  {getProductTitle(product, locale)}
                </h1>
                <p className="text-xs sm:text-sm text-[#9e9589] mt-2">
                  {getProductSubtitle(product, locale)}
                </p>

                <div className="flex items-center gap-3 mt-3 font-mono text-[11px] text-[#b9b0a2]">
                  <span>★ {product.rating_avg.toFixed(2)}</span>
                  <span className="text-[#ece6dc]/20">|</span>
                  <span>
                    {formatNumber(product.rating_count, locale)}{' '}
                    {locale === 'fa' ? 'ثبت دیدگاه' : 'reviews'}
                  </span>
                  <span className="text-[#dfc08e] ms-auto font-sans font-semibold">
                    ● {dict.common.inStock}
                  </span>
                </div>
              </div>

              {/* Price Ledger */}
              <div className="py-4 border-y border-[#ece6dc]/14 flex items-baseline justify-between gap-4">
                <div>
                  <div className="font-mono text-[10px] tracking-widest uppercase text-[#8c8377]">
                    {dict.common.price}
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#f7f4ee] mt-0.5">
                    {formatPrice(finalUsd, locale, finalToman)}
                  </div>
                </div>
                {product.compare_price && (
                  <div className="text-sm text-[#7e766b] line-through">
                    {formatPrice(
                      product.compare_price,
                      locale,
                      product.compare_price_toman
                    )}
                  </div>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[#c9c0b3] leading-[1.9]">
                {getProductDescription(product, locale)}
              </p>

              {/* Anodize Finish Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9e9589]">{dict.common.color}:</span>
                  <span className="font-bold text-[#f7f4ee]">
                    {locale === 'fa' ? selectedColor.name_fa : selectedColor.name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c, idx) => (
                    <button
                      key={c.id}
                      onClick={() => setColorIdx(idx)}
                      className={`px-3.5 py-2 border text-xs font-medium flex items-center gap-2 transition-colors ${
                        colorIdx === idx
                          ? 'bg-[#221e19] border-[#c59b5f] text-[#f7f4ee]'
                          : 'bg-[#11100e] border-[#ece6dc]/14 text-[#9e9589] hover:text-[#f7f4ee]'
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
                <div className="space-y-2">
                  <div className="text-xs text-[#9e9589]">{dict.common.edition}:</div>
                  <div className="grid grid-cols-1 gap-2">
                    {product.editions.map((ed) => {
                      const active = ed.id === editionId
                      return (
                        <button
                          key={ed.id}
                          onClick={() => setEditionId(ed.id)}
                          className={`px-4 py-3 border text-xs font-bold flex items-center justify-between transition-colors ${
                            active
                              ? 'bg-[#221e19] border-[#c59b5f] text-[#f7f4ee]'
                              : 'bg-[#11100e] border-[#ece6dc]/14 text-[#b9b0a2] hover:border-[#ece6dc]/30'
                          }`}
                        >
                          <span>{locale === 'fa' ? ed.label_fa : ed.label}</span>
                          {ed.priceDelta > 0 && (
                            <span className="text-[#dfc08e]">
                              + {formatPrice(ed.priceDelta, locale, ed.priceDeltaToman)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Craft Highlights */}
              <div className="space-y-2 pt-1">
                {(locale === 'fa' ? product.highlights_fa : product.highlights).map(
                  (h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-[#c9c0b3]">
                      <Check className="w-3.5 h-3.5 text-[#c59b5f] flex-shrink-0" />
                      <span>{h}</span>
                    </div>
                  )
                )}
              </div>

              {/* Quantity + Commission Trigger */}
              <div className="flex items-center gap-2.5 pt-2">
                <div className="flex items-center gap-2 px-3 py-3 border border-[#ece6dc]/16 bg-[#11100e]">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-0.5 text-[#b9b0a2] hover:text-[#f7f4ee]"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-7 text-center font-mono font-bold text-sm">
                    {formatNumber(quantity, locale)}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="p-0.5 text-[#b9b0a2] hover:text-[#f7f4ee]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() =>
                    addToCart(product, quantity, selectedColor, editionId)
                  }
                  className="flex-1 py-3.5 px-5 rounded-[2px] brushed-metal-btn font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{dict.common.addToCart}</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`p-3.5 border transition-colors ${
                    isWishlisted
                      ? 'bg-[#c59b5f]/20 border-[#c59b5f] text-[#dfc08e]'
                      : 'bg-[#11100e] border-[#ece6dc]/16 text-[#b9b0a2] hover:text-[#f7f4ee]'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Foundry Guarantees */}
              <div className="pt-4 border-t border-[#ece6dc]/12 grid grid-cols-2 gap-3 text-[11px] text-[#9e9589]">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#c59b5f] flex-shrink-0" />
                  <span>{dict.common.freeShipping}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#c59b5f] flex-shrink-0" />
                  <span>
                    {locale === 'fa' ? 'ضمانت ۵ ساله ثبات آنودایز' : '5-Year Anodize Guarantee'}
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
