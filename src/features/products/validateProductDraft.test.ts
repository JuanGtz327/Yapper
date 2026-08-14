import { describe, it, expect } from 'vitest'
import {
  validateProductDraft,
  type ProductDraft,
} from './validateProductDraft.ts'

function validDraft(overrides: Partial<ProductDraft> = {}): ProductDraft {
  return {
    name: 'Playera Básica',
    categoryId: null,
    published: false,
    publicDescription: '',
    imageUrl: '',
    variants: [
      {
        sku: 'PLA-BAS-001',
        name: '',
        inventoryCost: 80,
        salePrice: 150,
        stock: 25,
        optionValueIds: [],
      },
    ],
    ...overrides,
  }
}

describe('validateProductDraft', () => {
  describe('nombre', () => {
    it('debería aceptar nombre válido', () => {
      const result = validateProductDraft(validDraft())
      expect(result.ok).toBe(true)
    })

    it('debería rechazar nombre vacío', () => {
      const result = validateProductDraft(validDraft({ name: '' }))
      expect(result.ok).toBe(false)
      expect(result.errors.name).toBeDefined()
    })

    it('debería rechazar nombre de 1 carácter', () => {
      const result = validateProductDraft(validDraft({ name: 'A' }))
      expect(result.ok).toBe(false)
      expect(result.errors.name).toBeDefined()
    })

    it('debería aceptar nombre de 2 caracteres', () => {
      const result = validateProductDraft(validDraft({ name: 'AB' }))
      expect(result.ok).toBe(true)
    })

    it('debería aceptar nombre de 120 caracteres', () => {
      const result = validateProductDraft(validDraft({ name: 'A'.repeat(120) }))
      expect(result.ok).toBe(true)
    })

    it('debería rechazar nombre de 121 caracteres', () => {
      const result = validateProductDraft(validDraft({ name: 'A'.repeat(121) }))
      expect(result.ok).toBe(false)
      expect(result.errors.name).toBeDefined()
    })

    it('debería recortar espacios al validar nombre', () => {
      const result = validateProductDraft(validDraft({ name: '  A  ' }))
      expect(result.ok).toBe(false)
    })
  })

  describe('variantes', () => {
    it('debería rechazar draft sin variantes', () => {
      const result = validateProductDraft(validDraft({ variants: [] }))
      expect(result.ok).toBe(false)
      expect(result.errors.variants).toBeDefined()
    })

    it('debería aceptar una variante válida', () => {
      const result = validateProductDraft(validDraft())
      expect(result.ok).toBe(true)
    })

    it('debería rechazar variante sin SKU', () => {
      const result = validateProductDraft(
        validDraft({
          variants: [
            {
              sku: '',
              name: '',
              inventoryCost: 0,
              salePrice: 100,
              stock: 10,
              optionValueIds: [],
            },
          ],
        }),
      )
      expect(result.ok).toBe(false)
      expect(result.errors.variant_0_sku).toBeDefined()
    })

    it('debería rechazar SKU de más de 40 caracteres', () => {
      const result = validateProductDraft(
        validDraft({
          variants: [
            {
              sku: 'A'.repeat(41),
              name: '',
              inventoryCost: 0,
              salePrice: 100,
              stock: 10,
              optionValueIds: [],
            },
          ],
        }),
      )
      expect(result.ok).toBe(false)
      expect(result.errors.variant_0_sku).toBeDefined()
    })

    it('debería aceptar SKU de 40 caracteres', () => {
      const result = validateProductDraft(
        validDraft({
          variants: [
            {
              sku: 'A'.repeat(40),
              name: '',
              inventoryCost: 0,
              salePrice: 100,
              stock: 10,
              optionValueIds: [],
            },
          ],
        }),
      )
      expect(result.ok).toBe(true)
    })

    it('debería rechazar precio negativo', () => {
      const result = validateProductDraft(
        validDraft({
          variants: [
            {
              sku: 'TEST',
              name: '',
              inventoryCost: 0,
              salePrice: -1,
              stock: 10,
              optionValueIds: [],
            },
          ],
        }),
      )
      expect(result.ok).toBe(false)
      expect(result.errors.variant_0_salePrice).toBeDefined()
    })

    it('debería aceptar precio cero', () => {
      const result = validateProductDraft(
        validDraft({
          variants: [
            {
              sku: 'TEST',
              name: '',
              inventoryCost: 0,
              salePrice: 0,
              stock: 10,
              optionValueIds: [],
            },
          ],
        }),
      )
      expect(result.ok).toBe(true)
    })

    it('debería rechazar stock negativo', () => {
      const result = validateProductDraft(
        validDraft({
          variants: [
            {
              sku: 'TEST',
              name: '',
              inventoryCost: 0,
              salePrice: 100,
              stock: -1,
              optionValueIds: [],
            },
          ],
        }),
      )
      expect(result.ok).toBe(false)
      expect(result.errors.variant_0_stock).toBeDefined()
    })

    it('debería rechazar stock no entero', () => {
      const result = validateProductDraft(
        validDraft({
          variants: [
            {
              sku: 'TEST',
              name: '',
              inventoryCost: 0,
              salePrice: 100,
              stock: 1.5,
              optionValueIds: [],
            },
          ],
        }),
      )
      expect(result.ok).toBe(false)
      expect(result.errors.variant_0_stock).toBeDefined()
    })

    it('debería rechazar SKU duplicado entre variantes', () => {
      const result = validateProductDraft(
        validDraft({
          variants: [
            {
              sku: 'DUP',
              name: '',
              inventoryCost: 0,
              salePrice: 100,
              stock: 10,
              optionValueIds: [],
            },
            {
              sku: 'dup',
              name: '',
              inventoryCost: 0,
              salePrice: 100,
              stock: 10,
              optionValueIds: [],
            },
          ],
        }),
      )
      expect(result.ok).toBe(false)
      expect(result.errors.variant_1_sku).toBeDefined()
    })

    it('debería aceptar variantes con SKU diferente', () => {
      const result = validateProductDraft(
        validDraft({
          variants: [
            {
              sku: 'AAA',
              name: '',
              inventoryCost: 0,
              salePrice: 100,
              stock: 10,
              optionValueIds: [],
            },
            {
              sku: 'BBB',
              name: '',
              inventoryCost: 0,
              salePrice: 100,
              stock: 10,
              optionValueIds: [],
            },
          ],
        }),
      )
      expect(result.ok).toBe(true)
    })

    it('debería rechazar costo negativo', () => {
      const result = validateProductDraft(
        validDraft({
          variants: [
            {
              sku: 'TEST',
              name: '',
              inventoryCost: -5,
              salePrice: 100,
              stock: 10,
              optionValueIds: [],
            },
          ],
        }),
      )
      expect(result.ok).toBe(false)
      expect(result.errors.variant_0_inventoryCost).toBeDefined()
    })
  })

  describe('imagen', () => {
    it('debería aceptar URL HTTPS válida', () => {
      const result = validateProductDraft(
        validDraft({
          imageUrl: 'https://example.com/image.jpg',
        }),
      )
      expect(result.ok).toBe(true)
    })

    it('debería rechazar URL HTTP', () => {
      const result = validateProductDraft(
        validDraft({
          imageUrl: 'http://example.com/image.jpg',
        }),
      )
      expect(result.ok).toBe(false)
      expect(result.errors.imageUrl).toBeDefined()
    })

    it('debería aceptar URL vacía', () => {
      const result = validateProductDraft(validDraft({ imageUrl: '' }))
      expect(result.ok).toBe(true)
    })

    it('debería rechazar URL no válida', () => {
      const result = validateProductDraft(validDraft({ imageUrl: 'not-a-url' }))
      expect(result.ok).toBe(false)
      expect(result.errors.imageUrl).toBeDefined()
    })
  })

  describe('descripción pública', () => {
    it('debería aceptar descripción de 240 caracteres', () => {
      const result = validateProductDraft(
        validDraft({ publicDescription: 'A'.repeat(240) }),
      )
      expect(result.ok).toBe(true)
    })

    it('debería rechazar descripción de 241 caracteres', () => {
      const result = validateProductDraft(
        validDraft({ publicDescription: 'A'.repeat(241) }),
      )
      expect(result.ok).toBe(false)
      expect(result.errors.publicDescription).toBeDefined()
    })
  })
})
