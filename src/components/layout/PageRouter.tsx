import type { User } from '@supabase/supabase-js'
import { useRoute, useLocation } from 'wouter'
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
import type { Page, Modal } from '../../lib/navigation.ts'
import type { BusinessSettings } from '../../types.ts'
import { routes, routeToPage } from '../../lib/routes.ts'
import type { ProductDraft } from '../../features/products/validateProductDraft.ts'

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
  handleProductSubmit: (draft: ProductDraft) => Promise<boolean>
  handleVariantsChanged: () => void
  handleOrderSubmit: (
    clientId: string,
    items: Array<{ variantId: string; quantity: number }>,
    payment: 'pending' | 'paid',
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
  search,
  setSearch,
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
  const [, setLocation] = useLocation()

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
                onSubmit={handleProductSubmit}
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
                onSubmit={handleProductSubmit}
              />
            )
          }
          return (
            <ProductsPage
              products={products}
              threshold={settings.lowStockThreshold}
              currency={currency}
              search={search}
              setSearch={setSearch}
              onAdd={() => setLocation('/almacen/nuevo')}
              onManageCategories={() => openModal('categories')}
              onEdit={(product) => setLocation(`/almacen/${product.id}/editar`)}
            />
          )
        }

        if (page === 'Clientes') {
          return (
            <ClientsPage
              clients={clients}
              search={search}
              setSearch={setSearch}
              onAdd={() => openModal('client')}
              onEdit={(client) => openModal('client', client)}
              onRemove={removeClient}
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
                onSubmit={handleOrderSubmit}
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
              orders={orders}
              currency={currency}
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
