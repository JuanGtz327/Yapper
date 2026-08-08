import { describe, it, expect } from 'vitest'
import { normalizeMexicanWhatsApp } from './whatsapp'

describe('normalizeMexicanWhatsApp', () => {
  it('debería normalizar un número de 10 dígitos agregando 52', () => {
    expect(normalizeMexicanWhatsApp('5512345678')).toBe('525512345678')
  })

  it('debería normalizar un número con formato 521XXXXXXXXXX (12 dígitos)', () => {
    expect(normalizeMexicanWhatsApp('5215512345678')).toBe('525512345678')
  })

  it('debería normalizar un número con formato 52XXXXXXXXXX (12 dígitos)', () => {
    expect(normalizeMexicanWhatsApp('525512345678')).toBe('525512345678')
  })

  it('debería eliminar espacios, guiones y paréntesis', () => {
    expect(normalizeMexicanWhatsApp('55 1234 5678')).toBe('525512345678')
    expect(normalizeMexicanWhatsApp('(55) 1234-5678')).toBe('525512345678')
    expect(normalizeMexicanWhatsApp('55-1234-5678')).toBe('525512345678')
  })

  it('debería eliminar prefijo 00', () => {
    expect(normalizeMexicanWhatsApp('00525512345678')).toBe('525512345678')
  })

  it('debería eliminar prefijo +52', () => {
    expect(normalizeMexicanWhatsApp('+525512345678')).toBe('525512345678')
  })

  it('debería devolver null para números con menos de 10 dígitos', () => {
    expect(normalizeMexicanWhatsApp('551234')).toBeNull()
    expect(normalizeMexicanWhatsApp('')).toBeNull()
  })

  it('debería devolver null para números con más de 12 dígitos', () => {
    expect(normalizeMexicanWhatsApp('5255123456789')).toBeNull()
  })

  it('debería devolver null para caracteres no numéricos inválidos', () => {
    expect(normalizeMexicanWhatsApp('abc')).toBeNull()
  })

  it('debería manejar un número largo con prefijo 00521', () => {
    expect(normalizeMexicanWhatsApp('005215512345678')).toBe('525512345678')
  })
})
