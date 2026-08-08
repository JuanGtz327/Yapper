import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CategoryManagerModal } from './CategoryManagerModal'
import * as repository from '../../lib/repository.ts'

vi.mock('../../lib/repository.ts', () => ({
  createCategory: vi.fn(),
  deleteCategory: vi.fn(),
}))

const mockCategories = [
  { id: 'cat1', name: 'Ropa' },
  { id: 'cat2', name: 'Accesorios' },
  { id: 'cat3', name: 'Electrónica' },
]

const defaultProps = {
  categories: mockCategories,
  onSelect: vi.fn(),
  onCategoryCreated: vi.fn(),
  onClose: vi.fn(),
}

describe('CategoryManagerModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Renderizado', () => {
    it('debería mostrar el título "Categorías"', () => {
      render(<CategoryManagerModal {...defaultProps} />)
      expect(screen.getByText('Categorías')).toBeInTheDocument()
    })

    it('debería mostrar el campo de entrada para nueva categoría', () => {
      render(<CategoryManagerModal {...defaultProps} />)
      expect(
        screen.getByPlaceholderText('Nueva categoría...'),
      ).toBeInTheDocument()
    })

    it('debería mostrar el botón de añadir', () => {
      render(<CategoryManagerModal {...defaultProps} />)
      expect(screen.getByText('Añadir')).toBeInTheDocument()
    })

    it('debería mostrar la lista de categorías existentes', () => {
      render(<CategoryManagerModal {...defaultProps} />)
      expect(screen.getByText('Ropa')).toBeInTheDocument()
      expect(screen.getByText('Accesorios')).toBeInTheDocument()
      expect(screen.getByText('Electrónica')).toBeInTheDocument()
    })

    it('debería mostrar botón de cerrar', () => {
      render(<CategoryManagerModal {...defaultProps} />)
      expect(screen.getByLabelText('Cerrar')).toBeInTheDocument()
    })
  })

  describe('Estado vacío', () => {
    it('debería mostrar mensaje cuando no hay categorías', () => {
      render(<CategoryManagerModal {...defaultProps} categories={[]} />)
      expect(
        screen.getByText('No hay categorías todavía'),
      ).toBeInTheDocument()
    })
  })

  describe('Creación de categoría', () => {
    it('debería llamar a createCategory al enviar el formulario', async () => {
      const createCategory = vi.fn().mockResolvedValue('new-cat-id')
      vi.mocked(repository.createCategory).mockImplementation(createCategory)

      render(<CategoryManagerModal {...defaultProps} />)

      const input = screen.getByPlaceholderText('Nueva categoría...')
      fireEvent.change(input, { target: { value: 'Nueva categoría' } })

      fireEvent.click(screen.getByText('Añadir'))

      await waitFor(() => {
        expect(createCategory).toHaveBeenCalledWith('Nueva categoría')
      })
    })

    it('debería llamar a onCategoryCreated después de crear', async () => {
      const createCategory = vi.fn().mockResolvedValue('new-cat-id')
      vi.mocked(repository.createCategory).mockImplementation(createCategory)
      const onCategoryCreated = vi.fn()

      render(
        <CategoryManagerModal
          {...defaultProps}
          onCategoryCreated={onCategoryCreated}
        />,
      )

      const input = screen.getByPlaceholderText('Nueva categoría...')
      fireEvent.change(input, { target: { value: 'Nueva categoría' } })

      fireEvent.click(screen.getByText('Añadir'))

      await waitFor(() => {
        expect(onCategoryCreated).toHaveBeenCalledTimes(1)
      })
    })

    it('debería llamar a onSelect con el ID de la nueva categoría', async () => {
      const createCategory = vi.fn().mockResolvedValue('new-cat-id')
      vi.mocked(repository.createCategory).mockImplementation(createCategory)
      const onSelect = vi.fn()

      render(<CategoryManagerModal {...defaultProps} onSelect={onSelect} />)

      const input = screen.getByPlaceholderText('Nueva categoría...')
      fireEvent.change(input, { target: { value: 'Nueva categoría' } })

      fireEvent.click(screen.getByText('Añadir'))

      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledWith('new-cat-id')
      })
    })

    it('debería limpiar el campo después de crear exitosamente', async () => {
      const createCategory = vi.fn().mockResolvedValue('new-cat-id')
      vi.mocked(repository.createCategory).mockImplementation(createCategory)

      render(<CategoryManagerModal {...defaultProps} />)

      const input = screen.getByPlaceholderText('Nueva categoría...')
      fireEvent.change(input, { target: { value: 'Nueva categoría' } })

      fireEvent.click(screen.getByText('Añadir'))

      await waitFor(() => {
        expect((input as HTMLInputElement).value).toBe('')
      })
    })

    it('debería mostrar error cuando createCategory falla', async () => {
      const createCategory = vi.fn().mockRejectedValue(new Error('DB error'))
      vi.mocked(repository.createCategory).mockImplementation(createCategory)

      render(<CategoryManagerModal {...defaultProps} />)

      const input = screen.getByPlaceholderText('Nueva categoría...')
      fireEvent.change(input, { target: { value: 'Nueva categoría' } })

      fireEvent.click(screen.getByText('Añadir'))

      await waitFor(() => {
        expect(
          screen.getByText('No pudimos crear la categoría.'),
        ).toBeInTheDocument()
      })
    })

    it('debería deshabilitar el botón cuando el nombre está vacío', () => {
      render(<CategoryManagerModal {...defaultProps} />)

      const button = screen.getByText('Añadir')
      expect(button).toBeDisabled()
    })

    it('debería habilitar el botón cuando hay un nombre', () => {
      render(<CategoryManagerModal {...defaultProps} />)

      const input = screen.getByPlaceholderText('Nueva categoría...')
      fireEvent.change(input, { target: { value: 'Nueva' } })

      const button = screen.getByText('Añadir')
      expect(button).not.toBeDisabled()
    })
  })

  describe('Eliminación de categoría', () => {
    it('debería llamar a deleteCategory al hacer clic en eliminar', async () => {
      const deleteCategory = vi.fn().mockResolvedValue(undefined)
      vi.mocked(repository.deleteCategory).mockImplementation(deleteCategory)

      render(<CategoryManagerModal {...defaultProps} />)

      fireEvent.click(screen.getByLabelText('Eliminar Ropa'))

      await waitFor(() => {
        expect(deleteCategory).toHaveBeenCalledWith('cat1')
      })
    })

    it('debería llamar a onCategoryCreated después de eliminar', async () => {
      const deleteCategory = vi.fn().mockResolvedValue(undefined)
      vi.mocked(repository.deleteCategory).mockImplementation(deleteCategory)
      const onCategoryCreated = vi.fn()

      render(
        <CategoryManagerModal
          {...defaultProps}
          onCategoryCreated={onCategoryCreated}
        />,
      )

      fireEvent.click(screen.getByLabelText('Eliminar Ropa'))

      await waitFor(() => {
        expect(onCategoryCreated).toHaveBeenCalledTimes(1)
      })
    })

    it('debería mostrar error cuando deleteCategory falla', async () => {
      const deleteCategory = vi.fn().mockRejectedValue(new Error('DB error'))
      vi.mocked(repository.deleteCategory).mockImplementation(deleteCategory)

      render(<CategoryManagerModal {...defaultProps} />)

      fireEvent.click(screen.getByLabelText('Eliminar Ropa'))

      await waitFor(() => {
        expect(
          screen.getByText('No pudimos eliminar la categoría.'),
        ).toBeInTheDocument()
      })
    })
  })

  describe('Selección de categoría', () => {
    it('debería llamar a onSelect al hacer clic en una categoría', () => {
      const onSelect = vi.fn()
      render(<CategoryManagerModal {...defaultProps} onSelect={onSelect} />)

      fireEvent.click(screen.getByText('Ropa'))

      expect(onSelect).toHaveBeenCalledWith('cat1')
    })
  })

  describe('Cierre del modal', () => {
    it('debería llamar a onClose al hacer clic en cerrar', () => {
      const onClose = vi.fn()
      render(<CategoryManagerModal {...defaultProps} onClose={onClose} />)

      fireEvent.click(screen.getByLabelText('Cerrar'))

      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accesibilidad', () => {
    it('debería tener aria-label en el campo de entrada', () => {
      render(<CategoryManagerModal {...defaultProps} />)
      expect(
        screen.getByLabelText('Nombre de la nueva categoría'),
      ).toBeInTheDocument()
    })

    it('debería tener aria-label en botones de eliminar', () => {
      render(<CategoryManagerModal {...defaultProps} />)
      expect(screen.getByLabelText('Eliminar Ropa')).toBeInTheDocument()
      expect(screen.getByLabelText('Eliminar Accesorios')).toBeInTheDocument()
    })
  })
})
