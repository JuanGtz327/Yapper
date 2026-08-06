import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import { saveSettings } from '../../lib/repository.ts'
import { qk } from '../../lib/queryKeys.ts'
import type { BusinessSettings } from '../../types.ts'

export function useSettingsMutation(user: User | null) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: (settings: BusinessSettings) =>
      user ? saveSettings(user, settings) : Promise.resolve(settings),
    onSuccess: (saved) => {
      qc.setQueryData<BusinessSettings>(qk.settings(user), saved)
    },
  })
}
