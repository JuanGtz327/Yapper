import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { queryClient } from '../lib/queryClient.ts'
import { isSupabaseConfigured, supabase } from '../lib/supabase.ts'

export function useAuth(): {
  user: User | null
  authLoading: boolean
  signOut: () => Promise<void>
} {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let active = true
    let generation = 1
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        generation += 1
        if (event === 'SIGNED_OUT') queryClient.clear()
        if (active) {
          setUser(session?.user ?? null)
          setAuthLoading(false)
        }
      },
    )
    const currentGeneration = generation
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active && generation === currentGeneration) {
          setUser(data.session?.user ?? null)
          setAuthLoading(false)
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active && generation === currentGeneration) setAuthLoading(false)
      })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut()
    queryClient.clear()
  }

  return { user, authLoading, signOut }
}
