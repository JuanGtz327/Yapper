/**
 * repository.test.ts — Bug fix tests for updateProduct
 *
 * Bug: updateProduct sends stale first-variant data (p_sku, p_variant_name,
 * p_inventory_cost, p_sale_price, p_stock) to the update_product_atomic RPC,
 * which can revert variant edits when the product metadata is saved.
 *
 * Fix: updateProduct should only send product metadata, NOT variant data.
 * Variants are managed separately via updateVariant / createVariant / deleteVariant.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Product } from '../../types.ts'

// ─── Mock de Supabase ────────────────────────────────────────

const mockRpc = vi.fn()

vi.mock('../supabase.ts', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}))

// ─── Datos de prueba ─────────────────────────────────────────

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    name: 'Playera Básica',
    category: 'Ropa',
    categoryId: 'cat1',
    published: true,
    publicDescription: '',
    imageUrl: null,
    color: 'sky',
    variants: [
      {
        id: 'v1',
        productId: 'p1',
        sku: 'PLA-001',
        name: 'Negro',
        inventoryCost: 80,
        salePrice: 150,
        stock: 25,
        optionValues: [],
      },
    ],
    ...overrides,
  }
}

// ─── Tests ───────────────────────────────────────────────────

describe('updateProduct — bug fix: no enviar datos de variante al RPC', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ data: null, error: null })
  })

  it('debería llamar al RPC con solo metadatos del producto (sin datos de variante)', async () => {
    const product = makeProduct()

    const { updateProduct } = await import('../repository.ts')
    await updateProduct(product)

    expect(mockRpc).toHaveBeenCalledTimes(1)
    expect(mockRpc).toHaveBeenCalledWith('update_product_atomic', {
      p_product_id: 'p1',
      p_name: 'Playera Básica',
      p_category_id: 'cat1',
      p_published: true,
      p_public_description: '',
      p_image_url: null,
    })
  })

  it('NO debería enviar p_sku al RPC', async () => {
    const product = makeProduct()

    const { updateProduct } = await import('../repository.ts')
    await updateProduct(product)

    const rpcParams = mockRpc.mock.calls[0][1]
    expect(rpcParams).not.toHaveProperty('p_sku')
  })

  it('NO debería enviar p_variant_name al RPC', async () => {
    const product = makeProduct()

    const { updateProduct } = await import('../repository.ts')
    await updateProduct(product)

    const rpcParams = mockRpc.mock.calls[0][1]
    expect(rpcParams).not.toHaveProperty('p_variant_name')
  })

  it('NO debería enviar p_inventory_cost al RPC', async () => {
    const product = makeProduct()

    const { updateProduct } = await import('../repository.ts')
    await updateProduct(product)

    const rpcParams = mockRpc.mock.calls[0][1]
    expect(rpcParams).not.toHaveProperty('p_inventory_cost')
  })

  it('NO debería enviar p_sale_price al RPC', async () => {
    const product = makeProduct()

    const { updateProduct } = await import('../repository.ts')
    await updateProduct(product)

    const rpcParams = mockRpc.mock.calls[0][1]
    expect(rpcParams).not.toHaveProperty('p_sale_price')
  })

  it('NO debería enviar p_stock al RPC', async () => {
    const product = makeProduct()

    const { updateProduct } = await import('../repository.ts')
    await updateProduct(product)

    const rpcParams = mockRpc.mock.calls[0][1]
    expect(rpcParams).not.toHaveProperty('p_stock')
  })

  it('NO debería enviar ningún parámetro de variante aunque el producto tenga datos de variante con valores', async () => {
    const productWithStaleVariants = makeProduct({
      variants: [
        {
          id: 'v1',
          productId: 'p1',
          sku: 'PLA-001-STALE',
          name: 'Negro Stale',
          inventoryCost: 999,
          salePrice: 999,
          stock: 999,
          optionValues: [{ optionType: 'Color', value: 'Negro' }],
        },
      ],
    })

    const { updateProduct } = await import('../repository.ts')
    await updateProduct(productWithStaleVariants)

    const rpcParams = mockRpc.mock.calls[0][1]
    // Ningún parámetro de variante debería estar presente
    const variantKeys = [
      'p_sku',
      'p_variant_name',
      'p_inventory_cost',
      'p_sale_price',
      'p_stock',
    ]
    for (const key of variantKeys) {
      expect(rpcParams).not.toHaveProperty(key)
    }
    // Solo metadatos del producto
    expect(Object.keys(rpcParams)).toEqual([
      'p_product_id',
      'p_name',
      'p_category_id',
      'p_published',
      'p_public_description',
      'p_image_url',
    ])
  })

  it('debería manejar producto sin variantes sin error', async () => {
    const product = makeProduct({ variants: [] })

    const { updateProduct } = await import('../repository.ts')
    await expect(updateProduct(product)).resolves.toBeUndefined()

    expect(mockRpc).toHaveBeenCalledWith('update_product_atomic', {
      p_product_id: 'p1',
      p_name: 'Playera Básica',
      p_category_id: 'cat1',
      p_published: true,
      p_public_description: '',
      p_image_url: null,
    })
  })

  it('debería manejar categoryId null correctamente', async () => {
    const product = makeProduct({ categoryId: null })

    const { updateProduct } = await import('../repository.ts')
    await updateProduct(product)

    const rpcParams = mockRpc.mock.calls[0][1]
    expect(rpcParams.p_category_id).toBeNull()
  })

  it('debería propagar errores del RPC', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'Product not found' },
    })

    const { updateProduct } = await import('../repository.ts')
    await expect(updateProduct(makeProduct())).rejects.toThrow(
      'Product not found',
    )
  })
})

describe('updateVariant — no debería ser afectado por el fix', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRpc.mockResolvedValue({ data: null, error: null })
  })

  it('debería enviar todos los parámetros de variante al RPC update_variant', async () => {
    const variantData = {
      sku: 'PLA-001-NEW',
      name: 'Negro Actualizado',
      inventoryCost: 90,
      salePrice: 180,
      stock: 30,
      optionValueIds: ['ov1'],
    }

    const { updateVariant } = await import('../repository.ts')
    await updateVariant('v1', variantData)

    expect(mockRpc).toHaveBeenCalledWith('update_variant', {
      p_variant_id: 'v1',
      p_sku: 'PLA-001-NEW',
      p_variant_name: 'Negro Actualizado',
      p_inventory_cost: 90,
      p_sale_price: 180,
      p_stock: 30,
      p_option_value_ids: ['ov1'],
    })
  })
})
