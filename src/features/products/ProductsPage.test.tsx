import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ProductsPage } from './ProductsPage'
import type { Product } from '../../types.ts'

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

const defaultProps = {
  products: [createMockProduct()],
  threshold: 5,
  currency: 'MXN',
  search: '',
  setSearch: vi.fn(),
  onAdd: vi.fn(),
  onManageCategories: vi.fn(),
  onEdit: vi.fn(),
  onRemove: vi.fn(),
}

describe('ProductsPage', () => {
  describe('Renderizado', () => {
    it('debería renderizar el título de la página', () => {
      render(<ProductsPage {...defaultProps} />)
      expect(screen.getByText('Tus productos')).toBeInTheDocument()
    })

    it('debería renderizar el subtítulo', () => {
      render(<ProductsPage {...defaultProps} />)
      expect(
        screen.getByText('Administra precios, existencias y categorías.'),
      ).toBeInTheDocument()
    })

    it('debería mostrar el botón de añadir producto', () => {
      render(<ProductsPage {...defaultProps} />)
      expect(screen.getByText('Añadir producto')).toBeInTheDocument()
    })

    it('debería mostrar el botón de categorías', () => {
      render(<ProductsPage {...defaultProps} />)
      expect(screen.getByText('Categorías')).toBeInTheDocument()
    })
  })

  describe('Tabla de productos', () => {
    it('debería mostrar el nombre del producto', () => {
      render(<ProductsPage {...defaultProps} />)
      expect(screen.getByText('Playera Básica')).toBeInTheDocument()
    })

    it('debería mostrar la categoría del producto', () => {
      render(<ProductsPage {...defaultProps} />)
      expect(screen.getByText('Ropa')).toBeInTheDocument()
    })

    it('debería mostrar el SKU de la variante', () => {
      render(<ProductsPage {...defaultProps} />)
      expect(screen.getByText('PLA-BAS-NEG')).toBeInTheDocument()
    })

    it('debería mostrar las existencias', () => {
      render(<ProductsPage {...defaultProps} />)
      expect(screen.getByText('25')).toBeInTheDocument()
    })

    it('debería mostrar la etiqueta de la variante', () => {
      render(<ProductsPage {...defaultProps} />)
      expect(screen.getByText('Negro')).toBeInTheDocument()
    })
  })

  describe('Resumen de inventario', () => {
    it('debería calcular la inversión total correctamente', () => {
      const products = [
        createMockProduct({
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
        }),
      ]
      render(<ProductsPage {...defaultProps} products={products} />)
      // Inversión = 80 * 25 = 2000
      expect(screen.getByText(/Inversión:/)).toBeInTheDocument()
    })

    it('debería calcular el valor de venta total correctamente', () => {
      const products = [
        createMockProduct({
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
        }),
      ]
      render(<ProductsPage {...defaultProps} products={products} />)
      // Valor de venta = 150 * 25 = 3750
      expect(screen.getByText(/Inventario:/)).toBeInTheDocument()
    })

    it('debería calcular la ganancia correctamente', () => {
      const products = [
        createMockProduct({
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
        }),
      ]
      render(<ProductsPage {...defaultProps} products={products} />)
      // Ganancia = (150 - 80) * 25 = 1750
      expect(screen.getByText(/Ganancia:/)).toBeInTheDocument()
    })
  })

  describe('Búsqueda', () => {
    it('debería filtrar productos por nombre', () => {
      const products = [
        createMockProduct({ id: 'p1', name: 'Playera Básica' }),
        createMockProduct({ id: 'p2', name: 'Pantalón Vaquero' }),
      ]
      render(
        <ProductsPage {...defaultProps} products={products} search="playera" />,
      )
      expect(screen.getByText('Playera Básica')).toBeInTheDocument()
      expect(screen.queryByText('Pantalón Vaquero')).not.toBeInTheDocument()
    })

    it('debería mostrar contador de productos filtrados', () => {
      const products = [
        createMockProduct({ id: 'p1', name: 'Playera Básica' }),
        createMockProduct({ id: 'p2', name: 'Pantalón Vaquero' }),
      ]
      render(
        <ProductsPage {...defaultProps} products={products} search="playera" />,
      )
      expect(screen.getByText('1 producto')).toBeInTheDocument()
    })

    it('debería mostrar "productos" en plural para múltiples resultados', () => {
      const products = [
        createMockProduct({ id: 'p1', name: 'Playera Básica' }),
        createMockProduct({ id: 'p2', name: 'Playera Deportiva' }),
      ]
      render(
        <ProductsPage {...defaultProps} products={products} search="playera" />,
      )
      expect(screen.getByText('2 productos')).toBeInTheDocument()
    })

    it('debería llamar a setSearch cuando se escribe en el campo de búsqueda', () => {
      const setSearch = vi.fn()
      render(<ProductsPage {...defaultProps} setSearch={setSearch} />)
      const input = screen.getByLabelText('Buscar productos')
      fireEvent.change(input, { target: { value: 'playera' } })
      expect(setSearch).toHaveBeenCalledWith('playera')
    })
  })

  describe('Filtros', () => {
    it('debería filtrar por categoría', async () => {
      const user = userEvent.setup()
      const products = [
        createMockProduct({ id: 'p1', name: 'Playera', category: 'Ropa' }),
        createMockProduct({ id: 'p2', name: 'Taza', category: 'Hogar' }),
      ]
      render(<ProductsPage {...defaultProps} products={products} />)

      await user.click(
        screen.getByRole('button', { name: 'Filtrar por categoría' }),
      )
      await user.click(screen.getByRole('option', { name: 'Hogar' }))

      expect(screen.getByText('Taza')).toBeInTheDocument()
      expect(screen.queryByText('Playera')).not.toBeInTheDocument()
    })

    it('debería filtrar productos agotados', async () => {
      const user = userEvent.setup()
      const products = [
        createMockProduct({ id: 'p1', name: 'Disponible' }),
        createMockProduct({
          id: 'p2',
          name: 'Agotado',
          variants: createMockProduct().variants.map((variant) => ({
            ...variant,
            stock: 0,
          })),
        }),
      ]
      render(<ProductsPage {...defaultProps} products={products} />)

      await user.click(
        screen.getByRole('button', { name: 'Filtrar por existencias' }),
      )
      await user.click(screen.getByRole('option', { name: 'Agotados' }))

      expect(screen.getByText('Agotado')).toBeInTheDocument()
      expect(screen.queryByText('Disponible')).not.toBeInTheDocument()
    })
  })

  describe('Acciones', () => {
    it('debería llamar a onAdd al hacer clic en "Añadir producto"', () => {
      const onAdd = vi.fn()
      render(<ProductsPage {...defaultProps} onAdd={onAdd} />)
      fireEvent.click(screen.getByText('Añadir producto'))
      expect(onAdd).toHaveBeenCalledTimes(1)
    })

    it('debería llamar a onManageCategories al hacer clic en "Categorías"', () => {
      const onManageCategories = vi.fn()
      render(
        <ProductsPage
          {...defaultProps}
          onManageCategories={onManageCategories}
        />,
      )
      fireEvent.click(screen.getByText('Categorías'))
      expect(onManageCategories).toHaveBeenCalledTimes(1)
    })

    it('debería abrir el producto al hacer clic en una fila', () => {
      const onEdit = vi.fn()
      const product = createMockProduct()
      render(<ProductsPage {...defaultProps} onEdit={onEdit} />)
      fireEvent.click(screen.getAllByRole('row')[1])
      expect(onEdit).toHaveBeenCalledWith(product)
    })
  })

  describe('Estado vacío', () => {
    it('debería mostrar mensaje cuando no hay productos', () => {
      render(<ProductsPage {...defaultProps} products={[]} />)
      expect(
        screen.getByText('No encontramos productos con ese nombre.'),
      ).toBeInTheDocument()
    })

    it('debería mostrar mensaje cuando la búsqueda no retorna resultados', () => {
      render(<ProductsPage {...defaultProps} search="xyz" />)
      expect(
        screen.getByText('No encontramos productos con ese nombre.'),
      ).toBeInTheDocument()
    })
  })

  describe('Variantes múltiples', () => {
    it('debería mostrar filas por cada variante', () => {
      const product = createMockProduct({
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
          {
            id: 'v2',
            productId: 'p1',
            sku: 'PLA-BAS-BLA',
            name: 'Blanco',
            inventoryCost: 80,
            salePrice: 150,
            stock: 30,
            optionValues: [{ optionType: 'Color', value: 'Blanco' }],
          },
        ],
      })
      render(<ProductsPage {...defaultProps} products={[product]} />)
      expect(screen.getByText('PLA-BAS-NEG')).toBeInTheDocument()
      expect(screen.getByText('PLA-BAS-BLA')).toBeInTheDocument()
    })

    it('debería mostrar el nombre del producto una sola vez para variantes múltiples', () => {
      const product = createMockProduct({
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
          {
            id: 'v2',
            productId: 'p1',
            sku: 'PLA-BAS-BLA',
            name: 'Blanco',
            inventoryCost: 80,
            salePrice: 150,
            stock: 30,
            optionValues: [],
          },
        ],
      })
      render(<ProductsPage {...defaultProps} products={[product]} />)
      const nameElements = screen.getAllByText('Playera Básica')
      expect(nameElements).toHaveLength(1)
    })
  })

  describe('Stock bajo', () => {
    it('debería marcar stock como bajo cuando es menor o igual al umbral', () => {
      const product = createMockProduct({
        variants: [
          {
            id: 'v1',
            productId: 'p1',
            sku: 'PLA-BAS-NEG',
            name: 'Negro',
            inventoryCost: 80,
            salePrice: 150,
            stock: 3,
            optionValues: [],
          },
        ],
      })
      render(
        <ProductsPage {...defaultProps} products={[product]} threshold={5} />,
      )
      const stockBadge = screen.getByText('3')
      expect(stockBadge).toHaveClass('text-[#c5804a]')
    })

    it('debería marcar stock como normal cuando es mayor al umbral', () => {
      const product = createMockProduct({
        variants: [
          {
            id: 'v1',
            productId: 'p1',
            sku: 'PLA-BAS-NEG',
            name: 'Negro',
            inventoryCost: 80,
            salePrice: 150,
            stock: 10,
            optionValues: [],
          },
        ],
      })
      render(
        <ProductsPage {...defaultProps} products={[product]} threshold={5} />,
      )
      const stockBadge = screen.getByText('10')
      expect(stockBadge).toHaveClass('text-[#5f9e7c]')
      expect(stockBadge).not.toHaveClass('text-[#c5804a]')
    })
  })
})
