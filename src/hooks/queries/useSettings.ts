import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { loadSettings, defaultSettings } from '../../lib/repository.ts'
import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { qk } from '../../lib/queryKeys.ts'

export function useSettingsQuery(user: User | null) {
  return useQuery({
    queryKey: qk.settings(user),
    queryFn: () => loadSettings(user!),
    placeholderData:
      !isSupabaseConfigured || !user ? defaultSettings : undefined,
    enabled: isSupabaseConfigured && !!user,
    staleTime: 10 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  })
}
