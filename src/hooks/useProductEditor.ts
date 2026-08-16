import { useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { QueryClient } from '@tanstack/react-query'
import type { Product } from '../types.ts'
import { useProductsMutations } from './queries/useProductsMutations.ts'
import {
  createVariant,
  updateVariant,
  updateVariantPrice,
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

  const handleProductSubmit = async (
    draft: ProductDraft,
    productOverride?: Product | null,
  ): Promise<boolean> => {
    const editingProduct = productEditor?.product ?? productOverride ?? null
    if (editingProduct) {
      try {
        await productMutations.update.mutateAsync({
          ...editingProduct,
          name: draft.name,
          categoryId: draft.categoryId,
          published: draft.published,
          publicDescription: draft.publicDescription,
          imageUrl: draft.imageUrl || null,
        })
        const existingVariants = editingProduct.variants

        for (const existing of existingVariants) {
          if (!draft.variants.some((v) => v.id === existing.id)) {
            await deleteVariant(existing.id)
          }
        }

        for (const v of draft.variants) {
          if (v.id && !v.id.startsWith('pending-')) {
            const existing = existingVariants.find((item) => item.id === v.id)
            const onlyPriceChanged =
              existing &&
              existing.sku === v.sku &&
              existing.name === v.name &&
              existing.inventoryCost === v.inventoryCost &&
              existing.stock === v.stock &&
              existing.salePrice !== v.salePrice
            if (onlyPriceChanged) {
              await updateVariantPrice(v.id, v.salePrice)
            } else {
              await updateVariant(v.id, {
                sku: v.sku,
                name: v.name,
                inventoryCost: v.inventoryCost,
                salePrice: v.salePrice,
                stock: v.stock,
                optionValueIds: v.optionValueIds,
              })
            }
          } else {
            await createVariant(editingProduct.id, {
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
      } catch (error: any) {
        if (error?.code === '23505') {
          toast.error(
            'Ya existe otra variante con ese SKU. Usa un SKU diferente.',
          )
        } else {
          toast.error('No pudimos guardar el producto. Inténtalo de nuevo.')
        }
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
    } catch (error: any) {
      if (error?.code === '23505') {
        toast.error(
          'Ya existe otra variante con ese SKU. Usa un SKU diferente.',
        )
      } else {
        toast.error('No pudimos guardar el producto. Inténtalo de nuevo.')
      }
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
