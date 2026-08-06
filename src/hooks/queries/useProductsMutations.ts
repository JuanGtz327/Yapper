import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import {
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../lib/repository.ts'
import { qk } from '../../lib/queryKeys.ts'
import type { Product } from '../../types.ts'

export function useProductsMutations(user: User | null) {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: (product: Product) =>
      user ? createProduct(user, product) : Promise.resolve(product),
    onSuccess: (saved) => {
      qc.setQueryData<Product[]>(qk.products(user), (current) => [
        ...(current ?? []),
        saved,
      ])
    },
  })

  const update = useMutation({
    mutationFn: (product: Product) =>
      user ? updateProduct(product) : Promise.resolve(),
    onSuccess: (_data, product) => {
      qc.setQueryData<Product[]>(qk.products(user), (current) =>
        (current ?? []).map((p) => (p.id === product.id ? product : p)),
      )
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => (user ? deleteProduct(id) : Promise.resolve()),
    onSuccess: (_data, id) => {
      qc.setQueryData<Product[]>(qk.products(user), (current) =>
        (current ?? []).filter((p) => p.id !== id),
      )
    },
  })

  return { create, update, remove }
}
