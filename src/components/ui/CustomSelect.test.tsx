import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomSelect } from './CustomSelect'

const options = [
  { value: '1', label: 'Accesorios' },
  { value: '2', label: 'Comida casera' },
  { value: '3', label: 'Hogar y cocina' },
  { value: '4', label: 'Ropa' },
]

describe('CustomSelect searchable', () => {
  it('debería mostrar el input de búsqueda y filtrar opciones', async () => {
    const user = userEvent.setup()
    render(
      <CustomSelect
        value=""
        searchable
        options={options}
        onChange={() => {}}
        ariaLabel="Categoría"
      />,
    )

    await user.click(screen.getByRole('combobox', { name: 'Categoría' }))

    const searchInput = screen.getByPlaceholderText('Buscar...')
    expect(searchInput).toBeInTheDocument()

    await user.type(searchInput, 'ropa')
    expect(screen.getByText('Ropa')).toBeInTheDocument()
    expect(screen.queryByText('Accesorios')).not.toBeInTheDocument()
  })
})
