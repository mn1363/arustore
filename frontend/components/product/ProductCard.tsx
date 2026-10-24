'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Box, Heart, Plus, ShoppingBag } from 'lucide-react'
import {
  calculateDiscount,
  cn,
  formatNumber,
  formatPrice,
  getProductTitle,
} from '@/lib/utils'
import { Product } from '@/types'
import { useStore } from '@/lib/store/useStore'
import { getDict } from '@/lib/data/i18n'
import Card3DTilt from '@/components/ui/Card3DTilt'

interface ProductCardProps {
  product: Product
  variant?: 'grid' | 'list'
  tone?: 'dark' | 'stone'
  indexNumber?: number
  className?: string
}

export default function ProductCard({
  product,
  variant = 'grid',
  tone = 'dark',
  className,
}: ProductCardProps) {
  const locale = useStore((s) => s.locale)
  const addToCart = useStore((s) => s.addToCart)
  const wishlistIds = useStore((s) => s.wishlistIds)
  const toggleWishlist = useStore((s) => s.toggleWishlist)
  const setQuickViewProduct = useStore((s) => s.setQuickViewProduct)
  const dict = getDict(locale)

  const [colorIdx, setColorIdx] = useState(0)
  const activeColor = product.colors[colorIdx] || product.colors[0]
  const isWishlisted = wishlistIds.includes(product.id)
  const discount = calculateDiscount(product.price, product.compare_price)
  const isStone = tone === 'stone'

  if (variant === 'list') {
    return (
      <div
        className={cn(
          'rounded-[3px] overflow-hidden flex flex-col sm:flex-row items-stretch border transition-colors group',
          isStone
            ? 'bg-[#f8f5ef] border-[#171512]/14 hover:border-[#8a6430]'
            : 'bg-[#161411] border-[#ece6dc]/14 hover:border-[#c59b5f]/60',
          className
        )}
      >
        <Link
          href={`/product/${product.slug}`}
          className="relative w-full sm:w-64 h-48 sm:h-auto overflow-hidden flex-shrink-0"
        >
          <img
            src={product.images[0]?.url}
            alt={getProductTitle(product, locale)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        <div className="flex-1 p-5 flex flex-col justify-between gap-4">
          <div>
            <Link href={`/product/${product.slug}`}>
              <h3
                className={cn(
                  'font-editorial text-xl font-bold transition-colors',
                  isStone
                    ? 'text-[#171512] hover:text-[#8a6430]'
                    : 'text-[#f7f4ee] hover:text-[#dfc08e]'
                )}
              >
                {getProductTitle(product, locale)}
              </h3>
            </Link>
            <div className="flex items-center gap-1.5 mt-3">
              {product.colors.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => setColorIdx(idx)}
                  className={cn(
                    'w-4 h-4 rounded-full border transition-transform',
                    colorIdx === idx ? 'scale-125 border-[#c59b5f]' : 'opacity-70'
                  )}
                  style={{
                    background: `linear-gradient(135deg, ${c.hex} 42%, ${c.accentHex} 100%)`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-current/10">
            <div
              className={cn(
                'text-lg font-extrabold',
                isStone ? 'text-[#171512]' : 'text-[#f7f4ee]'
              )}
            >
              {formatPrice(product.price, locale, product.price_toman)}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuickViewProduct(product)}
                className={cn(
                  'px-3.5 py-2 rounded-[2px] border text-xs font-medium flex items-center gap-1.5',
                  isStone
                    ? 'border-[#171512]/20 text-[#171512]'
                    : 'border-[#ece6dc]/20 text-[#d6cfc4]'
                )}
              >
                <Box className="w-3.5 h-3.5" />
                <span>3D</span>
              </button>
              <button
                onClick={() => addToCart(product, 1, activeColor)}
                className="px-4 py-2 rounded-[2px] satin-brass-btn font-bold text-xs flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{dict.common.addToCart}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card3DTilt
      maxTilt={5}
      glowColor={isStone ? 'rgba(138, 100, 48, 0.1)' : 'rgba(197, 155, 95, 0.14)'}
      className={cn(
        'rounded-[3px] flex flex-col justify-between border transition-colors group h-full overflow-hidden',
        isStone
          ? 'bg-[#f8f5ef] border-[#171512]/14 hover:border-[#171512]/40 shadow-plinth'
          : 'bg-[#161411] border-[#ece6dc]/14 hover:border-[#c59b5f]/55',
        className
      )}
    >
      {/* Full-Frame Real Workshop Photograph */}
      <div className="relative aspect-[16/11] w-full overflow-hidden bg-[#100f0d]">
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={product.images[0]?.url}
            alt={getProductTitle(product, locale)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </Link>

        {/* Minimal Corner Controls */}
        <div className="absolute top-2.5 end-2.5 z-20 flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.preventDefault()
              setQuickViewProduct(product)
            }}
            title={dict.common.quickView3D}
            className="p-2 rounded-[2px] bg-[#11100e]/80 backdrop-blur-sm border border-[#ece6dc]/20 text-[#f3efe8] hover:border-[#c59b5f] hover:text-[#dfc08e] transition-colors"
          >
            <Box className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              toggleWishlist(product.id)
            }}
            aria-label="Wishlist"
            className={cn(
              'p-2 rounded-[2px] bg-[#11100e]/80 backdrop-blur-sm border border-[#ece6dc]/20 transition-colors',
              isWishlisted ? 'text-[#dfc08e] border-[#c59b5f]' : 'text-[#f3efe8]'
            )}
          >
            <Heart className={cn('w-3.5 h-3.5', isWishlisted && 'fill-current')} />
          </button>
        </div>

        {discount > 0 && (
          <span className="absolute top-2.5 start-2.5 z-20 px-2 py-0.5 rounded-[2px] bg-[#11100e]/85 text-[#dfc08e] text-[11px] font-bold">
            {formatNumber(discount, locale)}٪-
          </span>
        )}

        {/* Quiet 3D Hover Bar */}
        <button
          onClick={() => setQuickViewProduct(product)}
          className="absolute bottom-2.5 inset-x-3 z-20 py-1.5 px-3 bg-[#11100e]/90 border border-[#c59b5f]/45 text-[11px] font-semibold text-[#f3efe8] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-1.5"
        >
          <Box className="w-3.5 h-3.5 text-[#c59b5f]" />
          <span>{locale === 'fa' ? 'نمای سه‌بعدی ۳۶۰°' : '360° 3D View'}</span>
        </button>
      </div>

      {/* Clean Minimal Meta */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
        <div className="space-y-2">
          <Link href={`/product/${product.slug}`} className="block">
            <h3
              className={cn(
                'font-editorial text-lg font-bold leading-snug line-clamp-1 transition-colors',
                isStone
                  ? 'text-[#171512] group-hover:text-[#8a6430]'
                  : 'text-[#f7f4ee] group-hover:text-[#dfc08e]'
              )}
            >
              {getProductTitle(product, locale)}
            </h3>
          </Link>

          <div className="flex items-center gap-1.5">
            {product.colors.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => setColorIdx(idx)}
                title={locale === 'fa' ? c.name_fa : c.name}
                className={cn(
                  'w-4 h-4 rounded-full border transition-transform',
                  colorIdx === idx
                    ? isStone
                      ? 'scale-125 border-[#171512] ring-1 ring-[#8a6430]'
                      : 'scale-125 border-[#f7f4ee] ring-1 ring-[#c59b5f]'
                    : 'border-black/25 opacity-75 hover:opacity-100'
                )}
                style={{
                  background: `linear-gradient(135deg, ${c.hex} 42%, ${c.accentHex} 100%)`,
                }}
              />
            ))}
            <span
              className={cn(
                'text-[11px] ms-1 truncate',
                isStone ? 'text-[#6e665c]' : 'text-[#8c8377]'
              )}
            >
              {locale === 'fa' ? activeColor.name_fa : activeColor.name}
            </span>
          </div>
        </div>

        <div
          className={cn(
            'pt-3 border-t flex items-center justify-between gap-2',
            isStone ? 'border-[#171512]/10' : 'border-[#ece6dc]/10'
          )}
        >
          <div
            className={cn(
              'text-sm sm:text-base font-extrabold',
              isStone ? 'text-[#171512]' : 'text-[#f7f4ee]'
            )}
          >
            {formatPrice(product.price, locale, product.price_toman)}
          </div>

          <button
            onClick={() => addToCart(product, 1, activeColor)}
            disabled={product.stock_quantity <= 0}
            className={cn(
              'px-3.5 py-1.5 rounded-[2px] text-xs font-bold transition-all flex items-center gap-1',
              isStone
                ? 'bg-[#171512] text-[#f7f4ee] hover:bg-[#8a6430]'
                : 'border border-[#c59b5f]/45 text-[#dfc08e] hover:bg-[#c59b5f] hover:text-[#11100e]'
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{locale === 'fa' ? 'افزودن' : 'Add'}</span>
          </button>
        </div>
      </div>
    </Card3DTilt>
  )
}
