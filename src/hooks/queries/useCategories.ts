import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { loadCategories } from '../../lib/repository.ts'
import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { qk } from '../../lib/queryKeys.ts'

const demoCategories = [
  { id: 'cat1', name: 'Recipientes' },
  { id: 'cat2', name: 'Sets' },
  { id: 'cat3', name: 'Accesorios' },
]

export function useCategoriesQuery(user: User | null) {
  return useQuery({
    queryKey: qk.categories(user),
    queryFn: () => loadCategories(user!),
    placeholderData:
      !isSupabaseConfigured || !user ? demoCategories : undefined,
    enabled: isSupabaseConfigured && !!user,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  })
}
