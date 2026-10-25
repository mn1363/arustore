'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import Breadcrumb from '@/components/layout/Breadcrumb'
import ProductCard from '@/components/product/ProductCard'
import { useStore } from '@/lib/store/useStore'
import { fetchCatalogProductByIdentifier } from '@/lib/api/catalog'
import { getDict } from '@/lib/data/i18n'

export default function WishlistPage() {
  const locale = useStore((s) => s.locale)
  const user = useStore((s) => s.user)
  const authStatus = useStore((s) => s.authStatus)
  const products = useStore((s) => s.products)
  const upsertCatalogProducts = useStore((s) => s.upsertCatalogProducts)
  const guestWishlistIds = useStore((s) => s.guestWishlistIds)
  const authWishlistProducts = useStore((s) => s.authWishlistProducts)
  const wishlistLoading = useStore((s) => s.wishlistLoading)
  const wishlistError = useStore((s) => s.wishlistError)
  const loadServerWishlist = useStore((s) => s.loadServerWishlist)
  const dict = getDict(locale)

  const [guestHydrating, setGuestHydrating] = useState(false)
  const [guestHydrateError, setGuestHydrateError] = useState<string | null>(
    null
  )

  // Hydrate missing catalog products on direct reload of guest wishlist
  useEffect(() => {
    if (user || authStatus === 'loading' || guestWishlistIds.length === 0) {
      return
    }
    const loadedIds = new Set(products.map((p) => p.id))
    const missingIds = guestWishlistIds.filter((id) => !loadedIds.has(id))
    if (missingIds.length === 0) return

    let cancelled = false
    setGuestHydrating(true)
    setGuestHydrateError(null)
    Promise.allSettled(
      missingIds.map((id) => fetchCatalogProductByIdentifier(id))
    )
      .then((results) => {
        if (cancelled) return
        const fetched = results
          .filter(
            (r): r is PromiseFulfilledResult<typeof products[number]> =>
              r.status === 'fulfilled'
          )
          .map((r) => r.value)
        if (fetched.length > 0) {
          upsertCatalogProducts(fetched)
        }
        const nonNotFoundFailure = results.find(
          (r): r is PromiseRejectedResult =>
            r.status === 'rejected' &&
            !(
              r.reason &&
              typeof r.reason === 'object' &&
              'status' in r.reason &&
              (r.reason as { status?: number }).status === 404
            )
        )
        if (nonNotFoundFailure && fetched.length === 0) {
          setGuestHydrateError(
            nonNotFoundFailure.reason instanceof Error
              ? nonNotFoundFailure.reason.message
              : 'Unable to load saved items'
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setGuestHydrating(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [user, authStatus, guestWishlistIds, products, upsertCatalogProducts])

  const items = useMemo(() => {
    if (user) {
      return authWishlistProducts
    }
    return products.filter((p) => guestWishlistIds.includes(p.id))
  }, [user, authWishlistProducts, products, guestWishlistIds])

  const isLoading =
    authStatus === 'loading' ||
    (Boolean(user) && wishlistLoading && items.length === 0) ||
    (!user && guestHydrating && items.length === 0)

  const activeError = user ? wishlistError : guestHydrateError

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumb items={[{ label: dict.nav.wishlist }]} />

      <h1 className="text-2xl sm:text-3xl font-bold text-[#f4f4f6]">
        {dict.nav.wishlist}
      </h1>

      {activeError && (
        <div
          role="alert"
          className="rounded-2xl surface-level-1 border border-rose-500/25 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-rose-300"
        >
          <span>{activeError}</span>
          {user && (
            <button
              type="button"
              onClick={() => {
                void loadServerWishlist()
              }}
              className="px-3.5 py-1.5 rounded-xl secondary-3d-btn text-xs font-semibold text-[#f4f4f6]"
            >
              {locale === 'fa' ? 'تلاش مجدد' : 'Retry'}
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-3xl surface-level-1 p-14 text-center space-y-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#dfc08e]/30 border-t-[#dfc08e] animate-spin mx-auto" />
          <p className="text-sm text-[#979fb2]">
            {locale === 'fa'
              ? 'در حال بارگذاری لیست علاقه‌مندی‌ها...'
              : 'Loading your saved pieces...'}
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl surface-level-1 p-14 text-center space-y-5">
          <Heart className="w-10 h-10 text-[#666e82] mx-auto" />
          <p className="text-base font-bold text-[#f4f4f6]">
            {locale === 'fa'
              ? 'لیست علاقه‌مندی‌ها خالی است'
              : 'Your wishlist is empty'}
          </p>
          <Link
            href="/products"
            className="inline-flex px-6 py-3 rounded-xl champagne-btn font-bold text-sm"
          >
            {dict.common.continueShopping}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
