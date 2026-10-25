'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertCircle, LayoutGrid, List } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import Sidebar from '@/components/layout/Sidebar'
import BrandFilter from '@/components/filters/BrandFilter'
import ColorFilter from '@/components/filters/ColorFilter'
import PriceFilter from '@/components/filters/PriceFilter'
import SearchBar from '@/components/common/SearchBar'
import Pagination from '@/components/common/Pagination'
import ProductCard from '@/components/product/ProductCard'
import LoadingSkeleton from '@/components/common/LoadingSkeleton'
import { ProductSortOption } from '@/lib/api/catalog'
import {
  resolveBrandSlugAlias,
  resolveCategorySlugAlias,
} from '@/lib/data/catalog'
import { useCatalogCategories, useProducts } from '@/hooks/useProducts'
import { useDebounce } from '@/hooks/useDebounce'
import { useStore } from '@/lib/store/useStore'
import { formatNumber } from '@/lib/utils'

const VALID_SORT_OPTIONS: readonly ProductSortOption[] = [
  'featured',
  'newest',
  'price-asc',
  'price-desc',
  'rating',
]

function ProductsCatalogContent() {
  const searchParams = useSearchParams()
  const locale = useStore((s) => s.locale)

  const [categorySlug, setCategorySlug] = useState<string>('all')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedColor, setSelectedColor] = useState<string | undefined>(
    undefined
  )
  const [maxPrice, setMaxPrice] = useState<number>(150)
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [onlyOnSale, setOnlyOnSale] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<ProductSortOption>('featured')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)

  const {
    categories,
    error: categoriesError,
    reload: reloadCategories,
  } = useCatalogCategories()

  useEffect(() => {
    const cat = searchParams.get('category')
    const brand = searchParams.get('brand')
    const q = searchParams.get('q')
    const sortParam = searchParams.get('sort')

    if (cat) {
      setCategorySlug(
        cat === 'all' ? 'all' : resolveCategorySlugAlias(cat)
      )
      setPage(1)
    }
    if (brand) {
      setSelectedBrands([resolveBrandSlugAlias(brand)])
      setPage(1)
    }
    if (q !== null) {
      setSearch(q)
      setPage(1)
    }
    if (
      sortParam &&
      (VALID_SORT_OPTIONS as readonly string[]).includes(sortParam)
    ) {
      setSortBy(sortParam as ProductSortOption)
      setPage(1)
    }
  }, [searchParams])

  const debouncedSearch = useDebounce(search, 220)
  const pageSize = 6

  const {
    products,
    meta,
    total,
    isLoading,
    error,
    reload: reloadProducts,
  } = useProducts({
    categorySlug,
    brandSlugs: selectedBrands,
    colorId: selectedColor,
    maxPrice: maxPrice < 150 ? maxPrice : undefined,
    onlyInStock,
    onlyOnSale,
    search: debouncedSearch,
    sortBy,
    page,
    pageSize,
  })

  const handleReset = () => {
    setCategorySlug('all')
    setSelectedBrands([])
    setSelectedColor(undefined)
    setMaxPrice(150)
    setOnlyInStock(false)
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

        {categories.map((cat) => {
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

        {categoriesError && (
          <button
            type="button"
            onClick={reloadCategories}
            className="px-3 py-2 rounded-xl bg-[#0a0c14]/70 border border-white/[0.1] text-xs text-[#dfc08e] whitespace-nowrap"
          >
            {locale === 'fa'
              ? 'بارگذاری مجدد دسته‌بندی‌ها'
              : 'Reload categories'}
          </button>
        )}
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

            {/* Availability & Sale Filters (Server-Backed) */}
            <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
              <h4 className="text-xs font-bold text-[#9ca0ab]">
                {locale === 'fa' ? 'وضعیت و فروش ویژه' : 'Availability'}
              </h4>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPage(1)
                    setOnlyInStock((v) => !v)
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                    onlyInStock
                      ? 'bg-[#1b2030] border-[#dfc08e]/60 text-[#f4f4f6] font-semibold'
                      : 'bg-[#0a0c14]/70 border-white/[0.08] text-[#979fb2] hover:border-white/20'
                  }`}
                >
                  {locale === 'fa' ? 'فقط موجود در انبار' : 'In Stock Only'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPage(1)
                    setOnlyOnSale((v) => !v)
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs border transition-all ${
                    onlyOnSale
                      ? 'bg-[#1b2030] border-[#dfc08e]/60 text-[#f4f4f6] font-semibold'
                      : 'bg-[#0a0c14]/70 border-white/[0.08] text-[#979fb2] hover:border-white/20'
                  }`}
                >
                  {locale === 'fa' ? 'تخفیف‌دار' : 'On Sale'}
                </button>
              </div>
            </div>
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
                onChange={(e) => {
                  setPage(1)
                  setSortBy(e.target.value as ProductSortOption)
                }}
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
                <option value="rating">
                  {locale === 'fa' ? 'بالاترین امتیاز' : 'Top Rated'}
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

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: pageSize }).map((_, idx) => (
                <div
                  key={idx}
                  className="glass-panel rounded-2xl p-4 space-y-4 animate-pulse border border-white/5"
                >
                  <div className="aspect-[16/11] rounded-xl bg-white/5" />
                  <div className="h-4 w-2/3 rounded bg-white/10" />
                  <div className="h-3 w-1/3 rounded bg-white/5" />
                  <div className="h-9 w-full rounded-xl bg-white/10" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl surface-level-1 p-12 text-center space-y-4">
              <AlertCircle className="w-8 h-8 text-[#dfc08e] mx-auto" />
              <p className="text-base font-bold text-[#f4f4f6]">
                {locale === 'fa'
                  ? 'خطا در برقراری ارتباط با سرور محصولات'
                  : 'Unable to load products from server'}
              </p>
              <button
                type="button"
                onClick={reloadProducts}
                className="px-5 py-2.5 rounded-xl champagne-btn font-bold text-xs"
              >
                {locale === 'fa' ? 'تلاش مجدد' : 'Retry'}
              </button>
            </div>
          ) : products.length === 0 ? (
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
              {products.map((product) => (
                <ProductCard key={product.id} product={product} variant="grid" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} variant="list" />
              ))}
            </div>
          )}

          {!isLoading && !error && (
            <Pagination
              currentPage={meta.page}
              totalPages={meta.total_pages}
              onPageChange={setPage}
            />
          )}
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
