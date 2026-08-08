import { isSafeImageUrl } from '../../lib/security.ts'

export type VariantDraft = {
  id?: string
  sku: string
  name: string
  inventoryCost: number
  salePrice: number
  stock: number
  optionValueIds: string[]
}

export type ProductDraft = {
  name: string
  categoryId: string | null
  published: boolean
  publicDescription: string
  imageUrl: string
  variants: VariantDraft[]
}

type FieldErrors = Record<string, string>

export function validateProductDraft(draft: ProductDraft): {
  ok: boolean
  errors: FieldErrors
} {
  const errors: FieldErrors = {}

  const name = draft.name.trim()
  if (name.length < 2 || name.length > 120) {
    errors.name = 'El nombre debe tener entre 2 y 120 caracteres.'
  }

  if (draft.publicDescription.length > 240) {
    errors.publicDescription = 'La descripción no puede exceder 240 caracteres.'
  }

  const imageUrl = draft.imageUrl.trim()
  if (imageUrl && !isSafeImageUrl(imageUrl)) {
    errors.imageUrl = 'La imagen debe usar una URL HTTPS válida.'
  }

  if (draft.variants.length === 0) {
    errors.variants = 'Agrega al menos una variante.'
  }

  const seenSkus = new Set<string>()
  draft.variants.forEach((variant, index) => {
    const prefix = `variant_${index}`
    const sku = variant.sku.trim()

    if (!sku) {
      errors[`${prefix}_sku`] = 'El SKU es obligatorio.'
    } else if (sku.length > 40) {
      errors[`${prefix}_sku`] = 'El SKU no puede exceder 40 caracteres.'
    } else {
      const lower = sku.toLowerCase()
      if (seenSkus.has(lower)) {
        errors[`${prefix}_sku`] = 'SKU duplicado.'
      }
      seenSkus.add(lower)
    }

    if (!Number.isFinite(variant.salePrice) || variant.salePrice < 0) {
      errors[`${prefix}_salePrice`] =
        'Introduce un precio de venta válido mayor o igual a cero.'
    }

    if (
      !Number.isFinite(variant.inventoryCost) ||
      variant.inventoryCost < 0
    ) {
      errors[`${prefix}_inventoryCost`] =
        'El costo debe ser un número mayor o igual a cero.'
    }

    if (!Number.isInteger(variant.stock) || variant.stock < 0) {
      errors[`${prefix}_stock`] =
        'Las existencias deben ser un número entero no negativo.'
    }
  })

  return { ok: Object.keys(errors).length === 0, errors }
}
