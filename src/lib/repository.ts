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
  ProductRow,
  VariantRow,
  CategoryRow,
  OptionTypeRow,
  OptionValueRow,
  ClientRow,
  OrderRow,
  OrderItemRow,
  ClientFilters,
  OrderFilters,
  PaginationParams,
  PaginatedResult,
  ProductFilters,
  VariantPriceHistoryRow,
  VariantPriceHistory,
} from '../types.ts'
import { safeImageUrl } from './security.ts'

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
    .select('id, name, category_id, published, public_description, image_url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (productError) throw productError

  return hydrateProducts(user, (productRows as ProductRow[]) ?? [])
}

export async function loadProductsPage(
  user: User,
  pagination: PaginationParams,
  filters: ProductFilters = {},
): Promise<PaginatedResult<Product>> {
  const { page, pageSize } = normalizePagination(pagination)
  let query = supabase
    .from('products')
    .select('id, name, category_id, published, public_description, image_url', {
      count: 'exact',
    })
    .eq('user_id', user.id)
  if (filters.search?.trim()) {
    query = query.ilike('name', `%${escapeIlike(filters.search)}%`)
  }
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId)
  if (filters.published !== undefined)
    query = query.eq('published', filters.published)
  if (filters.stock) {
    const stockQuery = supabase
      .from('product_variants')
      .select('product_id')
      .eq('user_id', user.id)
    if (filters.stock === 'available') stockQuery.gt('stock', 0)
    if (filters.stock === 'low')
      stockQuery.gt('stock', 0).lte('stock', filters.stockThreshold ?? 5)
    if (filters.stock === 'out') stockQuery.gt('stock', 0)
    const { data: stockRows, error: stockError } = await stockQuery
    if (stockError) throw stockError
    const matchingIds = Array.from(
      new Set((stockRows ?? []).map((row) => row.product_id as string)),
    )
    if (filters.stock === 'out') {
      if (matchingIds.length)
        query = query.not('id', 'in', `(${matchingIds.join(',')})`)
    } else if (!matchingIds.length) {
      return paginated([], 0, page, pageSize)
    } else {
      query = query.in('id', matchingIds)
    }
  }
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)
  if (error) throw error
  const products = await hydrateProducts(user, (data as ProductRow[]) ?? [])
  return paginated(products, count ?? 0, page, pageSize)
}

async function hydrateProducts(user: User, products: ProductRow[]) {
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

// ─── PRODUCT DETAIL ──────────────────────────────────────────

export async function loadProductById(
  user: User,
  productId: string,
): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, category_id, published, public_description, image_url')
    .eq('user_id', user.id)
    .eq('id', productId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const hydrated = await hydrateProducts(user, [data as ProductRow])
  return hydrated[0] ?? null
}

export async function loadVariantPriceHistory(
  user: User,
  variantId: string,
  from?: string,
  to?: string,
): Promise<VariantPriceHistory[]> {
  let query = supabase
    .from('variant_price_history')
    .select(
      'id, variant_id, product_id, sku, variant_name, sale_price, inventory_cost, changed_at',
    )
    .eq('user_id', user.id)
    .eq('variant_id', variantId)
  if (from) query = query.gte('changed_at', from)
  if (to) query = query.lt('changed_at', to)
  const { data, error } = await query.order('changed_at', { ascending: false })
  if (error) throw error
  return (data as VariantPriceHistoryRow[]).map((row) => ({
    id: row.id,
    variantId: row.variant_id,
    productId: row.product_id,
    sku: row.sku,
    variantName: row.variant_name,
    salePrice: Number(row.sale_price),
    inventoryCost: Number(row.inventory_cost),
    changedAt: row.changed_at,
  }))
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

export type VariantInput = {
  sku: string
  name: string
  inventoryCost: number
  salePrice: number
  stock: number
  optionValueIds: string[]
}

export async function createProductWithVariants(
  user: User,
  product: {
    name: string
    categoryId: string | null
    published: boolean
    publicDescription: string
    imageUrl: string | null
  },
  variants: VariantInput[],
): Promise<Product> {
  const newProduct = await createProduct(user, {
    name: product.name,
    category: 'General',
    categoryId: product.categoryId,
    published: product.published,
    publicDescription: product.publicDescription,
    imageUrl: product.imageUrl,
    color: colors[Math.floor(Math.random() * colors.length)],
    variants: [],
  })

  const createdVariants: Variant[] = []
  try {
    for (const v of variants) {
      const variantId = await createVariant(newProduct.id, {
        sku: v.sku,
        name: v.name,
        inventoryCost: v.inventoryCost,
        salePrice: v.salePrice,
        stock: v.stock,
        optionValueIds: v.optionValueIds,
      })
      createdVariants.push({
        id: variantId,
        productId: newProduct.id,
        sku: v.sku,
        name: v.name,
        inventoryCost: v.inventoryCost,
        salePrice: v.salePrice,
        stock: v.stock,
        optionValues: [],
      })
    }
  } catch (error) {
    await deleteProduct(newProduct.id).catch(() => {})
    throw error
  }

  const category = product.categoryId
    ? ((
        await supabase
          .from('categories')
          .select('name')
          .eq('id', product.categoryId)
          .maybeSingle()
      ).data?.name ?? 'General')
    : 'General'

  return { ...newProduct, category, variants: createdVariants }
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

export async function updateVariantPrice(
  variantId: string,
  salePrice: number,
): Promise<void> {
  const { error } = await supabase.rpc('update_variant_price', {
    p_variant_id: variantId,
    p_sale_price: salePrice,
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

export async function loadClientsPage(
  user: User,
  pagination: PaginationParams,
  filters: ClientFilters = {},
): Promise<PaginatedResult<Client>> {
  const { page, pageSize } = normalizePagination(pagination)
  let query = supabase
    .from('clients')
    .select('id, name, phone, address', { count: 'exact' })
    .eq('user_id', user.id)
  if (filters.search?.trim()) {
    const pattern = `%${escapeIlike(filters.search)}%`
    query = query.or(`name.ilike.${pattern},phone.ilike.${pattern}`)
  }
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)
  if (error) throw error

  const rows = (data as ClientRow[]) ?? []
  const ids = rows.map((row) => row.id)
  const { data: orderData, error: orderError } = ids.length
    ? await supabase
        .from('orders')
        .select('client_id')
        .eq('user_id', user.id)
        .neq('status', 'cancelled')
        .in('client_id', ids)
    : { data: [], error: null }
  if (orderError) throw orderError
  const orderCounts = (orderData as Array<{ client_id: string | null }>).reduce<
    Record<string, number>
  >((counts, order) => {
    if (order.client_id)
      counts[order.client_id] = (counts[order.client_id] ?? 0) + 1
    return counts
  }, {})
  const clients = rows.map((client) => ({
    ...client,
    zone: client.address || 'Sin zona',
    orders: orderCounts[client.id] || 0,
    initials: getInitials(client.name),
  }))
  return paginated(clients, count ?? 0, page, pageSize)
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

export async function updateOrder(
  orderId: string,
  clientId: string,
  items: OrderItemInput[],
  paymentStatus: 'pending' | 'paid',
  clientName: string = '',
) {
  const { error } = await supabase.rpc('update_order', {
    p_order_id: orderId,
    p_client_id: clientId,
    p_items: items.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
    })),
    p_payment_status: paymentStatus,
    p_client_name: clientName,
  })
  if (error) throw error
}

export async function loadOrders(
  user: User,
): Promise<Array<Order & { clientId?: string }>> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      'id, client_id, status, payment_status, total, paid_amount, created_at, order_number, client_name_snapshot',
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
    paidAmount: row.paid_amount ?? 0,
    status:
      row.status === 'delivered'
        ? 'Entregado'
        : row.status === 'cancelled'
          ? 'Cancelado'
          : 'Pendiente',
    payment:
      row.payment_status === 'paid'
        ? 'Pagado'
        : row.payment_status === 'partial'
          ? 'Parcial'
          : 'Pendiente',
  }))
}

export async function loadOrdersPage(
  user: User,
  pagination: PaginationParams,
  filters: OrderFilters = {},
): Promise<PaginatedResult<Order & { clientId?: string }>> {
  const { page, pageSize } = normalizePagination(pagination)
  let query = supabase
    .from('orders')
    .select(
      'id, client_id, status, payment_status, total, paid_amount, created_at, order_number, client_name_snapshot',
      { count: 'exact' },
    )
    .eq('user_id', user.id)
  if (filters.search?.trim()) {
    const pattern = `%${escapeIlike(filters.search)}%`
    query = query.or(
      `client_name_snapshot.ilike.${pattern},order_number.ilike.${pattern}`,
    )
  }
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.paymentStatus === 'paidOrPartial')
    query = query.in('payment_status', ['paid', 'partial'])
  else if (filters.paymentStatus)
    query = query.eq('payment_status', filters.paymentStatus)
  if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom)
  if (filters.dateTo) query = query.lt('created_at', filters.dateTo)
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)
  if (error) throw error
  const rows = (data as OrderRow[]) ?? []
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
  return paginated(
    mapOrderRows(rows, (itemsResult.data as OrderItemRow[]) ?? []),
    count ?? 0,
    page,
    pageSize,
  )
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

export async function registerPayment(
  orderId: string,
  amount: number,
  paymentMethod: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Otro',
  reference?: string,
  notes?: string,
) {
  const { data, error } = await supabase.rpc('register_payment', {
    p_order_id: orderId,
    p_amount: amount,
    p_payment_method: paymentMethod,
    p_reference: reference ?? null,
    p_notes: notes ?? null,
  })
  if (error) throw error
  return data
}

export async function loadOrderPayments(orderId: string): Promise<
  Array<{
    id: string
    orderId: string
    amount: number
    paymentMethod: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Otro'
    reference: string | null
    notes: string | null
    createdAt: string
  }>
> {
  const { data, error } = await supabase
    .from('order_payments')
    .select(
      'id, order_id, amount, payment_method, reference, notes, created_at',
    )
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: row.id,
    orderId: row.order_id,
    amount: row.amount,
    paymentMethod: row.payment_method as
      'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Otro',
    reference: row.reference,
    notes: row.notes,
    createdAt: row.created_at,
  }))
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
      variants: (product.variants ?? []).map((v) => ({
        name: v.name ?? '',
        optionValues: v.optionValues ?? [],
        salePrice: v.salePrice ?? 0,
        stock: v.stock ?? 0,
      })),
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

function normalizePagination({
  page,
  pageSize,
}: PaginationParams): PaginationParams {
  return {
    page: Number.isInteger(page) ? Math.max(1, page) : 1,
    pageSize: Number.isInteger(pageSize)
      ? Math.min(100, Math.max(1, pageSize))
      : 25,
  }
}

function paginated<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

function escapeIlike(value: string): string {
  return value
    .trim()
    .slice(0, 100)
    .replace(/[%,()\\]/g, '\\$&')
}

function mapOrderRows(
  rows: OrderRow[],
  itemRows: OrderItemRow[],
): Array<Order & { clientId?: string }> {
  const itemCounts = itemRows.reduce<Record<string, number>>((counts, item) => {
    counts[item.order_id] = (counts[item.order_id] ?? 0) + item.quantity
    return counts
  }, {})
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
    paidAmount: row.paid_amount ?? 0,
    status:
      row.status === 'delivered'
        ? 'Entregado'
        : row.status === 'cancelled'
          ? 'Cancelado'
          : 'Pendiente',
    payment:
      row.payment_status === 'paid'
        ? 'Pagado'
        : row.payment_status === 'partial'
          ? 'Parcial'
          : 'Pendiente',
  }))
}
