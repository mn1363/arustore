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
    <div className="glass-panel rounded-3xl p-4 sm:p-5 border border-white/10 flex flex-col sm:flex-row items-center gap-5">
      <Link
        href={`/product/${item.product.slug}`}
        className="w-28 h-28 rounded-2xl bg-obsidian-950 border border-white/10 p-3 flex-shrink-0 flex items-center justify-center"
      >
        <img
          src={item.product.images[0]?.url}
          alt={item.product.name}
          className="w-full h-full object-contain"
        />
      </Link>

      <div className="flex-1 min-w-0 w-full space-y-1.5 text-center sm:text-start">
        <span className="text-[11px] font-semibold text-amber-400">
          {locale === 'fa' ? item.product.brand.name_fa : item.product.brand.name}
        </span>
        <Link href={`/product/${item.product.slug}`}>
          <h3 className="text-base sm:text-lg font-extrabold text-white hover:text-amber-300">
            {getProductTitle(item.product, locale)}
          </h3>
        </Link>
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-400">
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
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px]">
              {locale === 'fa' ? ed.label_fa : ed.label}
            </span>
          )}
        </div>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
        <div className="text-base sm:text-lg font-extrabold text-amber-300">
          {formatPrice(unitUsd * item.quantity, locale, unitToman * item.quantity)}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQty(item.id, item.quantity - 1)}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-7 text-center text-sm font-bold">
            {formatNumber(item.quantity, locale)}
          </span>
          <button
            onClick={() => onUpdateQty(item.id, item.quantity + 1)}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 ms-1"
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
