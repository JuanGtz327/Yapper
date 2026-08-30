import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { qk } from '../../lib/queryKeys.ts'
import {
  loadProductById,
  loadVariantPriceHistory,
  loadVariantRestockHistory,
} from '../../lib/repository.ts'
import type {
  Product,
  VariantPriceHistory,
  VariantRestockHistory,
} from '../../types.ts'

type ProductDetailState = {
  product: Product | null
  productLoading: boolean
  selectedVariantId: string | null
  setSelectedVariantId: (variantId: string | null) => void
  priceHistory: VariantPriceHistory[]
  priceHistoryLoading: boolean
  restockHistory: VariantRestockHistory[]
  restockHistoryLoading: boolean
  periodFrom: string | null
  periodTo: string | null
  setPeriodRange: (from: string | null, to: string | null) => void
}

export function useProductDetail(
  user: User | null,
  productId: string | undefined,
): ProductDetailState {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  )
  const [periodFrom, setPeriodFrom] = useState<string | null>(null)
  const [periodTo, setPeriodTo] = useState<string | null>(null)

  const productQuery = useQuery({
    queryKey: qk.productDetail(user, productId ?? ''),
    queryFn: () => loadProductById(user!, productId!),
    enabled: isSupabaseConfigured && !!user && !!productId,
    staleTime: 15_000,
  })

  const product = productQuery.data ?? null

  const activeVariantId = selectedVariantId ?? product?.variants[0]?.id ?? null

  const priceHistoryQuery = useQuery({
    queryKey: [
      ...qk.variantPriceHistory(user, activeVariantId ?? ''),
      { from: periodFrom, to: periodTo },
    ],
    queryFn: () =>
      loadVariantPriceHistory(
        user!,
        activeVariantId!,
        periodFrom ?? undefined,
        periodTo ?? undefined,
      ),
    enabled: isSupabaseConfigured && !!user && !!activeVariantId,
    staleTime: 15_000,
  })

  const restockHistoryQuery = useQuery({
    queryKey: qk.variantRestockHistory(user, activeVariantId ?? ''),
    queryFn: () => loadVariantRestockHistory(user!, activeVariantId!),
    enabled: isSupabaseConfigured && !!user && !!activeVariantId,
    staleTime: 15_000,
  })

  return {
    product,
    productLoading: productQuery.isLoading,
    selectedVariantId: activeVariantId,
    setSelectedVariantId,
    priceHistory: priceHistoryQuery.data ?? [],
    priceHistoryLoading: priceHistoryQuery.isLoading,
    restockHistory: restockHistoryQuery.data ?? [],
    restockHistoryLoading: restockHistoryQuery.isLoading,
    periodFrom,
    periodTo,
    setPeriodRange: (from, to) => {
      setPeriodFrom(from)
      setPeriodTo(to)
    },
  }
}
