import type { Page } from './navigation.ts'

export const routes = {
  home: '/',
  orders: '/pedidos',
  orderNew: '/pedidos/nuevo',
  orderDetail: '/pedidos/:orderId',
  orderEdit: '/pedidos/:orderId/editar',
  products: '/almacen',
  productNew: '/almacen/nuevo',
  productDetail: '/almacen/:productId',
  productEdit: '/almacen/:productId/editar',
  clients: '/clientes',
  catalog: '/tienda',
  publicCatalog: '/tienda/:slug',
  stats: '/estadisticas',
  settings: '/ajustes',
} as const

export type RoutePath = (typeof routes)[keyof typeof routes]

export function routeToPage(pathname: string): Page {
  if (pathname === routes.home) return 'Inicio'
  if (
    pathname === routes.orders ||
    pathname === routes.orderNew ||
    pathname.startsWith(routes.orders + '/')
  )
    return 'Pedidos'
  if (
    pathname === routes.products ||
    pathname === routes.productNew ||
    pathname.startsWith(routes.products + '/')
  )
    return 'Almacén'
  if (pathname === routes.clients) return 'Clientes'
  if (pathname === routes.catalog || pathname.startsWith(routes.catalog + '/'))
    return 'Tienda'
  if (pathname === routes.stats) return 'Estadísticas'
  if (pathname === routes.settings) return 'Ajustes'
  return 'Inicio'
}

export function pageToPathname(page: string): string {
  switch (page) {
    case 'Inicio':
      return routes.home
    case 'Pedidos':
      return routes.orders
    case 'Almacén':
      return routes.products
    case 'Clientes':
      return routes.clients
    case 'Tienda':
      return routes.catalog
    case 'Estadísticas':
      return routes.stats
    case 'Ajustes':
      return routes.settings
    default:
      return routes.home
  }
}
