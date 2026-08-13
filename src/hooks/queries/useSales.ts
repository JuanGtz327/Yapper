import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { loadSalesAggregates } from '../../lib/repository.ts'
import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { qk } from '../../lib/queryKeys.ts'
import type { SalesAggregate } from '../../types.ts'
import { demoOrders } from '../../data/demo.ts'

const demoSales: SalesAggregate[] = demoOrders
  .filter((order) => order.payment === 'Pagado' || order.payment === 'Parcial')
  .map((order) => ({
    label: order.date.split(',')[0],
    total: order.payment === 'Parcial' ? order.paidAmount : order.total,
    orders: 1,
  }))

export function useSalesQuery(
  user: User | null,
  period: '7d' | '6m',
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true
  return useQuery({
    queryKey: qk.sales(user, period),
    queryFn: () => loadSalesAggregates(period),
    placeholderData: !isSupabaseConfigured || !user ? demoSales : undefined,
    enabled:
      (isSupabaseConfigured && !!user) || (!isSupabaseConfigured && enabled),
    staleTime: period === '7d' ? 30_000 : 5 * 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: period === '7d',
  })
}
