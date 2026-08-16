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

  describe('Productos', () => {
    it('debería mostrar mensaje cuando no hay productos publicados', () => {
      const products = [createMockProduct({ id: 'p1', published: false })]
      render(<CatalogPage {...defaultProps} products={products} />)
      expect(
        screen.getByText(/No hay productos publicados/),
      ).toBeInTheDocument()
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

    it('debería mostrar precio de la variante seleccionada', () => {
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
      expect(screen.getByText('$150.00')).toBeInTheDocument()
    })

    it('debería mostrar precio único cuando las variantes tienen el mismo precio', () => {
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
            salePrice: 150,
            stock: 30,
            optionValues: [],
          },
        ],
      })
      render(<CatalogPage {...defaultProps} products={[product]} />)
      expect(screen.getByText('$150.00')).toBeInTheDocument()
    })

    it('debería mostrar $0 cuando el producto no tiene variantes', () => {
      const product = createMockProduct({ variants: [] })
      render(<CatalogPage {...defaultProps} products={[product]} />)
      expect(screen.getByText('$0.00')).toBeInTheDocument()
    })

    it('debería mostrar esferas de selección de variantes', () => {
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
      expect(screen.getByTitle('Negro')).toBeInTheDocument()
      expect(screen.getByTitle('Blanco')).toBeInTheDocument()
    })

    it('debería mostrar una esfera por cada variante', () => {
      const product = createMockProduct({
        variants: [
          {
            id: 'v1',
            productId: 'p1',
            sku: 'PLA-001',
            name: 'Negro M',
            inventoryCost: 80,
            salePrice: 150,
            stock: 25,
            optionValues: [],
          },
          {
            id: 'v2',
            productId: 'p1',
            sku: 'PLA-002',
            name: 'Negro L',
            inventoryCost: 80,
            salePrice: 150,
            stock: 20,
            optionValues: [],
          },
          {
            id: 'v3',
            productId: 'p1',
            sku: 'PLA-003',
            name: 'Blanco M',
            inventoryCost: 75,
            salePrice: 160,
            stock: 15,
            optionValues: [],
          },
        ],
      })
      render(<CatalogPage {...defaultProps} products={[product]} />)
      expect(screen.getByTitle('Negro M')).toBeInTheDocument()
      expect(screen.getByTitle('Negro L')).toBeInTheDocument()
      expect(screen.getByTitle('Blanco M')).toBeInTheDocument()
    })

    it('debería cambiar precio al seleccionar una variante diferente', async () => {
      const user = userEvent.setup()
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
      expect(screen.getByText('$150.00')).toBeInTheDocument()
      await user.click(screen.getByTitle('Blanco'))
      expect(screen.getByText('$120.00')).toBeInTheDocument()
    })

    it('debería mostrar un círculo incluso con una sola variante', () => {
      const product = createMockProduct({
        variants: [
          {
            id: 'v1',
            productId: 'p1',
            sku: 'PLA-001',
            name: 'Único',
            inventoryCost: 80,
            salePrice: 150,
            stock: 25,
            optionValues: [],
          },
        ],
      })
      const { container } = render(
        <CatalogPage {...defaultProps} products={[product]} />,
      )
      const buttons = container.querySelectorAll('button[title]')
      expect(buttons).toHaveLength(1)
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
      const link = screen.getByText('Abrir tienda')
      expect(link).toBeInTheDocument()
    })
  })
})
