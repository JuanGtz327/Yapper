import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import {
  createClient,
  updateClient,
  deleteClient,
} from '../../lib/repository.ts'
import { qk } from '../../lib/queryKeys.ts'
import type { Client } from '../../types.ts'

export function useClientsMutations(user: User | null) {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (client: Client) =>
      user ? createClient(user, client) : Promise.resolve(client),
    onSuccess: (saved) => {
      qc.setQueryData<Client[]>(qk.clients(user), (current) => [
        ...(current ?? []),
        saved,
      ])
      void qc.invalidateQueries({ queryKey: qk.clients(user) })
    },
  })

  const update = useMutation({
    mutationFn: (client: Client) =>
      user ? updateClient(client) : Promise.resolve(),
    onSuccess: (_data, client) => {
      qc.setQueryData<Client[]>(qk.clients(user), (current) =>
        (current ?? []).map((c) => (c.id === client.id ? client : c)),
      )
      void qc.invalidateQueries({ queryKey: qk.clients(user) })
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => (user ? deleteClient(id) : Promise.resolve()),
    onSuccess: (_data, id) => {
      qc.setQueryData<Client[]>(qk.clients(user), (current) =>
        (current ?? []).filter((c) => c.id !== id),
      )
      void qc.invalidateQueries({ queryKey: qk.clients(user) })
    },
  })

  return { create, update, remove }
}
