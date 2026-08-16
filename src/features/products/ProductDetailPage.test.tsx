import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProductDetailPage } from './ProductDetailPage'

vi.mock('../../lib/supabase.ts', () => ({
  isSupabaseConfigured: false,
}))

vi.mock('../../lib/repository.ts', () => ({
  loadProductById: vi.fn().mockResolvedValue(null),
  loadVariantPriceHistory: vi.fn().mockResolvedValue([]),
}))

function renderWithClient(ui: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  )
}

describe('ProductDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debería mostrar el mensaje de producto no encontrado cuando no existe', async () => {
    renderWithClient(
      <ProductDetailPage
        user={null}
        productId="no-existe"
        currency="MXN"
        onBack={vi.fn()}
        onEdit={vi.fn()}
      />,
    )
    expect(
      await screen.findByText(/No encontramos este producto/),
    ).toBeInTheDocument()
  })

  it('debería mostrar el botón de volver', async () => {
    renderWithClient(
      <ProductDetailPage
        user={null}
        productId="no-existe"
        currency="MXN"
        onBack={vi.fn()}
        onEdit={vi.fn()}
      />,
    )
    expect(await screen.findByText('Volver')).toBeInTheDocument()
  })
})
