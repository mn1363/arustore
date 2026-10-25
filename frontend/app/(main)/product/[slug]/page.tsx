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
import RelatedProducts from '@/components/product/RelatedProducts'
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
  const isWishlisted = wishlistIds.includes(product.id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-20">
      <div>
        <Breadcrumb
          items={[
            {
              label: locale === 'fa' ? 'محصولات' : 'Products',
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-6">
          <div className="lg:col-span-7">
            <ProductGallery product={product} selectedColor={selectedColor} />
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-3xl glass-panel p-6 sm:p-8 space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#f4f4f6]">
                  {getProductTitle(product, locale)}
                </h1>
                <div className="text-xl sm:text-2xl font-bold text-[#dfc08e] mt-3">
                  {formatPrice(finalUsd, locale, finalToman)}
                </div>
              </div>

              <p className="text-sm text-[#979fb2] leading-relaxed">
                {getProductDescription(product, locale)}
              </p>

              {/* Color Swatches */}
              <div className="space-y-2.5">
                <div className="text-xs text-[#979fb2]">
                  {dict.common.color}:{' '}
                  <span className="font-bold text-[#f4f4f6]">
                    {locale === 'fa' ? selectedColor.name_fa : selectedColor.name}
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
                    <div key={i} className="flex items-center gap-2 text-xs text-[#b4bccf]">
                      <Check className="w-3.5 h-3.5 text-[#dfc08e] flex-shrink-0" />
                      <span>{h}</span>
                    </div>
                  )
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5 pt-2">
                <div className="flex items-center gap-2 px-3 py-3 rounded-xl border border-white/[0.1] bg-[#0a0c14] shadow-[inset_0_2px_4px_rgba(0,0,0,0.45)]">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="p-0.5 text-[#979fb2] hover:text-white"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center font-bold text-sm text-[#f4f4f6]">
                    {formatNumber(quantity, locale)}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Increase quantity"
                    className="p-0.5 text-[#979fb2] hover:text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() =>
                    addToCart(product, quantity, selectedColor, editionId)
                  }
                  className="flex-1 py-3.5 px-5 rounded-xl champagne-btn font-bold text-sm flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{dict.common.addToCart}</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product.id)}
                  aria-label="Wishlist"
                  className={`p-3.5 rounded-xl secondary-3d-btn ${
                    isWishlisted ? 'text-[#dfc08e] border-[#dfc08e]/50' : ''
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
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
                    {locale === 'fa' ? 'ضمانت ۵ ساله ثبات رنگ' : '5-Year Warranty'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProductSpecs specs={product.specs} />
      <RelatedProducts currentProduct={product} />
    </div>
  )
}
