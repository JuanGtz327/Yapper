import { render, screen, fireEvent } from '@testing-library/react'
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
      variants: [
        {
          name: 'Negro',
          optionValues: [{ optionType: 'Color', value: 'Negro' }],
          salePrice: 150,
          stock: 10,
        },
        {
          name: 'Blanco',
          optionValues: [{ optionType: 'Color', value: 'Blanco' }],
          salePrice: 180,
          stock: 8,
        },
      ],
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

  it('debería mostrar precio de la variante seleccionada', () => {
    render(<PublicCatalogPage slug="mi-negocio" />)
    expect(screen.getByText('$150.00')).toBeInTheDocument()
  })

  it('debería cambiar precio al seleccionar una variante diferente', () => {
    render(<PublicCatalogPage slug="mi-negocio" />)
    expect(screen.getByText('$150.00')).toBeInTheDocument()
    fireEvent.click(screen.getByTitle('Blanco'))
    expect(screen.getByText('$180.00')).toBeInTheDocument()
  })

  it('debería mostrar precio único cuando todas las variantes tienen el mismo precio', () => {
    mockCatalogData = {
      ...defaultCatalog,
      products: [
        {
          ...defaultCatalog.products[0],
          variants: [
            {
              name: 'Negro',
              optionValues: [{ optionType: 'Color', value: 'Negro' }],
              salePrice: 150,
              stock: 5,
            },
            {
              name: 'Blanco',
              optionValues: [{ optionType: 'Color', value: 'Blanco' }],
              salePrice: 150,
              stock: 3,
            },
          ],
        },
      ],
    }
    render(<PublicCatalogPage slug="mi-negocio" />)
    expect(screen.getByText('$150.00')).toBeInTheDocument()
  })

  it('debería incluir nombre de variante seleccionada en el mensaje de WhatsApp', () => {
    render(<PublicCatalogPage slug="mi-negocio" />)
    const link = screen.getByText('Preguntar por WhatsApp').closest('a')
    expect(link?.getAttribute('href')).toContain(
      encodeURIComponent('Me interesa Playera (Negro)'),
    )
  })

  it('debería incluir variante diferente en WhatsApp al seleccionar otra opción', () => {
    render(<PublicCatalogPage slug="mi-negocio" />)
    fireEvent.click(screen.getByTitle('Blanco'))
    const link = screen.getByText('Preguntar por WhatsApp').closest('a')
    expect(link?.getAttribute('href')).toContain(
      encodeURIComponent('Me interesa Playera (Blanco)'),
    )
  })

  it('debería mostrar un círculo incluso con una sola variante', () => {
    mockCatalogData = {
      ...defaultCatalog,
      products: [
        {
          ...defaultCatalog.products[0],
          variants: [
            {
              name: 'Único',
              optionValues: [],
              salePrice: 150,
              stock: 5,
            },
          ],
        },
      ],
    }
    const { container } = render(<PublicCatalogPage slug="mi-negocio" />)
    const buttons = container.querySelectorAll('button[title]')
    expect(buttons).toHaveLength(1)
  })

  it('debería cambiar WhatsApp message al seleccionar variante con múltiples opciones', () => {
    mockCatalogData = {
      ...defaultCatalog,
      products: [
        {
          ...defaultCatalog.products[0],
          variants: [
            {
              name: 'Negro M',
              optionValues: [
                { optionType: 'Color', value: 'Negro' },
                { optionType: 'Talla', value: 'M' },
              ],
              salePrice: 150,
              stock: 5,
            },
            {
              name: 'Blanco L',
              optionValues: [
                { optionType: 'Color', value: 'Blanco' },
                { optionType: 'Talla', value: 'L' },
              ],
              salePrice: 200,
              stock: 3,
            },
          ],
        },
      ],
    }
    render(<PublicCatalogPage slug="mi-negocio" />)
    fireEvent.click(screen.getByTitle('Blanco L'))
    const link = screen.getByText('Preguntar por WhatsApp').closest('a')
    expect(link?.getAttribute('href')).toContain(
      encodeURIComponent('Me interesa Playera (Blanco L)'),
    )
  })
})
