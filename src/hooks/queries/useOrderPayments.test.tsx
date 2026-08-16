import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useOrderPaymentsQuery } from './useOrderPayments'

vi.mock('../../lib/repository.ts', () => ({
  loadOrderPayments: vi.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useOrderPaymentsQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debería cargar pagos cuando orderId existe', async () => {
    const { loadOrderPayments } = await import('../../lib/repository.ts')
    vi.mocked(loadOrderPayments).mockResolvedValue([
      {
        id: 'pay-1',
        orderId: 'order-1',
        amount: 50,
        paymentMethod: 'Efectivo',
        reference: null,
        notes: null,
        createdAt: '2026-01-15T10:30:00Z',
      },
    ])

    const { result } = renderHook(() => useOrderPaymentsQuery('order-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toHaveLength(1)
    })

    expect(loadOrderPayments).toHaveBeenCalledWith('order-1')
  })

  it('debería estar deshabilitado cuando orderId es null', async () => {
    const { loadOrderPayments } = await import('../../lib/repository.ts')

    const { result } = renderHook(() => useOrderPaymentsQuery(null), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(false)
    })

    expect(loadOrderPayments).not.toHaveBeenCalled()
  })

  it('debería devolver array vacío cuando no hay pagos', async () => {
    const { loadOrderPayments } = await import('../../lib/repository.ts')
    vi.mocked(loadOrderPayments).mockResolvedValue([])

    const { result } = renderHook(() => useOrderPaymentsQuery('order-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.data).toEqual([])
    })
  })
})
