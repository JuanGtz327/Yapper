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
  paidAmount: number
  status: 'Pendiente' | 'Entregado' | 'Cancelado'
  payment: 'Pagado' | 'Pendiente' | 'Parcial'
  itemLines?: OrderItemInput[]
}

export type OrderPayment = {
  id: string
  orderId: string
  amount: number
  paymentMethod: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Otro'
  reference: string | null
  notes: string | null
  createdAt: string
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

export type PublicCatalogVariant = {
  name: string
  optionValues: Array<{ optionType: string; value: string }>
  salePrice: number
  stock: number
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
    > & { price: number; variants: PublicCatalogVariant[] }
  >
}

export type SalesAggregate = {
  label: string
  total: number
  orders: number
}

export type PaginationParams = {
  page: number
  pageSize: number
}

export type PaginatedResult<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type ProductFilters = {
  search?: string
  categoryId?: string
  published?: boolean
  stock?: 'available' | 'low' | 'out'
  stockThreshold?: number
}

export type ClientFilters = {
  search?: string
}

export type OrderFilters = {
  search?: string
  clientId?: string
  status?: 'pending' | 'delivered' | 'cancelled'
  paymentStatus?: 'pending' | 'partial' | 'paid' | 'paidOrPartial'
  dateFrom?: string
  dateTo?: string
  orderDate?: string
}

export type OptionTypeWithValues = {
  id: string
  name: string
  values: Array<{ id: string; name: string }>
}

export type Category = {
  id: string
  name: string
}

export type VariantOption = {
  variant: Variant
  productName: string
}

export type OrderDraftLine = {
  variantId: string
  quantity: number
  unitPrice?: number
}

// Query-result shapes from repository.ts - not full DB rows.
// These represent specific .select() projections, not the generated Tables<> types.

export type ProductRow = {
  id: string
  name: string
  category_id: string | null
  published: boolean
  public_description: string
  image_url: string | null
}

export type VariantRow = {
  id: string
  product_id: string
  sku: string
  name: string
  inventory_cost: number
  sale_price: number
  stock: number
  option_values: Array<{ option_type: string; value: string }> | null
}

export type CategoryRow = { id: string; name: string }

export type OptionTypeRow = { id: string; name: string }

export type OptionValueRow = {
  id: string
  option_type_id: string
  name: string
}

export type ClientRow = {
  id: string
  name: string
  phone: string
  address: string
}

export type OrderRow = {
  id: string
  client_id: string | null
  status: 'pending' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'partial' | 'paid'
  total: number
  paid_amount: number
  created_at: string
  order_number: string | null
  client_name_snapshot: string
}

export type OrderItemRow = {
  order_id: string
  variant_id: string
  quantity: number
  sku_snapshot: string
  product_name_snapshot: string
  variant_label_snapshot: string
  unit_price: number
  unit_cost_snapshot: number
  line_total: number
}

export type VariantPriceHistoryRow = {
  id: string
  variant_id: string | null
  product_id: string | null
  sku: string
  variant_name: string
  sale_price: number
  inventory_cost: number
  changed_at: string
}

export type VariantPriceHistory = {
  id: string
  variantId: string | null
  productId: string | null
  sku: string
  variantName: string
  salePrice: number
  inventoryCost: number
  changedAt: string
}

export type VariantRestockHistoryRow = {
  id: string
  variant_id: string
  product_id: string
  sku: string
  variant_name: string
  quantity: number
  unit_cost: number
  restocked_at: string
}

export type VariantRestockHistory = {
  id: string
  variantId: string
  productId: string
  sku: string
  variantName: string
  quantity: number
  unitCost: number
  restockedAt: string
}
