import type { User } from '@supabase/supabase-js'
import type {
  ClientFilters,
  PaginationParams,
  OrderFilters,
  ProductFilters,
} from '../types.ts'

function uid(user: User | null): string {
  return user?.id ?? 'demo'
}

export const qk = {
  products: (user: User | null) => ['users', uid(user), 'products'] as const,
  productsPage: (
    user: User | null,
    pagination: PaginationParams,
    filters: ProductFilters,
  ) => ['users', uid(user), 'products', 'page', pagination, filters] as const,
  clients: (user: User | null) => ['users', uid(user), 'clients'] as const,
  clientsPage: (
    user: User | null,
    pagination: PaginationParams,
    filters: ClientFilters,
  ) => ['users', uid(user), 'clients', 'page', pagination, filters] as const,
  orders: (user: User | null) => ['users', uid(user), 'orders'] as const,
  ordersPage: (
    user: User | null,
    pagination: PaginationParams,
    filters: OrderFilters,
  ) => ['users', uid(user), 'orders', 'page', pagination, filters] as const,
  orderPayments: (orderId: string) => ['orderPayments', orderId] as const,
  settings: (user: User | null) => ['users', uid(user), 'settings'] as const,
  sales: (user: User | null, period: '7d' | '6m') =>
    ['users', uid(user), 'sales', period] as const,
  categories: (user: User | null) =>
    ['users', uid(user), 'categories'] as const,
  optionTypes: (user: User | null) =>
    ['users', uid(user), 'optionTypes'] as const,
  publicCatalog: (slug: string) => ['publicCatalog', slug] as const,
  variantPriceHistory: (user: User | null, variantId: string) =>
    ['users', uid(user), 'variantPriceHistory', variantId] as const,
  productDetail: (user: User | null, productId: string) =>
    ['users', uid(user), 'productDetail', productId] as const,
}
