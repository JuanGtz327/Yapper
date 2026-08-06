export type Product = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  unit: string
  color: string
  published: boolean
  publicDescription: string
  imageUrl: string | null
}

export type Client = {
  id: string
  name: string
  phone: string
  zone: string
  orders: number
  initials: string
}

export type Order = {
  id: string
  databaseId?: string
  clientId?: string
  client: string
  date: string
  items: number
  total: number
  status: 'Pendiente' | 'Entregado' | 'Cancelado'
  payment: 'Pagado' | 'Pendiente'
  itemLines?: OrderItemInput[]
}

export type OrderItemInput = {
  productId: string
  quantity: number
}

export type BusinessSettings = {
  businessName: string
  currency: string
  lowStockThreshold: number
  publicCatalogEnabled: boolean
  publicSlug: string
  whatsappNumber: string
  publicIntro: string
}

export type PublicCatalog = {
  businessName: string
  currency: string
  whatsappNumber: string
  publicIntro: string
  products: Array<
    Pick<
      Product,
      | 'id'
      | 'name'
      | 'category'
      | 'price'
      | 'publicDescription'
      | 'imageUrl'
      | 'color'
    >
  >
}

export type SalesAggregate = {
  label: string
  total: number
  orders: number
}
