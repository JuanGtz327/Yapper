import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { loadOrders } from '../../lib/repository.ts'
import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { qk } from '../../lib/queryKeys.ts'
import { demoOrders } from '../../data/demo.ts'

export function useOrdersQuery(user: User | null) {
  return useQuery({
    queryKey: qk.orders(user),
    queryFn: () => loadOrders(user!),
    placeholderData: !isSupabaseConfigured || !user ? demoOrders : undefined,
    enabled: isSupabaseConfigured && !!user,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  })
}
