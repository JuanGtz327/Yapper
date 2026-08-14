import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { QueryClient } from '@tanstack/react-query'
import type { Product } from '../types.ts'
import { useProductsMutations } from './queries/useProductsMutations.ts'
import {
  createVariant,
  updateVariant,
  deleteVariant,
} from '../lib/repository.ts'
import { useToast, toastMessages } from './useToast.ts'
import { qk } from '../lib/queryKeys.ts'
import type { ProductDraft } from '../features/products/validateProductDraft.ts'

type ProductEditorState = {
  mode: 'create' | 'edit'
  product: Product | null
}

export function useProductEditor(user: User | null, qc: QueryClient) {
  const [productEditor, setProductEditor] = useState<ProductEditorState | null>(
    null,
  )
  const productMutations = useProductsMutations(user)
  const toast = useToast()

  const openProductEditor = (product?: Product) => {
    setProductEditor({
      mode: product ? 'edit' : 'create',
      product: product ?? null,
    })
  }

  const handleProductSubmit = async (draft: ProductDraft): Promise<boolean> => {
    if (productEditor?.mode === 'edit' && productEditor.product) {
      try {
        await productMutations.update.mutateAsync({
          ...productEditor.product,
          name: draft.name,
          categoryId: draft.categoryId,
          published: draft.published,
          publicDescription: draft.publicDescription,
          imageUrl: draft.imageUrl || null,
        })
        const existingVariants = productEditor.product.variants

        for (const existing of existingVariants) {
          if (!draft.variants.some((v) => v.id === existing.id)) {
            await deleteVariant(existing.id)
          }
        }

        for (const v of draft.variants) {
          if (v.id && !v.id.startsWith('pending-')) {
            await updateVariant(v.id, {
              sku: v.sku,
              name: v.name,
              inventoryCost: v.inventoryCost,
              salePrice: v.salePrice,
              stock: v.stock,
              optionValueIds: v.optionValueIds,
            })
          } else {
            await createVariant(productEditor.product.id, {
              sku: v.sku,
              name: v.name,
              inventoryCost: v.inventoryCost,
              salePrice: v.salePrice,
              stock: v.stock,
              optionValueIds: v.optionValueIds,
            })
          }
        }
        toast.success(toastMessages.product.updated)
        void qc.invalidateQueries({ queryKey: qk.products(user) })
        return true
      } catch {
        toast.error('No pudimos guardar el producto. Inténtalo de nuevo.')
        return false
      }
    }

    try {
      await productMutations.createWithVariants.mutateAsync({
        product: {
          name: draft.name,
          categoryId: draft.categoryId,
          published: draft.published,
          publicDescription: draft.publicDescription,
          imageUrl: draft.imageUrl || null,
        },
        variants: draft.variants.map((v) => ({
          sku: v.sku,
          name: v.name,
          inventoryCost: v.inventoryCost,
          salePrice: v.salePrice,
          stock: v.stock,
          optionValueIds: v.optionValueIds,
        })),
      })
      toast.success(toastMessages.product.created)
      setProductEditor(null)
      return true
    } catch {
      toast.error('No pudimos guardar el producto. Inténtalo de nuevo.')
      return false
    }
  }

  const handleVariantsChanged = () => {
    void qc.invalidateQueries({ queryKey: qk.products(user) }).then(() => {
      if (productEditor?.product) {
        const freshProducts = qc.getQueryData<Product[]>(qk.products(user))
        if (freshProducts) {
          const freshProduct = freshProducts.find(
            (p) => p.id === productEditor.product!.id,
          )
          if (freshProduct) {
            setProductEditor({ ...productEditor, product: freshProduct })
          }
        }
      }
    })
  }

  return {
    productEditor,
    openProductEditor,
    closeProductEditor: () => setProductEditor(null),
    handleProductSubmit,
    handleVariantsChanged,
  }
}
