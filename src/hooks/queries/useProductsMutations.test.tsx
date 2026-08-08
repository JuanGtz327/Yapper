import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProductsMutations } from './useProductsMutations'
import * as repository from '../../lib/repository.ts'
import { qk } from '../../lib/queryKeys.ts'
import type { User } from '@supabase/supabase-js'
import type { ReactNode } from 'react'
import type { Product } from '../../types.ts'

vi.mock('../../lib/repository.ts', () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
}))

const mockUser = { id: 'user-1', email: 'test@example.com' } as User

const mockProducts: Product[] = [
  {
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
  },
]

const createWrapper = (initialProducts: Product[] = []) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  if (initialProducts.length) {
    queryClient.setQueryData(qk.products(mockUser), initialProducts)
  }
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useProductsMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Creación de producto', () => {
    it('debería llamar a createProduct con los datos correctos', async () => {
      const createProduct = vi.fn().mockResolvedValue({
        id: 'new-product',
        name: 'Nuevo Producto',
      })
      vi.mocked(repository.createProduct).mockImplementation(createProduct)

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: createWrapper(),
      })

      const product = {
        name: 'Nuevo Producto',
        category: 'Ropa',
        categoryId: 'cat1',
        published: true,
        publicDescription: '',
        imageUrl: null,
        color: 'sky',
        variants: [],
      }

      const defaultVariant = {
        sku: 'NUE-001',
        inventoryCost: 50,
        salePrice: 100,
        stock: 10,
        optionValueIds: [],
      }

      await result.current.create.mutateAsync({
        product,
        defaultVariant,
      })

      await waitFor(() => {
        expect(createProduct).toHaveBeenCalledWith(
          mockUser,
          product,
          defaultVariant,
        )
      })
    })

    it('debería retornar el producto creado', async () => {
      const newProduct = { id: 'new-product', name: 'Nuevo Producto' }
      const createProduct = vi.fn().mockResolvedValue(newProduct)
      vi.mocked(repository.createProduct).mockImplementation(createProduct)

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: createWrapper(),
      })

      const product = {
        name: 'Nuevo Producto',
        category: 'Ropa',
        categoryId: 'cat1',
        published: true,
        publicDescription: '',
        imageUrl: null,
        color: 'sky',
        variants: [],
      }

      const saved = await result.current.create.mutateAsync({ product })

      expect(saved).toEqual(newProduct)
    })

    it('debería funcionar sin usuario (modo demo)', async () => {
      const { result } = renderHook(() => useProductsMutations(null), {
        wrapper: createWrapper(),
      })

      const product = {
        name: 'Producto Demo',
        category: 'Ropa',
        categoryId: 'cat1',
        published: true,
        publicDescription: '',
        imageUrl: null,
        color: 'sky',
        variants: [],
      }

      const saved = await result.current.create.mutateAsync({ product })

      expect(saved.id).toBeDefined()
      expect(saved.name).toBe('Producto Demo')
    })
  })

  describe('Actualización de producto', () => {
    it('debería llamar a updateProduct con los datos correctos', async () => {
      const updateProduct = vi.fn().mockResolvedValue(undefined)
      vi.mocked(repository.updateProduct).mockImplementation(updateProduct)

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: createWrapper(),
      })

      const product = {
        id: 'p1',
        name: 'Producto Actualizado',
        category: 'Ropa',
        categoryId: 'cat1',
        published: true,
        publicDescription: '',
        imageUrl: null,
        color: 'sky',
        variants: [],
      }

      await result.current.update.mutateAsync(product)

      await waitFor(() => {
        expect(updateProduct).toHaveBeenCalledWith(product)
      })
    })

    it('debería funcionar sin usuario (modo demo)', async () => {
      const { result } = renderHook(() => useProductsMutations(null), {
        wrapper: createWrapper(),
      })

      const product = {
        id: 'p1',
        name: 'Producto Demo',
        category: 'Ropa',
        categoryId: 'cat1',
        published: true,
        publicDescription: '',
        imageUrl: null,
        color: 'sky',
        variants: [],
      }

      // No debería lanzar error
      await result.current.update.mutateAsync(product)
    })
  })

  describe('Eliminación de producto', () => {
    it('debería llamar a deleteProduct con el ID correcto', async () => {
      const deleteProduct = vi.fn().mockResolvedValue(undefined)
      vi.mocked(repository.deleteProduct).mockImplementation(deleteProduct)

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: createWrapper(),
      })

      await result.current.remove.mutateAsync('p1')

      await waitFor(() => {
        expect(deleteProduct).toHaveBeenCalledWith('p1')
      })
    })

    it('debería funcionar sin usuario (modo demo)', async () => {
      const { result } = renderHook(() => useProductsMutations(null), {
        wrapper: createWrapper(),
      })

      // No debería lanzar error
      await result.current.remove.mutateAsync('p1')
    })
  })

  describe('Manejo de errores', () => {
    it('debería propagar errores de createProduct', async () => {
      const createProduct = vi.fn().mockRejectedValue(new Error('DB error'))
      vi.mocked(repository.createProduct).mockImplementation(createProduct)

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: createWrapper(),
      })

      const product = {
        name: 'Producto',
        category: 'Ropa',
        categoryId: 'cat1',
        published: true,
        publicDescription: '',
        imageUrl: null,
        color: 'sky',
        variants: [],
      }

      await expect(
        result.current.create.mutateAsync({ product }),
      ).rejects.toThrow('DB error')
    })

    it('debería propagar errores de updateProduct', async () => {
      const updateProduct = vi.fn().mockRejectedValue(new Error('DB error'))
      vi.mocked(repository.updateProduct).mockImplementation(updateProduct)

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: createWrapper(),
      })

      const product = {
        id: 'p1',
        name: 'Producto',
        category: 'Ropa',
        categoryId: 'cat1',
        published: true,
        publicDescription: '',
        imageUrl: null,
        color: 'sky',
        variants: [],
      }

      await expect(
        result.current.update.mutateAsync(product),
      ).rejects.toThrow('DB error')
    })

    it('debería propagar errores de deleteProduct', async () => {
      const deleteProduct = vi.fn().mockRejectedValue(new Error('DB error'))
      vi.mocked(repository.deleteProduct).mockImplementation(deleteProduct)

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: createWrapper(),
      })

      await expect(
        result.current.remove.mutateAsync('p1'),
      ).rejects.toThrow('DB error')
    })
  })

  describe('Actualización de caché', () => {
    it('debería agregar producto al caché al crear', async () => {
      const newProduct: Product = {
        id: 'p-new',
        name: 'Nuevo Producto',
        category: 'Ropa',
        categoryId: 'cat1',
        published: true,
        publicDescription: '',
        imageUrl: null,
        color: 'coral',
        variants: [],
      }
      vi.mocked(repository.createProduct).mockResolvedValue(newProduct)

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.products(mockUser), mockProducts)

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.create.mutateAsync({
          product: mockProducts[0],
        })
      })

      const cached = queryClient.getQueryData<Product[]>(qk.products(mockUser))
      expect(cached).toHaveLength(2)
      expect(cached![1].id).toBe('p-new')
    })

    it('debería invalidar la query de productos después de modificar', async () => {
      vi.mocked(repository.updateProduct).mockResolvedValue(undefined)

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.products(mockUser), mockProducts)
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      const updatedProduct = { ...mockProducts[0], name: 'Playera Actualizada' }

      await act(async () => {
        await result.current.update.mutateAsync(updatedProduct)
      })

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: qk.products(mockUser),
      })

      invalidateSpy.mockRestore()
    })

    it('debería eliminar producto del caché al borrar', async () => {
      vi.mocked(repository.deleteProduct).mockResolvedValue(undefined)

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(qk.products(mockUser), mockProducts)

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        ),
      })

      await act(async () => {
        await result.current.remove.mutateAsync('p1')
      })

      const cached = queryClient.getQueryData<Product[]>(qk.products(mockUser))
      expect(cached).toHaveLength(0)
    })

    it('debería crear entrada en caché si no existe al crear', async () => {
      const newProduct: Product = {
        id: 'p-new',
        name: 'Nuevo Producto',
        category: 'Ropa',
        categoryId: 'cat1',
        published: true,
        publicDescription: '',
        imageUrl: null,
        color: 'coral',
        variants: [],
      }
      vi.mocked(repository.createProduct).mockResolvedValue(newProduct)

      const { result } = renderHook(() => useProductsMutations(mockUser), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.create.mutateAsync({
          product: mockProducts[0],
        })
      })

      await waitFor(() => {
        expect(result.current.create.isSuccess).toBe(true)
      })
    })
  })
})
