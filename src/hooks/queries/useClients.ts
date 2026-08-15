import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { loadClients, loadClientsPage } from '../../lib/repository.ts'
import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { qk } from '../../lib/queryKeys.ts'
import { demoClients } from '../../data/demo.ts'
import type { ClientFilters, PaginationParams } from '../../types.ts'

export function useClientsQuery(user: User | null) {
  return useQuery({
    queryKey: qk.clients(user),
    queryFn: () => loadClients(user!),
    placeholderData: !isSupabaseConfigured || !user ? demoClients : undefined,
    enabled: isSupabaseConfigured && !!user,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}

export function useClientsPaginatedQuery(
  user: User | null,
  pagination: PaginationParams,
  filters: ClientFilters = {},
) {
  return useQuery({
    queryKey: qk.clientsPage(user, pagination, filters),
    queryFn: () => loadClientsPage(user!, pagination, filters),
    placeholderData:
      !isSupabaseConfigured || !user
        ? {
            data: demoClients.slice(
              (pagination.page - 1) * pagination.pageSize,
              pagination.page * pagination.pageSize,
            ),
            total: demoClients.length,
            page: pagination.page,
            pageSize: pagination.pageSize,
            totalPages: Math.ceil(demoClients.length / pagination.pageSize),
          }
        : undefined,
    enabled: isSupabaseConfigured && !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}
