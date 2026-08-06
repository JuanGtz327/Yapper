import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { loadProducts } from '../../lib/repository.ts'
import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { qk } from '../../lib/queryKeys.ts'
import { demoProducts } from '../../data/demo.ts'

export function useProductsQuery(user: User | null) {
  return useQuery({
    queryKey: qk.products(user),
    queryFn: () => loadProducts(user!),
    placeholderData: !isSupabaseConfigured || !user ? demoProducts : undefined,
    enabled: isSupabaseConfigured && !!user,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  })
}
