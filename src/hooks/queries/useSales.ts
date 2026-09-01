import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { loadSalesAggregates } from '../../lib/repository.ts'
import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { qk } from '../../lib/queryKeys.ts'
import type { SalesAggregate } from '../../types.ts'
import { demoOrders, demoProducts } from '../../data/demo.ts'

const variantCost = new Map(
  demoProducts.flatMap((p) => p.variants.map((v) => [v.id, v.inventoryCost])),
)

const demoSales: SalesAggregate[] = demoOrders
  .filter((order) => order.payment === 'Pagado' || order.payment === 'Parcial')
  .map((order) => {
    const total = order.payment === 'Parcial' ? order.paidAmount : order.total
    const cost = (order.itemLines ?? []).reduce(
      (sum, line) =>
        sum + (variantCost.get(line.variantId) ?? 0) * line.quantity,
      0,
    )
    const proportionalCost = order.total > 0 ? (total / order.total) * cost : 0
    return {
      label: order.date.split(',')[0],
      total,
      cost: proportionalCost,
      profit: total - proportionalCost,
      orders: 1,
    }
  })

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
