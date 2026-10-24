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
        <h1 className="text-2xl sm:text-4xl font-bold text-[#f2f2f0]">
          {locale === 'fa' ? 'محصولات' : 'Products'}
        </h1>
        <span className="text-xs sm:text-sm text-[#8e93a0]">
          {formatNumber(total, locale)} {locale === 'fa' ? 'محصول' : 'items'}
        </span>
      </div>

      {/* Clean Category Filter Tabs */}
      <div className="flex items-center gap-6 overflow-x-auto border-b border-white/[0.07]">
        <button
          onClick={() => {
            setCategorySlug('all')
            setPage(1)
          }}
          className={`pb-3 text-xs sm:text-sm whitespace-nowrap border-b-2 transition-colors ${
            categorySlug === 'all'
              ? 'text-[#f2f2f0] font-bold border-[#d6b88a]'
              : 'text-[#8e93a0] border-transparent hover:text-[#d4d6dc]'
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
              className={`pb-3 text-xs sm:text-sm whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? 'text-[#f2f2f0] font-bold border-[#d6b88a]'
                  : 'text-[#8e93a0] border-transparent hover:text-[#d4d6dc]'
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
          <div className="rounded-2xl bg-[#14161a] border border-white/[0.07] p-3 flex flex-wrap items-center justify-between gap-3">
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
                className="rounded-xl bg-[#0d0e11] border border-white/10 px-3.5 py-2 text-xs text-[#e4e6eb] focus:outline-none"
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

              <div className="hidden sm:flex items-center p-1 rounded-xl bg-[#0d0e11] border border-white/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg ${
                    viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-[#7d828f]'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg ${
                    viewMode === 'list' ? 'bg-white/10 text-white' : 'text-[#7d828f]'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {paginated.length === 0 ? (
            <div className="rounded-2xl bg-[#14161a] border border-white/[0.07] p-12 text-center space-y-4">
              <p className="text-base font-bold text-[#f2f2f0]">
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
