import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CatalogPage } from './CatalogPage'
import type { BusinessSettings, Product } from '../../types.ts'

const createMockProduct = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'Playera Básica',
  category: 'Ropa',
  categoryId: 'cat1',
  published: true,
  publicDescription: 'Playera cómoda',
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
      optionValues: [{ optionType: 'Color', value: 'Negro' }],
    },
  ],
  ...overrides,
})

const defaultSettings: BusinessSettings = {
  businessName: 'Mi Negocio',
  currency: 'MXN',
  lowStockThreshold: 5,
  publicCatalogEnabled: true,
  publicSlug: 'mi-negocio',
  whatsappNumber: '55 1234 5678',
  publicIntro: 'Productos para ti',
}

const defaultProps = {
  products: [createMockProduct()],
  currency: 'MXN',
  settings: defaultSettings,
}

describe('CatalogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderizado', () => {
    it('debería renderizar el título de la página', () => {
      render(<CatalogPage {...defaultProps} />)
      expect(screen.getByText('Tu tienda visual')).toBeInTheDocument()
    })

    it('debería renderizar el subtítulo', () => {
      render(<CatalogPage {...defaultProps} />)
      expect(
        screen.getByText(
          'Enséñale tus productos publicados a tus clientes sin mostrar información interna.',
        ),
      ).toBeInTheDocument()
    })

    it('debería mostrar la barra de compartir cuando el catálogo está habilitado', () => {
      render(<CatalogPage {...defaultProps} />)
      expect(screen.getByText('Catálogo público listo')).toBeInTheDocument()
    })

    it('debería ocultar la barra de compartir cuando el catálogo está deshabilitado', () => {
      const settings = { ...defaultSettings, publicCatalogEnabled: false }
      render(<CatalogPage {...defaultProps} settings={settings} />)
      expect(screen.queryByText('Catálogo público listo')).not.toBeInTheDocument()
    })

    it('debería ocultar la barra de compartir cuando no hay slug', () => {
      const settings = { ...defaultSettings, publicSlug: '' }
      render(<CatalogPage {...defaultProps} settings={settings} />)
      expect(screen.queryByText('Catálogo público listo')).not.toBeInTheDocument()
    })
  })

  describe('Productos', () => {
    it('debería mostrar productos publicados', () => {
      render(<CatalogPage {...defaultProps} />)
      expect(screen.getByText('Playera Básica')).toBeInTheDocument()
    })

    it('debería ocultar productos no publicados', () => {
      const products = [
        createMockProduct({ id: 'p1', name: 'Publicado', published: true }),
        createMockProduct({
          id: 'p2',
          name: 'Borrador',
          published: false,
          category: 'Accesorios',
        }),
      ]
      render(<CatalogPage {...defaultProps} products={products} />)
      expect(screen.getByText('Publicado')).toBeInTheDocument()
      expect(screen.queryByText('Borrador')).not.toBeInTheDocument()
    })

    it('debería mostrar la categoría del producto', () => {
      render(<CatalogPage {...defaultProps} />)
      expect(screen.getByText('Ropa')).toBeInTheDocument()
    })

    it('debería mostrar la descripción pública', () => {
      render(<CatalogPage {...defaultProps} />)
      expect(screen.getByText('Playera cómoda')).toBeInTheDocument()
    })

    it('debería mostrar el precio más bajo de las variantes', () => {
      const product = createMockProduct({
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
          {
            id: 'v2',
            productId: 'p1',
            sku: 'PLA-002',
            name: 'Blanco',
            inventoryCost: 75,
            salePrice: 120,
            stock: 30,
            optionValues: [],
          },
        ],
      })
      render(<CatalogPage {...defaultProps} products={[product]} />)
      expect(screen.getByText('$120')).toBeInTheDocument()
    })

    it('debería mostrar $0 cuando el producto no tiene variantes', () => {
      const product = createMockProduct({ variants: [] })
      render(<CatalogPage {...defaultProps} products={[product]} />)
      expect(screen.getByText('$0')).toBeInTheDocument()
    })

    it('debería mostrar imagen cuando imageUrl existe', () => {
      const product = createMockProduct({
        imageUrl: 'https://example.com/photo.jpg',
      })
      const { container } = render(
        <CatalogPage {...defaultProps} products={[product]} />,
      )
      const img = container.querySelector('.catalog-photo')
      expect(img).toBeInTheDocument()
    })

    it('debería mostrar placeholder cuando no hay imagen', () => {
      const { container } = render(<CatalogPage {...defaultProps} />)
      const placeholder = container.querySelector('.catalog-image.sky')
      expect(placeholder).toBeInTheDocument()
    })

    it('debería renderizar múltiples productos', () => {
      const products = [
        createMockProduct({ id: 'p1', name: 'Playera' }),
        createMockProduct({
          id: 'p2',
          name: 'Gorra',
          category: 'Accesorios',
          publicDescription: 'Gorra deportiva',
        }),
      ]
      render(<CatalogPage {...defaultProps} products={products} />)
      expect(screen.getByText('Playera')).toBeInTheDocument()
      expect(screen.getByText('Gorra')).toBeInTheDocument()
    })
  })

  describe('Acciones', () => {
    it('debería copiar el enlace del catálogo al portapapeles', async () => {
      const user = userEvent.setup()
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator.clipboard, { writeText })
      render(<CatalogPage {...defaultProps} />)
      await user.click(screen.getByText('Copiar enlace'))
      expect(writeText).toHaveBeenCalledWith(
        'http://localhost:3000/tienda/mi-negocio',
      )
    })

    it('debería tener un enlace para abrir la tienda', () => {
      render(<CatalogPage {...defaultProps} />)
      const link = screen.getByText('Abrir tienda').closest('a')
      expect(link).toHaveAttribute(
        'href',
        'http://localhost:3000/tienda/mi-negocio',
      )
      expect(link).toHaveAttribute('target', '_blank')
    })
  })
})
