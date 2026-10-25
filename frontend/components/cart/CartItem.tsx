'use client'

import React from 'react'
import Link from 'next/link'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { CartItemType } from '@/types'
import { useStore } from '@/lib/store/useStore'
import { formatNumber, formatPrice, getProductTitle } from '@/lib/utils'

export default function CartItem({
  item,
  onUpdateQty,
  onRemove,
}: {
  item: CartItemType
  onUpdateQty: (id: string, qty: number) => void
  onRemove: (id: string) => void
}) {
  const locale = useStore((s) => s.locale)
  const ed = item.product.editions?.find((e) => e.id === item.selectedEdition)
  const unitUsd = item.product.price + (ed?.priceDelta || 0)
  const unitToman = item.product.price_toman + (ed?.priceDeltaToman || 0)

  return (
    <div className="rounded-2xl card-level-2 p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-5">
      <Link
        href={`/product/${item.product.slug}`}
        className="w-28 h-24 rounded-xl product-pedestal-stage border border-white/[0.06] overflow-hidden flex-shrink-0"
      >
        <img
          src={item.product.images[0]?.url}
          alt={item.product.name}
          className="w-full h-full object-cover"
        />
      </Link>

      <div className="flex-1 min-w-0 w-full space-y-1.5 text-center sm:text-start">
        <Link href={`/product/${item.product.slug}`}>
          <h3 className="text-base font-bold text-[#f4f4f6] hover:text-[#dfc08e] transition-colors">
            {getProductTitle(item.product, locale)}
          </h3>
        </Link>
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-[#979fb2]">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full border border-white/30"
              style={{ backgroundColor: item.selectedColor.accentHex }}
            />
            {locale === 'fa'
              ? item.selectedColor.name_fa
              : item.selectedColor.name}
          </span>
          {ed && (
            <span className="px-2 py-0.5 rounded-md bg-white/[0.05] text-[11px]">
              {locale === 'fa' ? ed.label_fa : ed.label}
            </span>
          )}
        </div>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
        <div className="text-base font-bold text-[#dfc08e]">
          {formatPrice(unitUsd * item.quantity, locale, unitToman * item.quantity)}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQty(item.id, item.quantity - 1)}
            className="w-8 h-8 rounded-lg secondary-3d-btn flex items-center justify-center"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-7 text-center text-sm font-bold text-[#f4f4f6]">
            {formatNumber(item.quantity, locale)}
          </span>
          <button
            onClick={() => onUpdateQty(item.id, item.quantity + 1)}
            className="w-8 h-8 rounded-lg secondary-3d-btn flex items-center justify-center"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="p-2 rounded-lg text-[#979fb2] hover:text-white ms-1"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
