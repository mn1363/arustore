'use client'

import React, { useEffect, useState } from 'react'
import { Product } from '@/types'
import { fetchRelatedCatalogProducts } from '@/lib/api/catalog'
import { useStore } from '@/lib/store/useStore'
import LoadingSkeleton from '@/components/common/LoadingSkeleton'
import ProductCard from './ProductCard'

export default function RelatedProducts({
  currentProduct,
}: {
  currentProduct: Product
}) {
  const locale = useStore((s) => s.locale)
  const upsertCatalogProducts = useStore((s) => s.upsertCatalogProducts)

  const [related, setRelated] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    fetchRelatedCatalogProducts(currentProduct.id, 4, {
      signal: controller.signal,
    })
      .then((items) => {
        if (controller.signal.aborted) return
        setRelated(items)
        upsertCatalogProducts(items)
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (
          controller.signal.aborted ||
          (err &&
            typeof err === 'object' &&
            'name' in err &&
            (err as { name?: unknown }).name === 'AbortError')
        ) {
          return
        }
        setRelated([])
        setError(
          err instanceof Error ? err.message : 'Unable to load related products'
        )
        setIsLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [currentProduct.id, upsertCatalogProducts])

  if (!isLoading && !error && related.length === 0) {
    return null
  }

  return (
    <section className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-[#f2f2f0]">
        {locale === 'fa' ? 'محصولات مشابه' : 'Related Products'}
      </h2>

      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : error ? (
        <div className="rounded-2xl surface-level-1 p-6 text-center text-xs text-[#979fb2]">
          {locale === 'fa'
            ? 'دریافت محصولات مشابه در حال حاضر امکان‌پذیر نیست.'
            : 'Unable to load related products right now.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {related.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}
    </section>
  )
}
