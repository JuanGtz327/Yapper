import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProductEditor } from './useProductEditor'
import * as repository from '../lib/repository.ts'
import type { User } from '@supabase/supabase-js'
import type { ReactNode } from 'react'
import type { Product } from '../types.ts'
import type { ProductDraft } from '../features/products/validateProductDraft.ts'

vi.mock('../lib/repository.ts', () => ({
  createProduct: vi.fn(),
  createProductWithVariants: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  createVariant: vi.fn(),
  updateVariant: vi.fn(),
  updateVariantPrice: vi.fn(),
  deleteVariant: vi.fn(),
}))

const mockToast = { success: vi.fn(), error: vi.fn() }
vi.mock('./useToast.ts', () => ({
  useToast: () => mockToast,
  toastMessages: {
    product: { updated: 'Producto actualizado', created: 'Producto creado' },
    variant: {
      updated: 'Variante actualizada',
      created: 'Variante creada',
      deleted: 'Variante eliminada',
    },
  },
}))

const mockUser = { id: 'user-1', email: 'test@example.com' } as User

const existingProduct: Product = {
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
      sku: 'PLA-BAS-NEG',
      name: 'Negro',
      inventoryCost: 80,
      salePrice: 150,
      stock: 25,
      optionValues: [],
    },
  ],
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  queryClient.setQueryData(
    ['users', mockUser.id, 'products'],
    [existingProduct],
  )
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useProductEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(repository.updateProduct).mockResolvedValue(undefined)
    vi.mocked(repository.updateVariant).mockResolvedValue(undefined)
    vi.mocked(repository.updateVariantPrice).mockResolvedValue(undefined)
    vi.mocked(repository.createVariant).mockResolvedValue('new-v')
    vi.mocked(repository.deleteVariant).mockResolvedValue(undefined)
  })

  describe('Error 23505: SKU duplicado', () => {
    it('debería actualizar el producto recibido aunque no se haya abierto el editor', async () => {
      const draft: ProductDraft = {
        name: 'Playera actualizada',
        categoryId: existingProduct.categoryId,
        published: existingProduct.published,
        publicDescription: existingProduct.publicDescription,
        imageUrl: '',
        variants: [
          {
            id: 'v1',
            sku: 'PLA-BAS-NEG',
            name: 'Negro',
            inventoryCost: 80,
            salePrice: 150,
            stock: 25,
            optionValueIds: [],
          },
        ],
      }

      const { result } = renderHook(
        () => useProductEditor(mockUser, { invalidateQueries: vi.fn() } as any),
        { wrapper: createWrapper() },
      )

      await act(async () => {
        expect(
          await result.current.handleProductSubmit(draft, existingProduct),
        ).toBe(true)
      })

      expect(repository.updateProduct).toHaveBeenCalled()
      expect(repository.createProductWithVariants).not.toHaveBeenCalled()
    })

    it('debería actualizar solo el precio sin reescribir el SKU', async () => {
      const duplicateError = Object.assign(
        new Error('duplicate key value violates unique constraint'),
        { code: '23505' },
      )
      vi.mocked(repository.updateVariant).mockRejectedValue(duplicateError)

      const { result } = renderHook(
        () => useProductEditor(mockUser, { invalidateQueries: vi.fn() } as any),
        { wrapper: createWrapper() },
      )
      act(() => result.current.openProductEditor(existingProduct))

      const draft: ProductDraft = {
        name: existingProduct.name,
        categoryId: existingProduct.categoryId,
        published: existingProduct.published,
        publicDescription: existingProduct.publicDescription,
        imageUrl: '',
        variants: [
          {
            id: 'v1',
            sku: 'PLA-BAS-NEG',
            name: 'Negro',
            inventoryCost: 80,
            salePrice: 175,
            stock: 25,
            optionValueIds: [],
          },
        ],
      }

      await act(async () => {
        expect(await result.current.handleProductSubmit(draft)).toBe(true)
      })

      expect(repository.updateVariantPrice).toHaveBeenCalledWith('v1', 175)
      expect(repository.updateVariant).not.toHaveBeenCalled()
    })

    it('debería mostrar error de SKU duplicado cuando updateVariant falla con 23505', async () => {
      const duplicateError = Object.assign(
        new Error(
          'duplicate key value violates unique constraint "product_variants_user_sku_idx"',
        ),
        { code: '23505' },
      )
      vi.mocked(repository.updateVariant).mockRejectedValue(duplicateError)

      const { result } = renderHook(
        () => useProductEditor(mockUser, { invalidateQueries: vi.fn() } as any),
        { wrapper: createWrapper() },
      )

      act(() => {
        result.current.openProductEditor(existingProduct)
      })

      await waitFor(() => {
        expect(result.current.productEditor).not.toBeNull()
      })

      const draft: ProductDraft = {
        name: 'Playera Básica',
        categoryId: 'cat1',
        published: true,
        publicDescription: '',
        imageUrl: '',
        variants: [
          {
            id: 'v1',
            sku: 'PLA-BAS-NEG',
            name: 'Negro',
            inventoryCost: 80,
            salePrice: 150,
            stock: 25,
            optionValueIds: [],
          },
        ],
      }

      let returned: boolean = false
      await act(async () => {
        returned = await result.current.handleProductSubmit(draft)
      })

      expect(returned).toBe(false)
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('SKU'),
      )
      expect(mockToast.error).not.toHaveBeenCalledWith(
        expect.stringContaining('No pudimos guardar'),
      )
    })

    it('debería mostrar error de SKU duplicado cuando createVariant falla con 23505', async () => {
      const duplicateError = Object.assign(
        new Error('duplicate key value violates unique constraint'),
        { code: '23505' },
      )
      vi.mocked(repository.createVariant).mockRejectedValue(duplicateError)

      const { result } = renderHook(
        () => useProductEditor(mockUser, { invalidateQueries: vi.fn() } as any),
        { wrapper: createWrapper() },
      )

      act(() => {
        result.current.openProductEditor(existingProduct)
      })

      await waitFor(() => {
        expect(result.current.productEditor).not.toBeNull()
      })

      const draft: ProductDraft = {
        name: 'Playera Básica',
        categoryId: 'cat1',
        published: true,
        publicDescription: '',
        imageUrl: '',
        variants: [
          {
            id: undefined,
            sku: 'PLA-BAS-NEG',
            name: 'Negro',
            inventoryCost: 80,
            salePrice: 150,
            stock: 25,
            optionValueIds: [],
          },
        ],
      }

      let returned: boolean = false
      await act(async () => {
        returned = await result.current.handleProductSubmit(draft)
      })

      expect(returned).toBe(false)
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringContaining('SKU'),
      )
    })

    it('debería mostrar error genérico para otros errores de servidor', async () => {
      vi.mocked(repository.updateVariant).mockRejectedValue(
        new Error('Connection timeout'),
      )

      const { result } = renderHook(
        () => useProductEditor(mockUser, { invalidateQueries: vi.fn() } as any),
        { wrapper: createWrapper() },
      )

      act(() => {
        result.current.openProductEditor(existingProduct)
      })

      await waitFor(() => {
        expect(result.current.productEditor).not.toBeNull()
      })

      const draft: ProductDraft = {
        name: 'Playera Básica',
        categoryId: 'cat1',
        published: true,
        publicDescription: '',
        imageUrl: '',
        variants: [
          {
            id: 'v1',
            sku: 'PLA-BAS-NEG',
            name: 'Negro',
            inventoryCost: 80,
            salePrice: 150,
            stock: 25,
            optionValueIds: [],
          },
        ],
      }

      let returned: boolean = false
      await act(async () => {
        returned = await result.current.handleProductSubmit(draft)
      })

      expect(returned).toBe(false)
      expect(mockToast.error).toHaveBeenCalledWith(
        'No pudimos guardar el producto. Inténtalo de nuevo.',
      )
    })
  })
})
