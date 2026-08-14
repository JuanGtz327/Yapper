import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PublicCatalogPage } from './PublicCatalogPage'
import type { PublicCatalog } from '../../types.ts'

const defaultCatalog: PublicCatalog = {
  businessName: 'Mi Negocio',
  currency: 'MXN',
  whatsappNumber: '5512345678',
  publicIntro: 'Productos para ti',
  products: [
    {
      id: 'p1',
      name: 'Playera',
      category: 'Ropa',
      publicDescription: 'Playera cómoda',
      imageUrl: null,
      color: 'sky',
      price: 150,
    },
  ],
}

let mockCatalogData: PublicCatalog | null | undefined = defaultCatalog
let mockCatalogIsLoading = false
let mockCatalogError: Error | null = null

vi.mock('../../hooks/queries/usePublicCatalog.ts', () => ({
  usePublicCatalog: () => ({
    data: mockCatalogData,
    isLoading: mockCatalogIsLoading,
    error: mockCatalogError,
  }),
}))

describe('PublicCatalogPage', () => {
  beforeEach(() => {
    mockCatalogData = defaultCatalog
    mockCatalogIsLoading = false
    mockCatalogError = null
  })

  it('debería renderizar productos del catálogo', () => {
    render(<PublicCatalogPage slug="mi-negocio" />)
    expect(screen.getByText('Playera')).toBeInTheDocument()
  })

  it('debería mostrar estado de carga', () => {
    mockCatalogIsLoading = true
    mockCatalogData = undefined
    render(<PublicCatalogPage slug="mi-negocio" />)
    expect(
      screen.getAllByText(/Cargando catálogo/).length,
    ).toBeGreaterThanOrEqual(1)
  })

  it('debería mostrar mensaje de tienda no disponible cuando hay error', () => {
    mockCatalogData = null
    mockCatalogError = new Error('Not found')
    render(<PublicCatalogPage slug="mi-negocio" />)
    expect(
      screen.getByText('Esta tienda no está disponible'),
    ).toBeInTheDocument()
  })

  it('debería mostrar mensaje de tienda no disponible cuando no hay datos', () => {
    mockCatalogData = null
    render(<PublicCatalogPage slug="mi-negocio" />)
    expect(
      screen.getByText('Esta tienda no está disponible'),
    ).toBeInTheDocument()
  })

  it('debería mostrar mensaje informativo cuando el catálogo no tiene productos', () => {
    mockCatalogData = { ...defaultCatalog, products: [] }
    render(<PublicCatalogPage slug="mi-negocio" />)
    expect(
      screen.getByText(/Aún no hay productos publicados/),
    ).toBeInTheDocument()
  })
})
