'use client'

import React from 'react'
import { Star } from 'lucide-react'
import { useStore } from '@/lib/store/useStore'
import { formatNumber, formatPrice, getProductTitle } from '@/lib/utils'

export default function AdminProductsPage() {
  const locale = useStore((s) => s.locale)
  const products = useStore((s) => s.products)
  const toggleProductFeatured = useStore((s) => s.toggleProductFeatured)
  const updateProductStock = useStore((s) => s.updateProductStock)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#f4f4f6]">
        {locale === 'fa'
          ? 'مدیریت محصولات و مدل‌های سه‌بعدی'
          : '3D Product Inventory Manager'}
      </h1>

      <div className="rounded-3xl surface-level-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-white/[0.03] border-b border-white/[0.08] text-[#979fb2]">
              <tr>
                <th className="text-start px-5 py-4">
                  {locale === 'fa' ? 'محصول' : 'Product'}
                </th>
                <th className="text-start px-4 py-4">
                  {locale === 'fa' ? 'مدل ۳بعدی' : '3D Archetype'}
                </th>
                <th className="text-start px-4 py-4">
                  {locale === 'fa' ? 'قیمت' : 'Price'}
                </th>
                <th className="text-start px-4 py-4">
                  {locale === 'fa' ? 'موجودی انبار' : 'Stock'}
                </th>
                <th className="text-center px-4 py-4">
                  {locale === 'fa' ? 'منتخب ویترین' : 'Featured'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.images[0]?.url}
                        alt={p.name}
                        className="w-11 h-11 rounded-xl product-pedestal-stage p-1 object-contain border border-white/[0.08]"
                      />
                      <div>
                        <div className="font-bold text-[#f4f4f6]">
                          {getProductTitle(p, locale)}
                        </div>
                        <div className="text-[11px] text-[#7d8597]">{p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-1 rounded-lg bg-[#1b2030] border border-[#dfc08e]/30 text-[#dfc08e] font-mono text-xs">
                      {p.archetype}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-[#f4f4f6]">
                    {formatPrice(p.price, locale, p.price_toman)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateProductStock(p.id, p.stock_quantity - 1)}
                        className="w-6 h-6 rounded-md secondary-3d-btn flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-7 text-center font-bold text-[#f4f4f6]">
                        {formatNumber(p.stock_quantity, locale)}
                      </span>
                      <button
                        onClick={() => updateProductStock(p.id, p.stock_quantity + 1)}
                        className="w-6 h-6 rounded-md secondary-3d-btn flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => toggleProductFeatured(p.id)}
                      className={`p-2 rounded-xl border transition-colors ${
                        p.is_featured
                          ? 'bg-[#1b2030] border-[#dfc08e]/50 text-[#dfc08e]'
                          : 'bg-white/[0.03] border-white/[0.08] text-[#7d8597]'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${p.is_featured ? 'fill-current' : ''}`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
