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
  Variant,
} from '../types.ts'
import { safeImageUrl } from './security.ts'

type ProductRow = {
  id: string
  name: string
  category_id: string | null
  published: boolean
  public_description: string
  image_url: string | null
}

type VariantRow = {
  id: string
  product_id: string
  sku: string
  name: string
  inventory_cost: number
  sale_price: number
  stock: number
  option_values: Array<{ option_type: string; value: string }> | null
}

type CategoryRow = { id: string; name: string }

type OptionTypeRow = { id: string; name: string }

type OptionValueRow = { id: string; option_type_id: string; name: string }

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
  order_number: string | null
  client_name_snapshot: string
}

type OrderItemRow = {
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

// ─── PRODUCTS ────────────────────────────────────────────────

export async function loadProducts(user: User): Promise<Product[]> {
  const { data: productRows, error: productError } = await supabase
    .from('products')
    .select(
      'id, name, category_id, published, public_description, image_url',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (productError) throw productError

  const products = productRows as unknown as ProductRow[]
  if (!products.length) return []

  const productIds = products.map((p) => p.id)

  const { data: variantRows, error: variantError } = await supabase
    .from('product_variants')
    .select('id, product_id, sku, name, inventory_cost, sale_price, stock')
    .in('product_id', productIds)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
  if (variantError) throw variantError

  const variants = (variantRows ?? []) as VariantRow[]

  // Load option values for all variants
  const variantIds = variants.map((v) => v.id)
  let optionMap: Record<
    string,
    Array<{ optionType: string; value: string }>
  > = {}
  if (variantIds.length) {
    const { data: vovRows } = await supabase
      .from('variant_option_values')
      .select(
        'variant_id, option_values!inner(id, option_type_id, name, option_types!inner(name))',
      )
      .in('variant_id', variantIds)
    if (vovRows) {
      for (const row of vovRows as unknown as Array<{
        variant_id: string
        option_values: { name: string; option_types: { name: string } }
      }>) {
        if (!optionMap[row.variant_id]) optionMap[row.variant_id] = []
        optionMap[row.variant_id].push({
          optionType: row.option_values.option_types.name,
          value: row.option_values.name,
        })
      }
    }
  }

  // Load category names for products without category_id
  const { data: categoryRows } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', user.id)
  const categoryMap = new Map(
    ((categoryRows as CategoryRow[]) ?? []).map((c) => [c.id, c.name]),
  )

  return products.map((product, index) => {
    const productVariants = variants
      .filter((v) => v.product_id === product.id)
      .map((v) => ({
        id: v.id,
        productId: v.product_id,
        sku: v.sku,
        name: v.name,
        inventoryCost: v.inventory_cost,
        salePrice: v.sale_price,
        stock: v.stock,
        optionValues: optionMap[v.id] ?? [],
      }))
    return {
      id: product.id,
      name: product.name,
      category: product.category_id
        ? (categoryMap.get(product.category_id) ?? 'General')
        : 'General',
      categoryId: product.category_id,
      published: product.published,
      publicDescription: product.public_description,
      imageUrl: safeImageUrl(product.image_url),
      color: colors[index % colors.length],
      variants: productVariants,
    }
  })
}

// ─── CATEGORIES ──────────────────────────────────────────────

export async function loadCategories(
  user: User,
): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name')
  if (error) throw error
  return (data as CategoryRow[]) ?? []
}

export async function createCategory(name: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_category', {
    p_name: name,
  })
  if (error) throw error
  return data as string
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_category', { p_category_id: id })
  if (error) throw error
}

// ─── OPTION TYPES & VALUES ───────────────────────────────────

export async function loadOptionTypes(user: User): Promise<
  Array<{
    id: string
    name: string
    values: Array<{ id: string; name: string }>
  }>
> {
  const { data: types, error: typesError } = await supabase
    .from('option_types')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name')
  if (typesError) throw typesError
  const typeRows = (types as OptionTypeRow[]) ?? []
  if (!typeRows.length) return []

  const typeIds = typeRows.map((t) => t.id)
  const { data: values } = await supabase
    .from('option_values')
    .select('id, option_type_id, name')
    .in('option_type_id', typeIds)
    .order('name')

  const valueMap = new Map<string, Array<{ id: string; name: string }>>()
  for (const v of (values as OptionValueRow[]) ?? []) {
    if (!valueMap.has(v.option_type_id)) valueMap.set(v.option_type_id, [])
    valueMap.get(v.option_type_id)!.push({ id: v.id, name: v.name })
  }

  return typeRows.map((t) => ({
    id: t.id,
    name: t.name,
    values: valueMap.get(t.id) ?? [],
  }))
}

export async function createOptionType(name: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_option_type', {
    p_name: name,
  })
  if (error) throw error
  return data as string
}

export async function createOptionValue(
  typeId: string,
  name: string,
): Promise<string> {
  const { data, error } = await supabase.rpc('create_option_value', {
    p_option_type_id: typeId,
    p_name: name,
  })
  if (error) throw error
  return data as string
}

export async function deleteOptionType(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_option_type', {
    p_option_type_id: id,
  })
  if (error) throw error
}

export async function deleteOptionValue(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_option_value', {
    p_option_value_id: id,
  })
  if (error) throw error
}

// ─── PRODUCT MUTATIONS ───────────────────────────────────────

export async function createProduct(
  user: User,
  product: Omit<Product, 'id'>,
  defaultVariant?: {
    sku: string
    inventoryCost: number
    salePrice: number
    stock: number
    optionValueIds: string[]
  },
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      user_id: user.id,
      name: product.name,
      category_id: product.categoryId,
      published: product.published,
      public_description: product.publicDescription,
      image_url: product.imageUrl,
    })
    .select('id, name, category_id, published, public_description, image_url')
    .single()
  if (error) throw error

  // Create default variant if provided
  let variants: Variant[] = []
  if (defaultVariant) {
    const { data: vData, error: vError } = await supabase.rpc(
      'create_variant',
      {
        p_product_id: data.id,
        p_sku: defaultVariant.sku,
        p_variant_name: '',
        p_inventory_cost: defaultVariant.inventoryCost,
        p_sale_price: defaultVariant.salePrice,
        p_stock: defaultVariant.stock,
        p_option_value_ids: defaultVariant.optionValueIds,
      },
    )
    if (vError) throw vError
    variants = [
      {
        id: vData as string,
        productId: data.id,
        sku: defaultVariant.sku,
        name: '',
        inventoryCost: defaultVariant.inventoryCost,
        salePrice: defaultVariant.salePrice,
        stock: defaultVariant.stock,
        optionValues: [],
      },
    ]
  }

  return {
    id: data.id,
    name: data.name,
    category: product.category,
    categoryId: data.category_id,
    published: data.published,
    publicDescription: data.public_description,
    imageUrl: safeImageUrl(data.image_url),
    color: product.color,
    variants,
  }
}

export async function updateProduct(product: Product) {
  const { error } = await supabase.rpc('update_product_atomic', {
    p_product_id: product.id,
    p_name: product.name,
    p_category_id: product.categoryId,
    p_published: product.published,
    p_public_description: product.publicDescription,
    p_image_url: product.imageUrl,
  })
  if (error) throw error
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

// ─── VARIANT MUTATIONS ───────────────────────────────────────

export async function createVariant(
  productId: string,
  variant: {
    sku: string
    name: string
    inventoryCost: number
    salePrice: number
    stock: number
    optionValueIds: string[]
  },
): Promise<string> {
  const { data, error } = await supabase.rpc('create_variant', {
    p_product_id: productId,
    p_sku: variant.sku,
    p_variant_name: variant.name,
    p_inventory_cost: variant.inventoryCost,
    p_sale_price: variant.salePrice,
    p_stock: variant.stock,
    p_option_value_ids: variant.optionValueIds,
  })
  if (error) throw error
  return data as string
}

export async function updateVariant(
  variantId: string,
  variant: {
    sku: string
    name: string
    inventoryCost: number
    salePrice: number
    stock: number
    optionValueIds: string[]
  },
): Promise<void> {
  const { error } = await supabase.rpc('update_variant', {
    p_variant_id: variantId,
    p_sku: variant.sku,
    p_variant_name: variant.name,
    p_inventory_cost: variant.inventoryCost,
    p_sale_price: variant.salePrice,
    p_stock: variant.stock,
    p_option_value_ids: variant.optionValueIds,
  })
  if (error) throw error
}

export async function deleteVariant(variantId: string): Promise<void> {
  const { error } = await supabase.rpc('delete_variant', {
    p_variant_id: variantId,
  })
  if (error) throw error
}

// ─── CLIENTS ─────────────────────────────────────────────────

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

// ─── ORDERS ──────────────────────────────────────────────────

export async function createOrder(
  clientId: string,
  items: OrderItemInput[],
  paymentStatus: 'pending' | 'paid',
  clientName: string = '',
) {
  const { data, error } = await supabase.rpc('create_order', {
    p_client_id: clientId,
    p_items: items.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
    })),
    p_payment_status: paymentStatus,
    p_client_name: clientName,
  })
  if (error) throw error
  return data as string
}

export async function loadOrders(
  user: User,
): Promise<Array<Order & { clientId?: string }>> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, client_id, status, payment_status, total, created_at, order_number, client_name_snapshot',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  const rows = data as OrderRow[]
  const ids = rows.map((row) => row.id)

  const itemsResult = ids.length
    ? await supabase
        .from('order_items')
        .select(
          'order_id, variant_id, quantity, sku_snapshot, product_name_snapshot, variant_label_snapshot, unit_price, unit_cost_snapshot, line_total',
        )
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
    id: row.order_number ?? `#${row.id.slice(0, 6).toUpperCase()}`,
    databaseId: row.id,
    clientId: row.client_id ?? undefined,
    client: row.client_name_snapshot || 'Cliente sin nombre',
    clientNameSnapshot: row.client_name_snapshot || undefined,
    date: new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(row.created_at)),
    createdAt: row.created_at,
    items: itemCounts[row.id] || 0,
    itemLines: itemRows
      .filter((item) => item.order_id === row.id)
      .map((item) => ({
        variantId: item.variant_id,
        quantity: item.quantity,
        productNameSnapshot: item.product_name_snapshot,
        skuSnapshot: item.sku_snapshot,
        variantLabelSnapshot: item.variant_label_snapshot,
        unitPrice: item.unit_price,
        unitCostSnapshot: item.unit_cost_snapshot,
        lineTotal: item.line_total,
      })),
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

// ─── SETTINGS ────────────────────────────────────────────────

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

// ─── PUBLIC CATALOG ──────────────────────────────────────────

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

// ─── SALES ───────────────────────────────────────────────────

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

// ─── INVENTORY AGGREGATES ────────────────────────────────────

export async function loadInventoryAggregates(): Promise<{
  costTotal: number
  saleTotal: number
  profitTotal: number
}> {
  const { data, error } = await supabase.rpc('inventory_aggregates')
  if (error) throw error
  const row = (
    data as Array<{
      cost_total: number
      sale_total: number
      profit_total: number
    }>
  )[0]
  return {
    costTotal: Number(row?.cost_total ?? 0),
    saleTotal: Number(row?.sale_total ?? 0),
    profitTotal: Number(row?.profit_total ?? 0),
  }
}

// ─── HELPERS ─────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}
