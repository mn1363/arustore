'use client'

import React, { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { LayoutGrid, List, Sparkles } from 'lucide-react'
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
          { label: locale === 'fa' ? 'فروشگاه سه‌بعدی' : '3D Store' },
        ]}
      />

      {/* Catalog Hero Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: 'url(/images/banners/hero-aluminum-atelier.png)' }}
        />
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {locale === 'fa'
                ? 'کاتالوگ سه‌بعدی تولیدات ظروف پذیرایی آلومینیومی'
                : 'INTERACTIVE 360° ALUMINUM SERVINGWARE GALLERY'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            {locale === 'fa' ? 'گالری ظروف پذیرایی آلومینیومی آرو' : 'AruStore Aluminum Servingware'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            {locale === 'fa'
              ? 'روی هر کارت حرکت کنید تا پرسپکتیو سه‌بعدی را حس کنید یا با کلیک روی آیکون مکعب، مدل سه‌بعدی ظرف را ۳۶۰ درجه بچرخانید و رنگ آبکاری را تغییر دهید.'
              : 'Hover any piece for spatial 3D tilt or launch the 360° WebGL inspector to test anodized finishes.'}
          </p>
        </div>

        <div className="relative z-10 glass-pill px-4 py-2.5 rounded-2xl text-xs text-slate-300">
          <span className="font-extrabold text-amber-300 text-base me-1.5">
            {formatNumber(total, locale)}
          </span>
          {locale === 'fa' ? 'مدل آماده ارسال از کارخانه' : 'creations available'}
        </div>
      </div>

      {/* Category Quick Filter Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => {
            setCategorySlug('all')
            setPage(1)
          }}
          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
            categorySlug === 'all'
              ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-neon-cyan'
              : 'glass-panel border-white/10 text-slate-300 hover:text-white'
          }`}
        >
          {locale === 'fa' ? 'همه دسته‌ها' : 'All Categories'}
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setCategorySlug(cat.slug)
              setPage(1)
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              categorySlug === cat.slug
                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-neon-cyan'
                : 'glass-panel border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {locale === 'fa' ? cat.name_fa : cat.name}
          </button>
        ))}
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

            <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-white/10">
              <span className="text-xs font-semibold text-slate-300">
                {locale === 'fa' ? 'فقط محصولات تخفیف‌دار' : 'Special Offers Only'}
              </span>
              <input
                type="checkbox"
                checked={onlyOnSale}
                onChange={(e) => {
                  setPage(1)
                  setOnlyOnSale(e.target.checked)
                }}
                className="w-4 h-4 accent-amber-400 rounded"
              />
            </label>
          </Sidebar>
        </div>

        {/* Main Products Column */}
        <div className="lg:col-span-9 space-y-6">
          {/* Toolbar */}
          <div className="glass-panel rounded-2xl p-3 border border-white/10 flex flex-wrap items-center justify-between gap-3">
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
                className="rounded-xl bg-obsidian-900 border border-white/10 px-3.5 py-2.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="featured">
                  {locale === 'fa' ? 'مرتب‌سازی: منتخب استودیو' : 'Sort: Featured'}
                </option>
                <option value="newest">
                  {locale === 'fa' ? 'جدیدترین پرچمدارها' : 'Sort: Newest'}
                </option>
                <option value="rating">
                  {locale === 'fa' ? 'بالاترین امتیاز کاربران' : 'Sort: Top Rated'}
                </option>
                <option value="price-asc">
                  {locale === 'fa' ? 'ارزان‌ترین به گران‌ترین' : 'Price: Low to High'}
                </option>
                <option value="price-desc">
                  {locale === 'fa' ? 'گران‌ترین به ارزان‌ترین' : 'Price: High to Low'}
                </option>
              </select>

              <div className="hidden sm:flex items-center p-1 rounded-xl bg-obsidian-900 border border-white/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'grid' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'list' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {paginated.length === 0 ? (
            <div className="glass-panel rounded-3xl p-12 text-center space-y-4 border border-white/10">
              <p className="text-base font-bold text-white">
                {locale === 'fa'
                  ? 'محصولی با این فیلترها پیدا نشد'
                  : 'No creations matched your filters'}
              </p>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs"
              >
                {locale === 'fa' ? 'نمایش همه محصولات' : 'Reset All Filters'}
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
