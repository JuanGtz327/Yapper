import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { loadProducts, loadProductsPage } from '../../lib/repository.ts'
import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { qk } from '../../lib/queryKeys.ts'
import { demoProducts } from '../../data/demo.ts'
import type { PaginationParams, ProductFilters } from '../../types.ts'

export function useProductsQuery(user: User | null) {
  return useQuery({
    queryKey: qk.products(user),
    queryFn: () => loadProducts(user!),
    placeholderData: !isSupabaseConfigured || !user ? demoProducts : undefined,
    enabled: isSupabaseConfigured && !!user,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
  })
}

export function useProductsPaginatedQuery(
  user: User | null,
  pagination: PaginationParams,
  filters: ProductFilters = {},
) {
  return useQuery({
    queryKey: qk.productsPage(user, pagination, filters),
    queryFn: () => loadProductsPage(user!, pagination, filters),
    placeholderData:
      !isSupabaseConfigured || !user
        ? {
            data: demoProducts.slice(
              (pagination.page - 1) * pagination.pageSize,
              pagination.page * pagination.pageSize,
            ),
            total: demoProducts.length,
            page: pagination.page,
            pageSize: pagination.pageSize,
            totalPages: Math.ceil(demoProducts.length / pagination.pageSize),
          }
        : undefined,
    enabled: isSupabaseConfigured && !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}
