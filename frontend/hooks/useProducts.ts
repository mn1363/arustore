'use client'

import { useCallback, useEffect, useState } from 'react'
import { Brand, Category, Product } from '@/types'
import { ApiError } from '@/lib/api/client'
import {
  fetchCatalogBrands,
  fetchCatalogCategories,
  fetchCatalogProducts,
  PaginationMetaDto,
  ProductSortOption,
} from '@/lib/api/catalog'
import { useStore } from '@/lib/store/useStore'

export interface ProductFilterOptions {
  categorySlug?: string
  brandSlugs?: string[]
  colorId?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  onlyInStock?: boolean
  onlyOnSale?: boolean
  isFeatured?: boolean
  isNew?: boolean
  sortBy?: ProductSortOption
  page?: number
  pageSize?: number
}

const EMPTY_META: PaginationMetaDto = {
  total: 0,
  page: 1,
  page_size: 20,
  total_pages: 1,
  has_next: false,
  has_prev: false,
}

function isAbortError(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === 'object' &&
      'name' in err &&
      (err as { name?: unknown }).name === 'AbortError'
  )
}

function toErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message
  }
  if (err instanceof Error && err.message) {
    return err.message
  }
  return 'Failed to load catalog data'
}

export function useProducts(filters: ProductFilterOptions = {}) {
  const upsertCatalogProducts = useStore((s) => s.upsertCatalogProducts)

  const [products, setProducts] = useState<Product[]>([])
  const [meta, setMeta] = useState<PaginationMetaDto>(EMPTY_META)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadTick, setReloadTick] = useState<number>(0)

  const brandKey = (filters.brandSlugs || []).join(',')

  const reload = useCallback(() => {
    setReloadTick((v) => v + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    const brandList = brandKey ? brandKey.split(',').filter(Boolean) : undefined

    fetchCatalogProducts(
      {
        categorySlug: filters.categorySlug,
        brandSlugs: brandList,
        color: filters.colorId,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        search: filters.search,
        inStock: filters.onlyInStock ? true : undefined,
        isOnSale: filters.onlyOnSale ? true : undefined,
        isFeatured: filters.isFeatured,
        isNew: filters.isNew,
        sortBy: filters.sortBy,
        page: filters.page ?? 1,
        pageSize: filters.pageSize ?? 20,
      },
      { signal: controller.signal }
    )
      .then((res) => {
        if (controller.signal.aborted) return
        setProducts(res.items)
        setMeta(res.meta)
        upsertCatalogProducts(res.items)
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (isAbortError(err) || controller.signal.aborted) return
        setProducts([])
        setMeta(EMPTY_META)
        setError(toErrorMessage(err))
        setIsLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [
    filters.categorySlug,
    brandKey,
    filters.colorId,
    filters.minPrice,
    filters.maxPrice,
    filters.search,
    filters.onlyInStock,
    filters.onlyOnSale,
    filters.isFeatured,
    filters.isNew,
    filters.sortBy,
    filters.page,
    filters.pageSize,
    reloadTick,
    upsertCatalogProducts,
  ])

  return {
    products,
    meta,
    total: meta.total,
    isLoading,
    error,
    reload,
  }
}

export function useCatalogCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback((forceRefresh = false) => {
    setIsLoading(true)
    setError(null)
    fetchCatalogCategories(forceRefresh)
      .then((items) => {
        setCategories(items)
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return
        setCategories([])
        setError(toErrorMessage(err))
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    load(false)
  }, [load])

  const reload = useCallback(() => {
    load(true)
  }, [load])

  return { categories, isLoading, error, reload }
}

export function useCatalogBrands() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback((forceRefresh = false) => {
    setIsLoading(true)
    setError(null)
    fetchCatalogBrands(forceRefresh)
      .then((items) => {
        setBrands(items)
        setIsLoading(false)
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return
        setBrands([])
        setError(toErrorMessage(err))
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    load(false)
  }, [load])

  const reload = useCallback(() => {
    load(true)
  }, [load])

  return { brands, isLoading, error, reload }
}

export default useProducts
