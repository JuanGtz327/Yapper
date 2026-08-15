import { useEffect, useState } from 'react'
import type { SetStateAction } from 'react'

export const PAGE_SIZE = 25

export function joinLocationSearch(pathname: string, search: string): string {
  return search ? `${pathname}?${search}` : pathname
}

export type ListUrlState = {
  page: number
  search: string
  categoryId: string
  stock: '' | 'available' | 'low' | 'out'
  delivery: '' | 'pending' | 'delivered' | 'cancelled'
  payment: '' | 'pending' | 'paid'
}

function validPage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export function readListUrl(location: string): ListUrlState {
  const params = new URLSearchParams(location.split('?')[1] ?? '')
  const stock = params.get('stock')
  const delivery = params.get('delivery')
  const payment = params.get('payment')
  return {
    page: validPage(params.get('page')),
    search: params.get('search') ?? '',
    categoryId: params.get('category') ?? '',
    stock:
      stock === 'available' || stock === 'low' || stock === 'out' ? stock : '',
    delivery:
      delivery === 'pending' ||
      delivery === 'delivered' ||
      delivery === 'cancelled'
        ? delivery
        : '',
    payment: payment === 'pending' || payment === 'paid' ? payment : '',
  }
}

export function writeListUrl(
  location: string,
  updates: Partial<ListUrlState>,
): string {
  const [pathname] = location.split('?')
  const current = readListUrl(location)
  const next = { ...current, ...updates }
  const params = new URLSearchParams()
  if (next.page > 1) params.set('page', String(next.page))
  if (next.search.trim()) params.set('search', next.search.trim())
  if (next.categoryId) params.set('category', next.categoryId)
  if (next.stock) params.set('stock', next.stock)
  if (next.delivery) params.set('delivery', next.delivery)
  if (next.payment) params.set('payment', next.payment)
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

export function useDebouncedUrlSearch(
  location: string,
  setLocation: (path: string) => void,
): [string, (value: SetStateAction<string>) => void] {
  const urlSearch = readListUrl(location).search
  const [search, setSearch] = useState(urlSearch)

  useEffect(() => {
    setSearch(urlSearch)
  }, [urlSearch])

  useEffect(() => {
    if (search === urlSearch) return
    const timer = window.setTimeout(() => {
      setLocation(writeListUrl(location, { search, page: 1 }))
    }, 350)
    return () => window.clearTimeout(timer)
  }, [location, search, setLocation, urlSearch])

  return [search, setSearch]
}
