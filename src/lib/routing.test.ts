import { describe, it, expect } from 'vitest'
import { getPublicCatalogSlug } from './routing'

describe('getPublicCatalogSlug', () => {
  it('debería extraer el slug de una ruta válida /tienda/{slug}', () => {
    expect(getPublicCatalogSlug('/tienda/mi-negocio')).toBe('mi-negocio')
  })

  it('debería extraer el slug con barra final', () => {
    expect(getPublicCatalogSlug('/tienda/mi-negocio/')).toBe('mi-negocio')
  })

  it('debería decodificar slugs con caracteres especiales', () => {
    expect(getPublicCatalogSlug('/tienda/mi%20negocio')).toBe('mi negocio')
    expect(getPublicCatalogSlug('/tienda/café-y-pastel')).toBe('café-y-pastel')
  })

  it('debería devolver null para rutas que no coinciden', () => {
    expect(getPublicCatalogSlug('/')).toBeNull()
    expect(getPublicCatalogSlug('/tienda')).toBeNull()
    expect(getPublicCatalogSlug('/catalogo/mi-negocio')).toBeNull()
    expect(getPublicCatalogSlug('/tienda/mi-negocio/sub')).toBeNull()
  })

  it('debería devolver null para slugs vacíos', () => {
    expect(getPublicCatalogSlug('/tienda/')).toBeNull()
  })

  it('debería manejar slugs con números y guiones', () => {
    expect(getPublicCatalogSlug('/tienda/tienda-123')).toBe('tienda-123')
  })
})
