import { describe, it, expect } from 'vitest'
import { formatMoney } from './format'

describe('formatMoney', () => {
  it('debería formatear MXN correctamente con separadores de miles', () => {
    const result = formatMoney(1234.56, 'MXN')
    expect(result).toBe('$1,235')
  })

  it('debería redondear decimales (maximumFractionDigits: 0)', () => {
    expect(formatMoney(99.99, 'MXN')).toBe('$100')
    expect(formatMoney(100.4, 'MXN')).toBe('$100')
    expect(formatMoney(100.6, 'MXN')).toBe('$101')
  })

  it('debería formatear cero correctamente', () => {
    expect(formatMoney(0, 'MXN')).toBe('$0')
  })

  it('debería formatear negativos correctamente', () => {
    expect(formatMoney(-500, 'MXN')).toBe('-$500')
    expect(formatMoney(-1234.56, 'MXN')).toBe('-$1,235')
  })

  it('debería usar MXN como moneda por defecto', () => {
    const result = formatMoney(100)
    expect(result).toBe('$100')
  })

  it('debería formatear números grandes correctamente', () => {
    expect(formatMoney(1000000, 'MXN')).toBe('$1,000,000')
    expect(formatMoney(999999.99, 'MXN')).toBe('$1,000,000')
  })

  it('debería manejar un decimal', () => {
    expect(formatMoney(1.5, 'MXN')).toBe('$2')
  })
})
