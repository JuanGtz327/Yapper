export type OptionType = {
  id: string
  name: string
}

export type OptionValue = {
  id: string
  optionTypeId: string
  name: string
}

export type Variant = {
  id: string
  productId: string
  sku: string
  name: string
  inventoryCost: number
  salePrice: number
  stock: number
  optionValues: Array<{ optionType: string; value: string }>
}

export type Product = {
  id: string
  name: string
  category: string
  categoryId: string | null
  published: boolean
  publicDescription: string
  imageUrl: string | null
  color: string
  variants: Variant[]
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
  clientNameSnapshot?: string
  date: string
  createdAt?: string
  items: number
  total: number
  status: 'Pendiente' | 'Entregado' | 'Cancelado'
  payment: 'Pagado' | 'Pendiente'
  itemLines?: OrderItemInput[]
}

export type OrderItemInput = {
  variantId: string
  quantity: number
  productNameSnapshot?: string
  skuSnapshot?: string
  variantLabelSnapshot?: string
  unitPrice?: number
  unitCostSnapshot?: number
  lineTotal?: number
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
      'id' | 'name' | 'category' | 'publicDescription' | 'imageUrl' | 'color'
    > & { price: number }
  >
}

export type SalesAggregate = {
  label: string
  total: number
  orders: number
}
