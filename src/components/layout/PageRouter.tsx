import type { User } from '@supabase/supabase-js'
import { useRoute, useLocation, useSearch } from 'wouter'
import type {
  Client,
  Order,
  Product,
  SalesAggregate,
  Category,
  OptionTypeWithValues,
} from '../../types.ts'
import { DashboardPage } from '../../features/dashboard/DashboardPage.tsx'
import { ProductsPage } from '../../features/products/ProductsPage.tsx'
import { ClientsPage } from '../../features/clients/ClientsPage.tsx'
import { OrdersPage } from '../../features/orders/OrdersPage.tsx'
import { OrderDetailPage } from '../../features/orders/OrderDetailPage.tsx'
import { OrderCreatePage } from '../../features/orders/OrderCreatePage.tsx'
import { CatalogPage } from '../../features/catalog/CatalogPage.tsx'
import { StatsPage } from '../../features/stats/StatsPage.tsx'
import { SettingsPage } from '../../features/settings/SettingsPage.tsx'
import { ProductCreatePage } from '../../features/products/ProductCreatePage.tsx'
import { ProductDetailPage } from '../../features/products/ProductDetailPage.tsx'
import type { Page, Modal } from '../../lib/navigation.ts'
import type { BusinessSettings } from '../../types.ts'
import { routes, routeToPage } from '../../lib/routes.ts'
import type { ProductDraft } from '../../features/products/validateProductDraft.ts'
import { useProductsPaginatedQuery } from '../../hooks/queries/useProducts.ts'
import { useClientsPaginatedQuery } from '../../hooks/queries/useClients.ts'
import { useOrdersPaginatedQuery } from '../../hooks/queries/useOrders.ts'
import type {
  ClientFilters,
  OrderFilters,
  ProductFilters,
} from '../../types.ts'
import {
  PAGE_SIZE,
  joinLocationSearch,
  readListUrl,
  useDebouncedUrlSearch,
  writeListUrl,
} from '../../lib/listUrl.ts'

type PageRouterProps = {
  user: User | null
  products: Product[]
  clients: Client[]
  orders: Order[]
  categories: Category[]
  optionTypes: OptionTypeWithValues[]
  settings: BusinessSettings
  sales: SalesAggregate[]
  search: string
  setSearch: (s: string) => void
  registerPaymentPending: boolean
  openModal: (type: Modal, editing?: Client) => void
  onNavigate: (page: Page) => void
  onProductCreated: () => void
  handleProductSubmit: (
    draft: ProductDraft,
    product?: Product | null,
  ) => Promise<boolean>
  handleVariantsChanged: () => void
  handleOrderSubmit: (
    clientId: string,
    items: Array<{ variantId: string; quantity: number }>,
    payment: 'pending' | 'paid',
    routeOrder?: Order | null,
  ) => Promise<boolean>
  handleStatusChange: (
    order: Order,
    status: 'pending' | 'delivered' | 'cancelled',
  ) => void
  handlePaymentChange: (order: Order, payment: 'pending' | 'paid') => void
  handleRegisterPayment: (data: {
    orderId: string
    amount: number
    paymentMethod: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Otro'
    reference?: string
    notes?: string
  }) => Promise<void>
  handleCancelOrder: (order: Order) => void
  removeProduct: (id: string) => void
  removeClient: (id: string) => void
  updateBusinessSettings: (settings: BusinessSettings) => Promise<void>
  signOut: () => Promise<void>
}

export function PageRouter({
  user,
  products,
  clients,
  orders,
  categories,
  optionTypes,
  settings,
  sales,
  registerPaymentPending,
  openModal,
  onNavigate,
  onProductCreated,
  handleProductSubmit,
  handleVariantsChanged,
  handleOrderSubmit,
  handleStatusChange,
  handlePaymentChange,
  handleRegisterPayment,
  handleCancelOrder,
  removeProduct,
  removeClient,
  updateBusinessSettings,
  signOut,
}: PageRouterProps) {
  const currency = settings.currency

  const [, productParams] = useRoute(routes.productDetail)
  const [, productEditParams] = useRoute(routes.productEdit)
  const [, orderParams] = useRoute(routes.orderDetail)
  const [, orderEditParams] = useRoute(routes.orderEdit)
  const [isNewProduct] = useRoute(routes.productNew)
  const [isNewOrder] = useRoute(routes.orderNew)
  const [location, setLocation] = useLocation()
  const locationSearch = useSearch()
  const currentLocation = joinLocationSearch(location, locationSearch)
  const urlFilters = readListUrl(currentLocation)
  const [searchInput, setSearchInput] = useDebouncedUrlSearch(
    currentLocation,
    setLocation,
  )

  const updateListUrl = (updates: Parameters<typeof writeListUrl>[1]) =>
    setLocation(writeListUrl(currentLocation, updates))

  const productFilters: ProductFilters = {
    search: urlFilters.search || undefined,
    categoryId: urlFilters.categoryId || undefined,
    stock: urlFilters.stock || undefined,
    stockThreshold: settings.lowStockThreshold,
  }
  const clientFilters: ClientFilters = {
    search: urlFilters.search || undefined,
  }
  const orderFilters: OrderFilters = {
    search: urlFilters.search || undefined,
    clientId: urlFilters.clientId || undefined,
    status: urlFilters.delivery || undefined,
    paymentStatus:
      urlFilters.payment === 'paid'
        ? 'paidOrPartial'
        : urlFilters.payment || undefined,
    orderDate: urlFilters.orderDate || undefined,
  }
  const productsPage = useProductsPaginatedQuery(
    user,
    { page: urlFilters.page, pageSize: PAGE_SIZE },
    productFilters,
  )
  const clientsPage = useClientsPaginatedQuery(
    user,
    { page: urlFilters.page, pageSize: PAGE_SIZE },
    clientFilters,
  )
  const ordersPage = useOrdersPaginatedQuery(
    user,
    { page: urlFilters.page, pageSize: PAGE_SIZE },
    orderFilters,
  )

  const productId = productParams?.productId || productEditParams?.productId
  const orderId = orderParams?.orderId || orderEditParams?.orderId

  const editingProduct = productId
    ? (products.find((p) => p.id === productId) ?? null)
    : null
  const editingOrder = orderId
    ? (orders.find((o) => o.id === orderId || o.databaseId === orderId) ?? null)
    : null

  return (
    <>
      {(() => {
        const page = routeToPage(window.location.pathname)

        if (page === 'Inicio') {
          return (
            <DashboardPage
              orders={orders}
              products={products}
              sales={sales}
              threshold={settings.lowStockThreshold}
              currency={currency}
              onNavigate={onNavigate}
            />
          )
        }

        if (page === 'Almacén') {
          if (isNewProduct) {
            return (
              <ProductCreatePage
                initial={null}
                categories={categories}
                optionTypes={optionTypes}
                onCategoryCreated={onProductCreated}
                onVariantsChanged={handleVariantsChanged}
                onClose={() => onNavigate('Almacén')}
                onRemove={removeProduct}
                onSubmit={(draft) => handleProductSubmit(draft, null)}
              />
            )
          }
          if (editingProduct && productEditParams) {
            return (
              <ProductCreatePage
                initial={editingProduct}
                categories={categories}
                optionTypes={optionTypes}
                onCategoryCreated={onProductCreated}
                onVariantsChanged={handleVariantsChanged}
                onClose={() => onNavigate('Almacén')}
                onRemove={removeProduct}
                onSubmit={(draft) => handleProductSubmit(draft, editingProduct)}
              />
            )
          }
          if (editingProduct && productParams) {
            return (
              <ProductDetailPage
                user={user}
                productId={editingProduct.id}
                currency={currency}
                onBack={() => onNavigate('Almacén')}
                onEdit={() =>
                  setLocation(`/almacen/${editingProduct.id}/editar`)
                }
              />
            )
          }
          return (
            <ProductsPage
              products={
                productsPage.data?.data ??
                (productsPage.isLoading ? [] : products)
              }
              threshold={settings.lowStockThreshold}
              currency={currency}
              search={searchInput}
              setSearch={setSearchInput}
              categories={categories}
              serverPagination={{
                page: productsPage.data?.page ?? urlFilters.page,
                total: productsPage.data?.total ?? 0,
                totalPages: productsPage.data?.totalPages ?? 0,
                isFetching: productsPage.isFetching,
                onPageChange: (page) => updateListUrl({ page }),
              }}
              onSearchChange={setSearchInput}
              categoryFilter={urlFilters.categoryId}
              onCategoryChange={(categoryId) =>
                updateListUrl({ categoryId, page: 1 })
              }
              stockFilter={urlFilters.stock}
              onStockChange={(stock) => updateListUrl({ stock, page: 1 })}
              onAdd={() => setLocation('/almacen/nuevo')}
              onManageCategories={() => openModal('categories')}
              onView={(product) => setLocation(`/almacen/${product.id}`)}
              onEdit={(product) => setLocation(`/almacen/${product.id}/editar`)}
            />
          )
        }

        if (page === 'Clientes') {
          return (
            <ClientsPage
              clients={
                clientsPage.data?.data ?? (clientsPage.isLoading ? [] : clients)
              }
              search={searchInput}
              setSearch={setSearchInput}
              serverPagination={{
                page: clientsPage.data?.page ?? urlFilters.page,
                total: clientsPage.data?.total ?? 0,
                totalPages: clientsPage.data?.totalPages ?? 0,
                isFetching: clientsPage.isFetching,
                onPageChange: (page) => updateListUrl({ page }),
              }}
              onSearchChange={setSearchInput}
              onAdd={() => openModal('client')}
              onEdit={(client) => openModal('client', client)}
              onRemove={removeClient}
              onViewOrders={(clientId) =>
                setLocation(`/pedidos?client=${clientId}`)
              }
            />
          )
        }

        if (page === 'Pedidos') {
          if (isNewOrder) {
            return (
              <OrderCreatePage
                initial={null}
                clients={clients}
                products={products}
                currency={currency}
                onClose={() => onNavigate('Pedidos')}
                onSubmit={handleOrderSubmit}
              />
            )
          }
          if (editingOrder && orderEditParams) {
            return (
              <OrderCreatePage
                initial={editingOrder}
                clients={clients}
                products={products}
                currency={currency}
                onClose={() => onNavigate('Pedidos')}
                onBackToDetail={
                  editingOrder.databaseId
                    ? () => onNavigate('Pedidos')
                    : undefined
                }
                onSubmit={(clientId, items, payment) =>
                  handleOrderSubmit(clientId, items, payment, editingOrder)
                }
              />
            )
          }
          if (editingOrder && orderParams) {
            return (
              <OrderDetailPage
                order={
                  orders.find((o) => o.id === editingOrder.id) ?? editingOrder
                }
                products={products}
                currency={currency}
                isSubmittingPayment={registerPaymentPending}
                onBack={() => onNavigate('Pedidos')}
                onEdit={(order) =>
                  setLocation(`/pedidos/${order.databaseId || order.id}/editar`)
                }
                onStatusChange={handleStatusChange}
                onPaymentChange={handlePaymentChange}
                onRegisterPayment={handleRegisterPayment}
                onCancel={handleCancelOrder}
              />
            )
          }
          return (
            <OrdersPage
              orders={
                ordersPage.data?.data ?? (ordersPage.isLoading ? [] : orders)
              }
              clients={clients}
              currency={currency}
              summaryOrders={orders}
              serverFilters={{
                search: searchInput,
                clientId: urlFilters.clientId,
                delivery: urlFilters.delivery,
                payment: urlFilters.payment,
                orderDate: urlFilters.orderDate,
                onSearchChange: setSearchInput,
                onClientChange: (clientId) =>
                  updateListUrl({ clientId, page: 1 }),
                onDeliveryChange: (delivery) =>
                  updateListUrl({ delivery, page: 1 }),
                onPaymentChange: (payment) =>
                  updateListUrl({ payment, page: 1 }),
                onOrderDateChange: (orderDate) =>
                  updateListUrl({ orderDate, page: 1 }),
              }}
              serverPagination={{
                page: ordersPage.data?.page ?? urlFilters.page,
                total: ordersPage.data?.total ?? 0,
                totalPages: ordersPage.data?.totalPages ?? 0,
                isFetching: ordersPage.isFetching,
                onPageChange: (page) => updateListUrl({ page }),
              }}
              onAdd={() => setLocation('/pedidos/nuevo')}
              onSelectOrder={(order) =>
                setLocation(`/pedidos/${order.databaseId || order.id}`)
              }
            />
          )
        }

        if (page === 'Tienda') {
          return (
            <CatalogPage
              products={products}
              currency={currency}
              settings={settings}
            />
          )
        }

        if (page === 'Estadísticas') {
          return <StatsPage user={user} currency={currency} />
        }

        if (page === 'Ajustes') {
          return (
            <SettingsPage
              settings={settings}
              onSave={updateBusinessSettings}
              onSignOut={signOut}
              onOpenOptionTypes={() => openModal('optionTypes')}
            />
          )
        }

        return null
      })()}
    </>
  )
}
