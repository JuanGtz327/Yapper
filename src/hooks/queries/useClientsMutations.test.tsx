import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Client } from '../../types.ts'

// ─── Mock del repositorio ────────────────────────────────────

const mockCreateClient = vi.fn()
const mockUpdateClient = vi.fn()
const mockDeleteClient = vi.fn()

vi.mock('../../lib/repository.ts', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
  updateClient: (...args: unknown[]) => mockUpdateClient(...args),
  deleteClient: (...args: unknown[]) => mockDeleteClient(...args),
}))

// ─── Datos de prueba ─────────────────────────────────────────

const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00Z',
}

const mockClient: Client = {
  id: 'client-abc',
  name: 'Mariana González',
  phone: '55 1234 5678',
  zone: 'Coyoacán',
  orders: 0,
  initials: 'MG',
}

const mockSavedClient: Client = {
  ...mockClient,
  id: 'client-new-123',
}

// ─── Helper para envolver hook en QueryClientProvider ─────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

// ─── Importar hook después del mock ──────────────────────────

import { useClientsMutations } from './useClientsMutations.ts'

// ─── Tests ───────────────────────────────────────────────────

describe('useClientsMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateClient.mockResolvedValue(mockSavedClient)
    mockUpdateClient.mockResolvedValue(undefined)
    mockDeleteClient.mockResolvedValue(undefined)
  })

  describe('mutación de creación', () => {
    it('debería devolver un objeto de mutación create', () => {
      // Arrange
      const wrapper = createWrapper()

      // Act
      const { result } = renderHook(() => useClientsMutations(mockUser), {
        wrapper,
      })

      // Assert
      expect(result.current.create).toBeDefined()
      expect(typeof result.current.create.mutate).toBe('function')
      expect(typeof result.current.create.mutateAsync).toBe('function')
    })

    it('debería llamar a createClient del repositorio al crear', async () => {
      // Arrange
      const wrapper = createWrapper()
      const { result } = renderHook(() => useClientsMutations(mockUser), {
        wrapper,
      })

      // Act
      await act(async () => {
        await result.current.create.mutateAsync(mockClient)
      })

      // Assert
      expect(mockCreateClient).toHaveBeenCalledWith(mockUser, mockClient)
    })

    it('debería devolver el cliente guardado al crear exitosamente', async () => {
      // Arrange
      const wrapper = createWrapper()
      const { result } = renderHook(() => useClientsMutations(mockUser), {
        wrapper,
      })

      // Act
      let saved: Client | undefined
      await act(async () => {
        saved = await result.current.create.mutateAsync(mockClient)
      })

      // Assert
      expect(saved).toEqual(mockSavedClient)
    })

    it('debería lanzar error cuando createClient falla', async () => {
      // Arrange
      mockCreateClient.mockRejectedValue(new Error('Error de Supabase'))
      const wrapper = createWrapper()
      const { result } = renderHook(() => useClientsMutations(mockUser), {
        wrapper,
      })

      // Act & Assert
      await act(async () => {
        await expect(
          result.current.create.mutateAsync(mockClient),
        ).rejects.toThrow('Error de Supabase')
      })
    })

    it('debería resolver sin llamar al repositorio cuando user es null', async () => {
      // Arrange
      const wrapper = createWrapper()
      const { result } = renderHook(() => useClientsMutations(null), {
        wrapper,
      })

      // Act
      let saved: Client | undefined
      await act(async () => {
        saved = await result.current.create.mutateAsync(mockClient)
      })

      // Assert
      expect(mockCreateClient).not.toHaveBeenCalled()
      expect(saved).toEqual(mockClient)
    })
  })

  describe('mutación de actualización', () => {
    it('debería devolver un objeto de mutación update', () => {
      // Arrange
      const wrapper = createWrapper()

      // Act
      const { result } = renderHook(() => useClientsMutations(mockUser), {
        wrapper,
      })

      // Assert
      expect(result.current.update).toBeDefined()
      expect(typeof result.current.update.mutate).toBe('function')
      expect(typeof result.current.update.mutateAsync).toBe('function')
    })

    it('debería llamar a updateClient del repositorio al actualizar', async () => {
      // Arrange
      const wrapper = createWrapper()
      const { result } = renderHook(() => useClientsMutations(mockUser), {
        wrapper,
      })

      // Act
      await act(async () => {
        await result.current.update.mutateAsync(mockClient)
      })

      // Assert
      expect(mockUpdateClient).toHaveBeenCalledWith(mockClient)
    })

    it('debería lanzar error cuando updateClient falla', async () => {
      // Arrange
      mockUpdateClient.mockRejectedValue(new Error('Cliente no encontrado'))
      const wrapper = createWrapper()
      const { result } = renderHook(() => useClientsMutations(mockUser), {
        wrapper,
      })

      // Act & Assert
      await act(async () => {
        await expect(
          result.current.update.mutateAsync(mockClient),
        ).rejects.toThrow('Cliente no encontrado')
      })
    })

    it('debería resolver sin llamar al repositorio cuando user es null', async () => {
      // Arrange
      const wrapper = createWrapper()
      const { result } = renderHook(() => useClientsMutations(null), {
        wrapper,
      })

      // Act
      await act(async () => {
        await result.current.update.mutateAsync(mockClient)
      })

      // Assert
      expect(mockUpdateClient).not.toHaveBeenCalled()
    })
  })

  describe('mutación de eliminación', () => {
    it('debería devolver un objeto de mutación remove', () => {
      // Arrange
      const wrapper = createWrapper()

      // Act
      const { result } = renderHook(() => useClientsMutations(mockUser), {
        wrapper,
      })

      // Assert
      expect(result.current.remove).toBeDefined()
      expect(typeof result.current.remove.mutate).toBe('function')
      expect(typeof result.current.remove.mutateAsync).toBe('function')
    })

    it('debería llamar a deleteClient del repositorio al eliminar', async () => {
      // Arrange
      const wrapper = createWrapper()
      const { result } = renderHook(() => useClientsMutations(mockUser), {
        wrapper,
      })

      // Act
      await act(async () => {
        await result.current.remove.mutateAsync('client-abc')
      })

      // Assert
      expect(mockDeleteClient).toHaveBeenCalledWith('client-abc')
    })

    it('debería lanzar error cuando deleteClient falla', async () => {
      // Arrange
      mockDeleteClient.mockRejectedValue(new Error('No se puede eliminar'))
      const wrapper = createWrapper()
      const { result } = renderHook(() => useClientsMutations(mockUser), {
        wrapper,
      })

      // Act & Assert
      await act(async () => {
        await expect(
          result.current.remove.mutateAsync('client-abc'),
        ).rejects.toThrow('No se puede eliminar')
      })
    })

    it('debería resolver sin llamar al repositorio cuando user es null', async () => {
      // Arrange
      const wrapper = createWrapper()
      const { result } = renderHook(() => useClientsMutations(null), {
        wrapper,
      })

      // Act
      await act(async () => {
        await result.current.remove.mutateAsync('client-abc')
      })

      // Assert
      expect(mockDeleteClient).not.toHaveBeenCalled()
    })
  })

  describe('actualización de caché', () => {
    it('debería agregar el cliente a la caché después de crear', async () => {
      // Arrange
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      const existingClients: Client[] = [{ ...mockClient, id: 'existing-1' }]
      queryClient.setQueryData(
        ['users', mockUser.id, 'clients'],
        existingClients,
      )

      function Wrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      }

      const { result } = renderHook(() => useClientsMutations(mockUser), {
        wrapper: Wrapper,
      })

      // Act
      await act(async () => {
        await result.current.create.mutateAsync(mockClient)
      })

      // Assert
      await waitFor(() => {
        const cached = queryClient.getQueryData<Client[]>([
          'users',
          mockUser.id,
          'clients',
        ])
        expect(cached).toHaveLength(2)
        expect(cached?.[1]).toEqual(mockSavedClient)
      })
    })

    it('debería actualizar el cliente en la caché después de modificar', async () => {
      // Arrange
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      const existingClients: Client[] = [{ ...mockClient }]
      queryClient.setQueryData(
        ['users', mockUser.id, 'clients'],
        existingClients,
      )

      function Wrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      }

      const { result } = renderHook(() => useClientsMutations(mockUser), {
        wrapper: Wrapper,
      })
      const updatedClient = { ...mockClient, name: 'Mariana G. Actualizada' }

      // Act
      await act(async () => {
        await result.current.update.mutateAsync(updatedClient)
      })

      // Assert
      await waitFor(() => {
        const cached = queryClient.getQueryData<Client[]>([
          'users',
          mockUser.id,
          'clients',
        ])
        expect(cached).toHaveLength(1)
        expect(cached?.[0].name).toBe('Mariana G. Actualizada')
      })
    })

    it('debería eliminar el cliente de la caché después de borrar', async () => {
      // Arrange
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      const existingClients: Client[] = [
        { ...mockClient },
        { ...mockClient, id: 'client-other' },
      ]
      queryClient.setQueryData(
        ['users', mockUser.id, 'clients'],
        existingClients,
      )

      function Wrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      }

      const { result } = renderHook(() => useClientsMutations(mockUser), {
        wrapper: Wrapper,
      })

      // Act
      await act(async () => {
        await result.current.remove.mutateAsync('client-abc')
      })

      // Assert
      await waitFor(() => {
        const cached = queryClient.getQueryData<Client[]>([
          'users',
          mockUser.id,
          'clients',
        ])
        expect(cached).toHaveLength(1)
        expect(cached?.[0].id).toBe('client-other')
      })
    })

    it('debería manejar caché vacía al crear', async () => {
      // Arrange
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })

      function Wrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      }

      const { result } = renderHook(() => useClientsMutations(mockUser), {
        wrapper: Wrapper,
      })

      // Act
      await act(async () => {
        await result.current.create.mutateAsync(mockClient)
      })

      // Assert
      await waitFor(() => {
        const cached = queryClient.getQueryData<Client[]>([
          'users',
          mockUser.id,
          'clients',
        ])
        expect(cached).toEqual([mockSavedClient])
      })
    })
  })
})
