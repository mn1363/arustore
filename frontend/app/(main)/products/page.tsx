'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { LayoutGrid, List } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import Sidebar from '@/components/layout/Sidebar'
import BrandFilter from '@/components/filters/BrandFilter'
import ColorFilter from '@/components/filters/ColorFilter'
import PriceFilter from '@/components/filters/PriceFilter'
import SearchBar from '@/components/common/SearchBar'
import Pagination from '@/components/common/Pagination'
import ProductCard from '@/components/product/ProductCard'
import LoadingSkeleton from '@/components/common/LoadingSkeleton'
import { CATEGORIES } from '@/lib/data/catalog'
import { useProducts } from '@/hooks/useProducts'
import { useDebounce } from '@/hooks/useDebounce'
import { useStore } from '@/lib/store/useStore'
import { formatNumber } from '@/lib/utils'

function ProductsCatalogContent() {
  const searchParams = useSearchParams()
  const locale = useStore((s) => s.locale)

  const [categorySlug, setCategorySlug] = useState<string>('all')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined)
  const [maxPrice, setMaxPrice] = useState<number>(150)
  const [onlyOnSale, setOnlyOnSale] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating'>('featured')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const cat = searchParams.get('category')
    const brand = searchParams.get('brand')
    const q = searchParams.get('q')
    if (cat) setCategorySlug(cat)
    if (brand) setSelectedBrands([brand])
    if (q) setSearch(q)
  }, [searchParams])

  const debouncedSearch = useDebounce(search, 220)

  const { products, total } = useProducts({
    categorySlug,
    brandSlugs: selectedBrands,
    colorId: selectedColor,
    maxPrice,
    onlyOnSale,
    search: debouncedSearch,
    sortBy,
  })

  const pageSize = 6
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const paginated = products.slice((page - 1) * pageSize, page * pageSize)

  const handleReset = () => {
    setCategorySlug('all')
    setSelectedBrands([])
    setSelectedColor(undefined)
    setMaxPrice(150)
    setOnlyOnSale(false)
    setSearch('')
    setSortBy('featured')
    setPage(1)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumb
        items={[{ label: locale === 'fa' ? 'محصولات' : 'Products' }]}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-4xl font-bold text-[#f4f4f6]">
          {locale === 'fa' ? 'محصولات' : 'Products'}
        </h1>
        <span className="px-3 py-1 rounded-full glass-pill text-xs sm:text-sm text-[#b4bccf]">
          {formatNumber(total, locale)} {locale === 'fa' ? 'محصول' : 'items'}
        </span>
      </div>

      {/* Dimensional Category Capsule Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => {
            setCategorySlug('all')
            setPage(1)
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-all ${
            categorySlug === 'all'
              ? 'champagne-btn font-bold'
              : 'secondary-3d-btn text-[#b4bccf]'
          }`}
        >
          {locale === 'fa' ? 'همه' : 'All'}
        </button>
        {CATEGORIES.map((cat) => {
          const active = categorySlug === cat.slug
          return (
            <button
              key={cat.id}
              onClick={() => {
                setCategorySlug(cat.slug)
                setPage(1)
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-all ${
                active
                  ? 'champagne-btn font-bold'
                  : 'secondary-3d-btn text-[#b4bccf]'
              }`}
            >
              {locale === 'fa' ? cat.name_fa : cat.name}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3">
          <Sidebar onReset={handleReset}>
            <BrandFilter
              selectedBrands={selectedBrands}
              onToggleBrand={(slug) => {
                setPage(1)
                setSelectedBrands((prev) =>
                  prev.includes(slug)
                    ? prev.filter((s) => s !== slug)
                    : [...prev, slug]
                )
              }}
            />

            <ColorFilter
              selectedColor={selectedColor}
              onSelectColor={(c) => {
                setPage(1)
                setSelectedColor(c)
              }}
            />

            <PriceFilter
              maxPrice={maxPrice}
              onChangeMaxPrice={(val) => {
                setPage(1)
                setMaxPrice(val)
              }}
            />
          </Sidebar>
        </div>

        <div className="lg:col-span-9 space-y-6">
          <div className="rounded-2xl surface-level-1 p-3 flex flex-wrap items-center justify-between gap-3">
            <SearchBar
              value={search}
              onChange={(val) => {
                setPage(1)
                setSearch(val)
              }}
            />

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-xl bg-[#0a0c14] border border-white/[0.1] px-3.5 py-2 text-xs text-[#e8ebf2] focus:outline-none focus:border-[#dfc08e]/50"
              >
                <option value="featured">
                  {locale === 'fa' ? 'پیشنهادی' : 'Featured'}
                </option>
                <option value="newest">
                  {locale === 'fa' ? 'جدیدترین' : 'Newest'}
                </option>
                <option value="price-asc">
                  {locale === 'fa' ? 'ارزان‌ترین' : 'Price: Low to High'}
                </option>
                <option value="price-desc">
                  {locale === 'fa' ? 'گران‌ترین' : 'Price: High to Low'}
                </option>
              </select>

              <div className="hidden sm:flex items-center p-1 rounded-xl bg-[#0a0c14] border border-white/[0.1]">
                <button
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[#1b2030] text-[#dfc08e]'
                      : 'text-[#7d8597] hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[#1b2030] text-[#dfc08e]'
                      : 'text-[#7d8597] hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {paginated.length === 0 ? (
            <div className="rounded-2xl surface-level-1 p-12 text-center space-y-4">
              <p className="text-base font-bold text-[#f4f4f6]">
                {locale === 'fa' ? 'محصولی یافت نشد' : 'No products found'}
              </p>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl champagne-btn font-bold text-xs"
              >
                {locale === 'fa' ? 'نمایش همه' : 'Reset'}
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginated.map((product) => (
                <ProductCard key={product.id} product={product} variant="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {paginated.map((product) => (
                <ProductCard key={product.id} product={product} variant="list" />
              ))}
            </div>
          )}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12">
          <LoadingSkeleton count={6} />
        </div>
      }
    >
      <ProductsCatalogContent />
    </Suspense>
  )
}
