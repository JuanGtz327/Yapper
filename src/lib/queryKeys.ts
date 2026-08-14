import type { User } from '@supabase/supabase-js'

function uid(user: User | null): string {
  return user?.id ?? 'demo'
}

export const qk = {
  products: (user: User | null) => ['users', uid(user), 'products'] as const,
  clients: (user: User | null) => ['users', uid(user), 'clients'] as const,
  orders: (user: User | null) => ['users', uid(user), 'orders'] as const,
  orderPayments: (orderId: string) => ['orderPayments', orderId] as const,
  settings: (user: User | null) => ['users', uid(user), 'settings'] as const,
  sales: (user: User | null, period: '7d' | '6m') =>
    ['users', uid(user), 'sales', period] as const,
  categories: (user: User | null) =>
    ['users', uid(user), 'categories'] as const,
  optionTypes: (user: User | null) =>
    ['users', uid(user), 'optionTypes'] as const,
  publicCatalog: (slug: string) => ['publicCatalog', slug] as const,
}
