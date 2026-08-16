import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSettingsMutation } from './useSettingsMutation'
import type { User } from '@supabase/supabase-js'
import type { BusinessSettings } from '../../types.ts'
import { qk } from '../../lib/queryKeys.ts'

vi.mock('../../lib/repository.ts', () => ({
  saveSettings: vi.fn(),
}))

const mockUser = { id: 'user-1' } as User

const mockSettings: BusinessSettings = {
  businessName: 'Mi Negocio',
  currency: 'MXN',
  lowStockThreshold: 5,
  publicCatalogEnabled: true,
  publicSlug: 'mi-negocio',
  whatsappNumber: '5512345678',
  publicIntro: 'Hola',
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  queryClient.setQueryData(qk.settings(mockUser), mockSettings)
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useSettingsMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debería llamar a saveSettings con los datos correctos', async () => {
    const { saveSettings } = await import('../../lib/repository.ts')
    vi.mocked(saveSettings).mockResolvedValue(mockSettings)

    const { result } = renderHook(() => useSettingsMutation(mockUser), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync(mockSettings)
    })

    expect(saveSettings).toHaveBeenCalledWith(mockUser, mockSettings)
  })

  it('debería actualizar la caché de settings en éxito', async () => {
    const { saveSettings } = await import('../../lib/repository.ts')
    const updatedSettings = { ...mockSettings, businessName: 'Nuevo' }
    vi.mocked(saveSettings).mockResolvedValue(updatedSettings)

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    queryClient.setQueryData(qk.settings(mockUser), mockSettings)

    const { result } = renderHook(() => useSettingsMutation(mockUser), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    })

    await act(async () => {
      await result.current.mutateAsync(mockSettings)
    })

    await waitFor(() => {
      const cached = queryClient.getQueryData<BusinessSettings>(
        qk.settings(mockUser),
      )
      expect(cached?.businessName).toBe('Nuevo')
    })
  })

  it('debería resolver sin llamar a saveSettings cuando user es null (demo)', async () => {
    const { saveSettings } = await import('../../lib/repository.ts')

    const { result } = renderHook(() => useSettingsMutation(null), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await result.current.mutateAsync(mockSettings)
    })

    expect(saveSettings).not.toHaveBeenCalled()
  })

  it('debería lanzar error cuando saveSettings falla', async () => {
    const { saveSettings } = await import('../../lib/repository.ts')
    vi.mocked(saveSettings).mockRejectedValue(new Error('DB error'))

    const { result } = renderHook(() => useSettingsMutation(mockUser), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      await expect(result.current.mutateAsync(mockSettings)).rejects.toThrow(
        'DB error',
      )
    })
  })
})
