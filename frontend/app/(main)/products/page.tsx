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
        items={[
          { label: locale === 'fa' ? 'آثار و ظروف' : 'Objects' },
        ]}
      />

      {/* Clean Compact Masthead */}
      <div className="border-b border-[#ece6dc]/15 pb-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold text-[#f7f4ee]">
          {locale === 'fa' ? 'محصولات کارگاه آرو' : 'AruStore Workshop Products'}
        </h1>

        <div className="border border-[#ece6dc]/16 bg-[#161411] px-3.5 py-2 text-xs text-[#b9b0a2]">
          <span className="font-bold text-[#dfc08e] text-sm me-1.5">
            {formatNumber(total, locale)}
          </span>
          {locale === 'fa' ? 'مدل آماده ارسال' : 'models'}
        </div>
      </div>

      {/* Architectural Underline Category Tabs */}
      <div className="flex items-center gap-6 overflow-x-auto border-b border-[#ece6dc]/12">
        <button
          onClick={() => {
            setCategorySlug('all')
            setPage(1)
          }}
          className={`pb-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors relative ${
            categorySlug === 'all'
              ? 'text-[#f7f4ee]'
              : 'text-[#8c8377] hover:text-[#d6cfc4]'
          }`}
        >
          <span>{locale === 'fa' ? 'تمامی آثار' : 'All Objects'}</span>
          {categorySlug === 'all' && (
            <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#c59b5f]" />
          )}
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
              className={`pb-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors relative ${
                active ? 'text-[#f7f4ee]' : 'text-[#8c8377] hover:text-[#d6cfc4]'
              }`}
            >
              <span>{locale === 'fa' ? cat.name_fa : cat.name}</span>
              {active && (
                <span className="absolute bottom-0 inset-x-0 h-[2px] bg-[#c59b5f]" />
              )}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Filters */}
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

            <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#ece6dc]/10">
              <span className="text-xs font-medium text-[#c9c0b3]">
                {locale === 'fa' ? 'فقط شرایط ویژه کارگاه' : 'Special Allocation Only'}
              </span>
              <input
                type="checkbox"
                checked={onlyOnSale}
                onChange={(e) => {
                  setPage(1)
                  setOnlyOnSale(e.target.checked)
                }}
                className="w-4 h-4 accent-[#c59b5f]"
              />
            </label>
          </Sidebar>
        </div>

        {/* Main Products Column */}
        <div className="lg:col-span-9 space-y-6">
          <div className="border border-[#ece6dc]/14 bg-[#161411] p-3 flex flex-wrap items-center justify-between gap-3">
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
                className="bg-[#11100e] border border-[#ece6dc]/16 px-3.5 py-2.5 text-xs font-medium text-[#e6dfd3] focus:outline-none focus:border-[#c59b5f]"
              >
                <option value="featured">
                  {locale === 'fa' ? 'چیدمان: برگزیده تالار' : 'Sort: Curated'}
                </option>
                <option value="newest">
                  {locale === 'fa' ? 'جدیدترین قالب‌ها' : 'Sort: Newest'}
                </option>
                <option value="rating">
                  {locale === 'fa' ? 'بالاترین رضایت خریداران' : 'Sort: Highest Rated'}
                </option>
                <option value="price-asc">
                  {locale === 'fa' ? 'قیمت: کم به زیاد' : 'Price: Low to High'}
                </option>
                <option value="price-desc">
                  {locale === 'fa' ? 'قیمت: زیاد به کم' : 'Price: High to Low'}
                </option>
              </select>

              <div className="hidden sm:flex items-center border border-[#ece6dc]/16 bg-[#11100e]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${
                    viewMode === 'grid' ? 'bg-[#c59b5f] text-[#11100e]' : 'text-[#9e9589]'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${
                    viewMode === 'list' ? 'bg-[#c59b5f] text-[#11100e]' : 'text-[#9e9589]'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {paginated.length === 0 ? (
            <div className="border border-[#ece6dc]/14 bg-[#161411] p-12 text-center space-y-4">
              <p className="font-editorial text-2xl font-bold text-[#f7f4ee]">
                {locale === 'fa'
                  ? 'اثری با این مشخصات یافت نشد'
                  : 'No objects matched your selection'}
              </p>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-[2px] satin-brass-btn font-bold text-xs"
              >
                {locale === 'fa' ? 'بازنشانی فیلترها' : 'Reset Filters'}
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginated.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="grid"
                  indexNumber={(page - 1) * pageSize + idx}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {paginated.map((product, idx) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="list"
                  indexNumber={(page - 1) * pageSize + idx}
                />
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
