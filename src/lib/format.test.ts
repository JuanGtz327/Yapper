import { describe, it, expect } from 'vitest'
import { formatMoney } from './format'

describe('formatMoney', () => {
  it('debería formatear MXN con separadores de miles y 2 decimales', () => {
    const result = formatMoney(1234.56, 'MXN')
    expect(result).toBe('$1,234.56')
  })

  it('debería mostrar 2 decimales siempre', () => {
    expect(formatMoney(99.99, 'MXN')).toBe('$99.99')
    expect(formatMoney(100, 'MXN')).toBe('$100.00')
    expect(formatMoney(100.5, 'MXN')).toBe('$100.50')
  })

  it('debería formatear cero correctamente', () => {
    expect(formatMoney(0, 'MXN')).toBe('$0.00')
  })

  it('debería formatear negativos con formato contable (paréntesis)', () => {
    expect(formatMoney(-500, 'MXN')).toBe('($500.00)')
    expect(formatMoney(-1234.56, 'MXN')).toBe('($1,234.56)')
  })

  it('debería usar MXN como moneda por defecto', () => {
    const result = formatMoney(100)
    expect(result).toBe('$100.00')
  })

  it('debería formatear números grandes correctamente', () => {
    expect(formatMoney(1000000, 'MXN')).toBe('$1,000,000.00')
    expect(formatMoney(999999.99, 'MXN')).toBe('$999,999.99')
  })

  it('debería manejar decimales correctamente', () => {
    expect(formatMoney(1.5, 'MXN')).toBe('$1.50')
    expect(formatMoney(1.555, 'MXN')).toBe('$1.56')
  })
})
