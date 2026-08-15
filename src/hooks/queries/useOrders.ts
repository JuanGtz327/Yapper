import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { loadOrders, loadOrdersPage } from '../../lib/repository.ts'
import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { qk } from '../../lib/queryKeys.ts'
import { demoOrders } from '../../data/demo.ts'
import type { OrderFilters, PaginationParams } from '../../types.ts'

export function useOrdersQuery(user: User | null) {
  return useQuery({
    queryKey: qk.orders(user),
    queryFn: () => loadOrders(user!),
    placeholderData: !isSupabaseConfigured || !user ? demoOrders : undefined,
    enabled: isSupabaseConfigured && !!user,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
  })
}

export function useOrdersPaginatedQuery(
  user: User | null,
  pagination: PaginationParams,
  filters: OrderFilters = {},
) {
  return useQuery({
    queryKey: qk.ordersPage(user, pagination, filters),
    queryFn: () => loadOrdersPage(user!, pagination, filters),
    placeholderData:
      !isSupabaseConfigured || !user
        ? {
            data: demoOrders.slice(
              (pagination.page - 1) * pagination.pageSize,
              pagination.page * pagination.pageSize,
            ),
            total: demoOrders.length,
            page: pagination.page,
            pageSize: pagination.pageSize,
            totalPages: Math.ceil(demoOrders.length / pagination.pageSize),
          }
        : undefined,
    enabled: isSupabaseConfigured && !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}
