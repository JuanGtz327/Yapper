import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { loadOptionTypes } from '../../lib/repository.ts'
import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { qk } from '../../lib/queryKeys.ts'

const demoOptionTypes = [
  {
    id: 'ot1',
    name: 'Color',
    values: [
      { id: 'ov1', name: 'Negro' },
      { id: 'ov2', name: 'Blanco' },
      { id: 'ov3', name: 'Azul' },
    ],
  },
  {
    id: 'ot2',
    name: 'Talla',
    values: [
      { id: 'ov4', name: 'S' },
      { id: 'ov5', name: 'M' },
      { id: 'ov6', name: 'L' },
      { id: 'ov7', name: 'XL' },
    ],
  },
]

export function useOptionTypesQuery(user: User | null) {
  return useQuery({
    queryKey: qk.optionTypes(user),
    queryFn: () => loadOptionTypes(user!),
    placeholderData:
      !isSupabaseConfigured || !user ? demoOptionTypes : undefined,
    enabled: isSupabaseConfigured && !!user,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  })
}
