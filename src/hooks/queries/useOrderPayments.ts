import { useQuery } from '@tanstack/react-query'
import { loadOrderPayments } from '../../lib/repository.ts'
import { qk } from '../../lib/queryKeys.ts'

export function useOrderPaymentsQuery(orderId: string | null) {
  return useQuery({
    queryKey: orderId ? qk.orderPayments(orderId) : ['orderPayments'],
    queryFn: () => loadOrderPayments(orderId!),
    enabled: !!orderId,
    staleTime: 10_000,
    gcTime: 5 * 60_000,
  })
}
