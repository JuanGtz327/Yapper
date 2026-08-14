import { describe, it, expect } from 'vitest'
import { isSafeImageUrl, safeImageUrl } from './security'

describe('isSafeImageUrl', () => {
  it('debería aceptar URLs HTTPS válidas', () => {
    expect(isSafeImageUrl('https://example.com/image.jpg')).toBe(true)
    expect(
      isSafeImageUrl(
        'https://cdn.supabase.co/storage/v1/object/public/img.png',
      ),
    ).toBe(true)
  })

  it('debería rechazar URLs HTTP', () => {
    expect(isSafeImageUrl('http://example.com/image.jpg')).toBe(false)
  })

  it('debería rechazar data URIs', () => {
    expect(isSafeImageUrl('data:image/png;base64,abc')).toBe(false)
  })

  it('debería rechazar javascript: URIs', () => {
    expect(isSafeImageUrl('javascript:alert(1)')).toBe(false)
  })

  it('debería rechazar null, undefined y string vacío', () => {
    expect(isSafeImageUrl(null)).toBe(false)
    expect(isSafeImageUrl(undefined)).toBe(false)
    expect(isSafeImageUrl('')).toBe(false)
  })

  it('debería rechazar URLs malformadas', () => {
    expect(isSafeImageUrl('not-a-url')).toBe(false)
    expect(isSafeImageUrl('://missing-protocol')).toBe(false)
  })
})

describe('safeImageUrl', () => {
  it('debería devolver la URL si es segura', () => {
    const url = 'https://example.com/image.jpg'
    expect(safeImageUrl(url)).toBe(url)
  })

  it('debería devolver null si la URL no es segura', () => {
    expect(safeImageUrl('http://example.com/image.jpg')).toBeNull()
    expect(safeImageUrl('data:image/png;base64,abc')).toBeNull()
    expect(safeImageUrl(null)).toBeNull()
    expect(safeImageUrl(undefined)).toBeNull()
  })
})
