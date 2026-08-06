import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { loadClients } from '../../lib/repository.ts'
import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { qk } from '../../lib/queryKeys.ts'
import { demoClients } from '../../data/demo.ts'

export function useClientsQuery(user: User | null) {
  return useQuery({
    queryKey: qk.clients(user),
    queryFn: () => loadClients(user!),
    placeholderData: !isSupabaseConfigured || !user ? demoClients : undefined,
    enabled: isSupabaseConfigured && !!user,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  })
}
