import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase.ts'
import type {
  BusinessSettings,
  Client,
  Order,
  OrderItemInput,
  Product,
  PublicCatalog,
  SalesAggregate,
} from '../types.ts'
import { safeImageUrl } from './security.ts'

type ProductRow = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  published: boolean
  public_description: string
  image_url: string | null
}

type ClientRow = {
  id: string
  name: string
  phone: string
  address: string
}

type OrderRow = {
  id: string
  client_id: string | null
  status: 'pending' | 'delivered' | 'cancelled'
  payment_status: 'pending' | 'paid'
  total: number
  created_at: string
}

type OrderItemRow = { order_id: string; product_id: string; quantity: number }

const colors = ['coral', 'mint', 'sky', 'lavender'] as const

export const defaultSettings: BusinessSettings = {
  businessName: 'Mi negocio',
  currency: 'MXN',
  lowStockThreshold: 5,
  publicCatalogEnabled: false,
  publicSlug: '',
  whatsappNumber: '',
  publicIntro: '',
}

export async function loadProducts(user: User): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(
      'id, name, category, price, stock, published, public_description, image_url',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as ProductRow[]).map((product, index) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    stock: product.stock,
    published: product.published,
    publicDescription: product.public_description,
    imageUrl: safeImageUrl(product.image_url),
    unit: 'pieza',
    color: colors[index % colors.length],
  }))
}

export async function loadClients(user: User): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name, phone, address')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  const clientRows = data as ClientRow[]
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('client_id')
    .eq('user_id', user.id)
    .neq('status', 'cancelled')
  if (orderError) throw orderError
  const orderCounts = (orderData as Array<{ client_id: string | null }>).reduce<
    Record<string, number>
  >((counts, order) => {
    if (order.client_id)
      counts[order.client_id] = (counts[order.client_id] || 0) + 1
    return counts
  }, {})
  return clientRows.map((client) => ({
    ...client,
    zone: client.address || 'Sin zona',
    orders: orderCounts[client.id] || 0,
    initials: getInitials(client.name),
  }))
}

export async function createProduct(
  user: User,
  product: Omit<Product, 'id'>,
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      user_id: user.id,
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      published: product.published,
      public_description: product.publicDescription,
      image_url: product.imageUrl,
    })
    .select(
      'id, name, category, price, stock, published, public_description, image_url',
    )
    .single()
  if (error) throw error
  const row = data as ProductRow
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    stock: row.stock,
    published: row.published,
    publicDescription: row.public_description,
    imageUrl: safeImageUrl(row.image_url),
    unit: product.unit,
    color: product.color,
  }
}

export async function createClient(
  user: User,
  client: Omit<Client, 'id'>,
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      name: client.name,
      phone: client.phone,
      address: client.zone,
    })
    .select('id, name, phone, address')
    .single()
  if (error) throw error
  const row = data as ClientRow
  return {
    ...client,
    id: row.id,
    zone: row.address || 'Sin zona',
    initials: getInitials(row.name),
  }
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function updateProduct(product: Product) {
  const { error } = await supabase.rpc('update_product_atomic', {
    p_product_id: product.id,
    p_name: product.name,
    p_category: product.category,
    p_price: product.price,
    p_stock: product.stock,
    p_published: product.published,
    p_public_description: product.publicDescription,
    p_image_url: product.imageUrl,
  })
  if (error) throw error
}

export async function deleteClient(id: string) {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}

export async function updateClient(client: Client) {
  const { error } = await supabase
    .from('clients')
    .update({ name: client.name, phone: client.phone, address: client.zone })
    .eq('id', client.id)
  if (error) throw error
}

export async function createOrder(
  clientId: string,
  items: OrderItemInput[],
  paymentStatus: 'pending' | 'paid',
) {
  const { data, error } = await supabase.rpc('create_order', {
    p_client_id: clientId,
    p_items: items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    })),
    p_payment_status: paymentStatus,
  })
  if (error) throw error
  return data as string
}

export async function loadOrders(
  user: User,
): Promise<Array<Order & { clientId?: string }>> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, client_id, status, payment_status, total, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  const rows = data as OrderRow[]
  const ids = rows.map((row) => row.id)
  const itemsResult = ids.length
    ? await supabase
        .from('order_items')
        .select('order_id, product_id, quantity')
        .in('order_id', ids)
    : { data: [], error: null }
  if (itemsResult.error) throw itemsResult.error
  const itemRows = itemsResult.data as OrderItemRow[]
  const itemCounts = itemRows.reduce<Record<string, number>>(
    (counts, item) => ({
      ...counts,
      [item.order_id]: (counts[item.order_id] || 0) + item.quantity,
    }),
    {},
  )
  return rows.map((row) => ({
    id: `#${row.id.slice(0, 6).toUpperCase()}`,
    databaseId: row.id,
    clientId: row.client_id ?? undefined,
    client: 'Cliente sin nombre',
    date: new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(row.created_at)),
    items: itemCounts[row.id] || 0,
    itemLines: itemRows
      .filter((item) => item.order_id === row.id)
      .map(({ product_id, quantity }) => ({ productId: product_id, quantity })),
    total: row.total,
    status:
      row.status === 'delivered'
        ? 'Entregado'
        : row.status === 'cancelled'
          ? 'Cancelado'
          : 'Pendiente',
    payment: row.payment_status === 'paid' ? 'Pagado' : 'Pendiente',
  }))
}

export async function updateOrderStatus(
  id: string,
  status: 'pending' | 'delivered',
) {
  const { error } = await supabase.rpc('update_order_status', {
    p_order_id: id,
    p_status: status,
  })
  if (error) throw error
}

export async function cancelOrder(id: string) {
  const { error } = await supabase.rpc('cancel_order', { p_order_id: id })
  if (error) throw error
}

export async function updateOrderPayment(
  id: string,
  paymentStatus: 'pending' | 'paid',
) {
  const { error } = await supabase.rpc('update_order_payment', {
    p_order_id: id,
    p_payment_status: paymentStatus,
  })
  if (error) throw error
}

export async function loadSettings(user: User): Promise<BusinessSettings> {
  const { data, error } = await supabase
    .from('business_settings')
    .select(
      'business_name, currency, low_stock_threshold, public_catalog_enabled, public_slug, whatsapp_number, public_intro',
    )
    .eq('user_id', user.id)
    .maybeSingle()
  if (error) throw error
  if (!data) return defaultSettings
  return {
    businessName: data.business_name,
    currency: data.currency,
    lowStockThreshold: data.low_stock_threshold,
    publicCatalogEnabled: data.public_catalog_enabled,
    publicSlug: data.public_slug ?? '',
    whatsappNumber: data.whatsapp_number ?? '',
    publicIntro: data.public_intro ?? '',
  }
}

export async function saveSettings(
  user: User,
  settings: BusinessSettings,
): Promise<BusinessSettings> {
  const publicSlug = settings.publicSlug ?? ''
  const { data, error } = await supabase
    .from('business_settings')
    .upsert({
      user_id: user.id,
      business_name: settings.businessName,
      currency: settings.currency,
      low_stock_threshold: settings.lowStockThreshold,
      public_catalog_enabled: settings.publicCatalogEnabled,
      public_slug: publicSlug,
      whatsapp_number: settings.whatsappNumber ?? '',
      public_intro: settings.publicIntro ?? '',
    })
    .select(
      'business_name, currency, low_stock_threshold, public_catalog_enabled, public_slug, whatsapp_number, public_intro',
    )
    .single()
  if (error) throw error
  return {
    businessName: data.business_name,
    currency: data.currency,
    lowStockThreshold: data.low_stock_threshold,
    publicCatalogEnabled: data.public_catalog_enabled,
    publicSlug: data.public_slug ?? '',
    whatsappNumber: data.whatsapp_number ?? '',
    publicIntro: data.public_intro ?? '',
  }
}

export async function loadPublicCatalog(
  slug: string,
): Promise<PublicCatalog | null> {
  const { data, error } = await supabase.rpc('get_public_catalog', {
    p_slug: slug,
  })
  if (error) throw error
  if (!data || !Array.isArray(data) || data.length === 0) return null
  const row = data[0] as {
    business_name: string
    currency: string
    whatsapp_number: string
    public_intro: string
    products: PublicCatalog['products']
  }
  return {
    businessName: row.business_name,
    currency: row.currency,
    whatsappNumber: row.whatsapp_number,
    publicIntro: row.public_intro,
    products: (row.products ?? []).map((product) => ({
      ...product,
      imageUrl: safeImageUrl(product.imageUrl),
    })),
  }
}

export async function loadSalesAggregates(
  period: '7d' | '6m',
): Promise<SalesAggregate[]> {
  const { data, error } = await supabase.rpc('sales_aggregates', {
    p_period: period,
  })
  if (error) throw error
  return (data as Array<{ label: string; total: number; orders: number }>).map(
    (row) => ({
      label: row.label,
      total: Number(row.total),
      orders: Number(row.orders),
    }),
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
