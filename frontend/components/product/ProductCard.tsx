'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Box, Heart, Plus, ShoppingBag } from 'lucide-react'
import {
  calculateDiscount,
  cn,
  formatNumber,
  formatPrice,
  getProductSubtitle,
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
  indexNumber,
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
          'rounded-[3px] p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6 border transition-colors group',
          isStone
            ? 'bg-[#f7f4ee] border-[#171512]/14 hover:border-[#8a6430]'
            : 'bg-[#161411] border-[#ece6dc]/14 hover:border-[#c59b5f]/60',
          className
        )}
      >
        <Link
          href={`/product/${product.slug}`}
          className={cn(
            'relative w-full sm:w-56 h-52 overflow-hidden flex-shrink-0 flex items-center justify-center p-5 border',
            isStone
              ? 'bg-[#e6dfd3] border-[#171512]/10'
              : 'bg-[#100f0d] border-[#ece6dc]/10'
          )}
        >
          <img
            src={product.images[0]?.url}
            alt={getProductTitle(product, locale)}
            className="relative z-10 w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        <div className="flex-1 min-w-0 space-y-2.5 w-full">
          <div className="flex items-center justify-between gap-2 font-mono text-[10px] tracking-widest uppercase">
            <span className={isStone ? 'text-[#8a6430]' : 'text-[#c59b5f]'}>
              ARU-{100 + product.id} · {locale === 'fa' ? product.brand.name_fa : product.brand.name}
            </span>
            {discount > 0 && (
              <span className={isStone ? 'text-[#8a6430]' : 'text-[#dfc08e]'}>
                -{formatNumber(discount, locale)}%
              </span>
            )}
          </div>

          <Link href={`/product/${product.slug}`}>
            <h3
              className={cn(
                'font-editorial text-2xl sm:text-[1.7rem] font-bold transition-colors leading-tight',
                isStone
                  ? 'text-[#171512] hover:text-[#8a6430]'
                  : 'text-[#f7f4ee] hover:text-[#dfc08e]'
              )}
            >
              {getProductTitle(product, locale)}
            </h3>
          </Link>
          <p
            className={cn(
              'text-xs sm:text-sm line-clamp-2',
              isStone ? 'text-[#5c554c]' : 'text-[#9e9589]'
            )}
          >
            {getProductSubtitle(product, locale)}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-current/10">
            <div>
              <div
                className={cn(
                  'text-lg font-extrabold',
                  isStone ? 'text-[#171512]' : 'text-[#f7f4ee]'
                )}
              >
                {formatPrice(product.price, locale, product.price_toman)}
              </div>
              {product.compare_price && (
                <div className="text-xs text-[#8a8175] line-through">
                  {formatPrice(
                    product.compare_price,
                    locale,
                    product.compare_price_toman
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuickViewProduct(product)}
                className={cn(
                  'px-3.5 py-2.5 rounded-[2px] border text-xs font-medium flex items-center gap-1.5 transition-colors',
                  isStone
                    ? 'border-[#171512]/20 text-[#171512] hover:border-[#171512]'
                    : 'border-[#ece6dc]/20 text-[#d6cfc4] hover:border-[#c59b5f]'
                )}
              >
                <Box className="w-3.5 h-3.5" />
                <span>360°</span>
              </button>
              <button
                onClick={() => addToCart(product, 1, activeColor)}
                className="px-4 py-2.5 rounded-[2px] satin-brass-btn font-bold text-xs flex items-center gap-1.5"
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
      maxTilt={6}
      glowColor={isStone ? 'rgba(138, 100, 48, 0.12)' : 'rgba(197, 155, 95, 0.16)'}
      className={cn(
        'rounded-[3px] flex flex-col justify-between border transition-colors group h-full overflow-hidden',
        isStone
          ? 'bg-[#f8f5ef] border-[#171512]/14 hover:border-[#171512]/40 shadow-plinth'
          : 'bg-[#161411] border-[#ece6dc]/14 hover:border-[#c59b5f]/55',
        className
      )}
    >
      {/* Top Engraved Index Header */}
      <div
        className={cn(
          'px-4 py-2.5 border-b flex items-center justify-between text-[10px] font-mono tracking-widest uppercase',
          isStone
            ? 'border-[#171512]/10 text-[#6e665c]'
            : 'border-[#ece6dc]/10 text-[#9e9589]'
        )}
      >
        <span>
          {indexNumber !== undefined
            ? `NO. 0${indexNumber + 1}`
            : `ARU-${100 + product.id}`}
        </span>

        <div className="flex items-center gap-2">
          {discount > 0 && (
            <span
              className={cn(
                'px-1.5 py-0.5 font-sans font-bold text-[10px]',
                isStone
                  ? 'bg-[#171512] text-[#f7f4ee]'
                  : 'bg-[#c59b5f]/20 text-[#dfc08e]'
              )}
            >
              {formatNumber(discount, locale)}٪-
            </span>
          )}
          <button
            onClick={(e) => {
              e.preventDefault()
              setQuickViewProduct(product)
            }}
            title={dict.common.quickView3D}
            className={cn(
              'p-1 transition-colors',
              isStone
                ? 'text-[#5c554c] hover:text-[#171512]'
                : 'text-[#a89f93] hover:text-[#dfc08e]'
            )}
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
              'p-1 transition-colors',
              isWishlisted
                ? 'text-[#c59b5f]'
                : isStone
                ? 'text-[#5c554c] hover:text-[#171512]'
                : 'text-[#a89f93] hover:text-[#f7f4ee]'
            )}
          >
            <Heart className={cn('w-3.5 h-3.5', isWishlisted && 'fill-current')} />
          </button>
        </div>
      </div>

      {/* Sculpted Arch Studio Pedestal */}
      <div
        className={cn(
          'relative aspect-[4/3.6] px-6 pt-6 pb-4 flex items-center justify-center overflow-hidden preserve-3d',
          isStone ? 'bg-[#e9e2d6]/70' : 'bg-[#11100e]'
        )}
      >
        {/* Subtle Architectural Arch Niche */}
        <div
          className={cn(
            'pointer-events-none absolute inset-x-7 top-4 bottom-0 arch-niche border transition-colors duration-500',
            isStone
              ? 'border-[#171512]/10 bg-[#dfd6c7]/45 group-hover:border-[#8a6430]/40'
              : 'border-[#ece6dc]/[0.08] bg-[#191713]/70 group-hover:border-[#c59b5f]/35'
          )}
        />

        <Link
          href={`/product/${product.slug}`}
          className="relative z-10 w-full h-full flex items-center justify-center translate-z-20"
        >
          <img
            src={product.images[0]?.url}
            alt={getProductTitle(product, locale)}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)]"
          />
        </Link>

        {/* Quiet Slide-Up 360° Turntable Trigger */}
        <button
          onClick={() => setQuickViewProduct(product)}
          className="absolute bottom-3 inset-x-5 z-20 py-1.5 px-3 bg-[#11100e]/92 border border-[#c59b5f]/45 text-[11px] font-medium text-[#f3efe8] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center gap-1.5"
        >
          <Box className="w-3.5 h-3.5 text-[#c59b5f]" />
          <span>{dict.common.quickView3D} · 360°</span>
        </button>
      </div>

      {/* Editorial Placard Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <div
            className={cn(
              'text-[11px]',
              isStone ? 'text-[#7a7166]' : 'text-[#9e9589]'
            )}
          >
            {locale === 'fa' ? product.brand.name_fa : product.brand.name}
          </div>

          <Link href={`/product/${product.slug}`} className="block">
            <h3
              className={cn(
                'font-editorial text-[1.4rem] font-bold leading-snug line-clamp-1 transition-colors',
                isStone
                  ? 'text-[#171512] group-hover:text-[#8a6430]'
                  : 'text-[#f7f4ee] group-hover:text-[#dfc08e]'
              )}
            >
              {getProductTitle(product, locale)}
            </h3>
            <p
              className={cn(
                'text-xs line-clamp-1 mt-0.5',
                isStone ? 'text-[#635b51]' : 'text-[#8c8377]'
              )}
            >
              {getProductSubtitle(product, locale)}
            </p>
          </Link>

          {/* Machined Anodize Discs */}
          <div className="flex items-center gap-1.5 pt-2">
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

        {/* Hairline Price & Commission Action */}
        <div
          className={cn(
            'pt-3.5 border-t flex items-center justify-between gap-2',
            isStone ? 'border-[#171512]/12' : 'border-[#ece6dc]/10'
          )}
        >
          <div>
            <div
              className={cn(
                'text-sm sm:text-base font-extrabold',
                isStone ? 'text-[#171512]' : 'text-[#f7f4ee]'
              )}
            >
              {formatPrice(product.price, locale, product.price_toman)}
            </div>
            {product.compare_price && (
              <div className="text-[11px] text-[#8a8175] line-through">
                {formatPrice(
                  product.compare_price,
                  locale,
                  product.compare_price_toman
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => addToCart(product, 1, activeColor)}
            disabled={product.stock_quantity <= 0}
            className={cn(
              'px-3.5 py-2 rounded-[2px] text-xs font-bold transition-all flex items-center gap-1',
              isStone
                ? 'bg-[#171512] text-[#f7f4ee] hover:bg-[#8a6430]'
                : 'border border-[#c59b5f]/45 text-[#dfc08e] hover:bg-[#c59b5f] hover:text-[#11100e]'
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{locale === 'fa' ? 'سفارش' : 'Order'}</span>
          </button>
        </div>
      </div>
    </Card3DTilt>
  )
}
