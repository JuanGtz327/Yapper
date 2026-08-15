import { describe, it, expect } from 'vitest'
import { filterOptions } from './filterOptions'

const options = [
  { value: '1', label: 'Categoría' },
  { value: '2', label: 'Cliente' },
  { value: '3', label: 'Tupper rectangular 1L' },
  { value: '4', label: 'Año' },
]

describe('filterOptions', () => {
  it('debería devolver todas las opciones con query vacío', () => {
    expect(filterOptions(options, '')).toEqual(options)
    expect(filterOptions(options, '   ')).toEqual(options)
  })

  it('debería filtrar por substring', () => {
    expect(filterOptions(options, 'cli')).toEqual([options[1]])
  })

  it('debería ser insensible a mayúsculas', () => {
    expect(filterOptions(options, 'CATEGORIA')).toEqual([options[0]])
    expect(filterOptions(options, 'categoría')).toEqual([options[0]])
  })

  it('debería ser insensible a acentos', () => {
    expect(filterOptions(options, 'categoria')).toEqual([options[0]])
    expect(filterOptions(options, 'ano')).toEqual([options[3]])
  })

  it('debería devolver lista vacía cuando no hay coincidencia', () => {
    expect(filterOptions(options, 'xyz')).toEqual([])
  })

  it('debería respetar el orden original', () => {
    const result = filterOptions(
      [
        { value: 'a', label: 'Pendientes' },
        { value: 'b', label: 'Entregados' },
      ],
      'e',
    )
    expect(result.map((o) => o.value)).toEqual(['a', 'b'])
  })
})
