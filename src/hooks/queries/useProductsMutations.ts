import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import {
  createProduct,
  createProductWithVariants,
  updateProduct,
  deleteProduct,
  type VariantInput,
} from '../../lib/repository.ts'
import { qk } from '../../lib/queryKeys.ts'
import type { Product } from '../../types.ts'

export function useProductsMutations(user: User | null) {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: ({
      product,
      defaultVariant,
    }: {
      product: Omit<Product, 'id'>
      defaultVariant?: {
        sku: string
        inventoryCost: number
        salePrice: number
        stock: number
        optionValueIds: string[]
      }
    }) =>
      user
        ? createProduct(user, product, defaultVariant)
        : Promise.resolve({ ...product, id: `p${Date.now()}` } as Product),
    onSuccess: (saved) => {
      qc.setQueryData<Product[]>(qk.products(user), (current) => [
        ...(current ?? []),
        saved,
      ])
    },
  })

  const createWithVariants = useMutation({
    mutationFn: ({
      product,
      variants,
    }: {
      product: {
        name: string
        categoryId: string | null
        published: boolean
        publicDescription: string
        imageUrl: string | null
      }
      variants: VariantInput[]
    }) =>
      user
        ? createProductWithVariants(user, product, variants)
        : Promise.resolve({
            ...product,
            id: `p${Date.now()}`,
            category: 'General',
            color: 'sky',
            variants: variants.map((v, i) => ({
              id: `v${Date.now()}-${i}`,
              productId: `p${Date.now()}`,
              ...v,
              optionValues: [],
            })),
          } as Product),
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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.products(user) })
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

  return { create, createWithVariants, update, remove }
}
