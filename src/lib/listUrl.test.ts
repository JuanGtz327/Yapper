import { describe, expect, it } from 'vitest'
import { joinLocationSearch, readListUrl, writeListUrl } from './listUrl.ts'

describe('listUrl', () => {
  it('combines Wouter pathname and search without dropping the separator', () => {
    const location = joinLocationSearch('/pedidos', 'page=2')
    expect(location).toBe('/pedidos?page=2')
    expect(readListUrl(location).page).toBe(2)
  })

  it('reads supported filters and normalizes invalid values', () => {
    expect(
      readListUrl(
        '/pedidos?page=3&search=PED-12&delivery=delivered&payment=paid',
      ),
    ).toEqual({
      page: 3,
      search: 'PED-12',
      categoryId: '',
      stock: '',
      delivery: 'delivered',
      payment: 'paid',
    })
    expect(readListUrl('/almacen?page=0&stock=invalid')).toMatchObject({
      page: 1,
      stock: '',
    })
  })

  it('writes only active values and preserves the pathname', () => {
    expect(
      writeListUrl('/clientes?page=2&search=Ana', {
        search: '  Juan ',
        page: 1,
      }),
    ).toBe('/clientes?search=Juan')
  })
})
