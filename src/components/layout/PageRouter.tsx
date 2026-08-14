import type { User } from '@supabase/supabase-js'
import type { QueryClient } from '@tanstack/react-query'
import type { Client, Order, Product, SalesAggregate } from '../../types.ts'
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
import { qk } from '../../lib/queryKeys.ts'
import type { ProductDraft } from '../../features/products/validateProductDraft.ts'

type Category = { id: string; name: string }
type OptionType = { id: string; name: string; values: Array<{ id: string; name: string }> }

type PageRouterProps = {
  page: Page
  user: User | null
  products: Product[]
  clients: Client[]
  orders: Order[]
  categories: Category[]
  optionTypes: OptionType[]
  settings: BusinessSettings
  sales: SalesAggregate[]
  search: string
  setSearch: (s: string) => void
  productEditor: { mode: 'create' | 'edit'; product: Product | null } | null
  orderEditor: Order | null | undefined
  orderDetail: Order | null
  registerPaymentPending: boolean
  qc: QueryClient
  openModal: (type: Modal, editing?: Client) => void
  onNavigate: (page: Page) => void
  openProductEditor: (product?: Product) => void
  closeProductEditor: () => void
  handleProductSubmit: (draft: ProductDraft) => Promise<boolean>
  handleVariantsChanged: () => void
  openOrderEditor: (order?: Order) => void
  selectOrder: (order: Order) => void
  closeOrderDetail: () => void
  closeOrderEditor: () => void
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
  page,
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
  productEditor,
  orderEditor,
  orderDetail,
  registerPaymentPending,
  qc,
  openModal,
  onNavigate,
  openProductEditor,
  closeProductEditor,
  handleProductSubmit,
  handleVariantsChanged,
  openOrderEditor,
  selectOrder,
  closeOrderDetail,
  closeOrderEditor,
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

  return (
    <>
      {page === 'Inicio' && (
        <DashboardPage
          orders={orders}
          products={products}
          sales={sales}
          threshold={settings.lowStockThreshold}
          currency={currency}
          onNavigate={onNavigate}
        />
      )}
      {page === 'Almacén' && !productEditor && (
        <ProductsPage
          products={products}
          threshold={settings.lowStockThreshold}
          currency={currency}
          search={search}
          setSearch={setSearch}
          onAdd={() => openProductEditor()}
          onManageCategories={() => openModal('categories')}
          onEdit={(product) => openProductEditor(product)}
        />
      )}
      {productEditor && (
        <ProductCreatePage
          initial={productEditor.product}
          categories={categories}
          optionTypes={optionTypes}
          onCategoryCreated={() => {
            void qc.invalidateQueries({ queryKey: qk.categories(user) })
          }}
          onVariantsChanged={handleVariantsChanged}
          onClose={closeProductEditor}
          onRemove={removeProduct}
          onSubmit={handleProductSubmit}
        />
      )}
      {page === 'Clientes' && (
        <ClientsPage
          clients={clients}
          search={search}
          setSearch={setSearch}
          onAdd={() => openModal('client')}
          onEdit={(client) => openModal('client', client)}
          onRemove={removeClient}
        />
      )}
      {page === 'Pedidos' && orderEditor === undefined && !orderDetail && (
        <OrdersPage
          orders={orders}
          currency={currency}
          onAdd={() => openOrderEditor()}
          onSelectOrder={selectOrder}
        />
      )}
      {page === 'Pedidos' && orderDetail && orderEditor === undefined && (
        <OrderDetailPage
          order={orders.find((o) => o.id === orderDetail.id) ?? orderDetail}
          products={products}
          currency={currency}
          isSubmittingPayment={registerPaymentPending}
          onBack={closeOrderDetail}
          onEdit={(order) => {
            closeOrderDetail()
            openOrderEditor(order)
          }}
          onStatusChange={handleStatusChange}
          onPaymentChange={handlePaymentChange}
          onRegisterPayment={handleRegisterPayment}
          onCancel={handleCancelOrder}
        />
      )}
      {page === 'Pedidos' && orderEditor !== undefined && (
        <OrderCreatePage
          initial={orderEditor}
          clients={clients}
          products={products}
          currency={currency}
          onClose={closeOrderEditor}
          onBackToDetail={
            orderEditor?.databaseId
              ? () => {
                  closeOrderEditor()
                  selectOrder(orderEditor)
                }
              : undefined
          }
          onSubmit={handleOrderSubmit}
        />
      )}
      {page === 'Tienda' && (
        <CatalogPage
          products={products}
          currency={currency}
          settings={settings}
        />
      )}
      {page === 'Estadísticas' && (
        <StatsPage user={user} currency={currency} />
      )}
      {page === 'Ajustes' && (
        <SettingsPage
          settings={settings}
          onSave={updateBusinessSettings}
          onSignOut={signOut}
          onOpenOptionTypes={() => openModal('optionTypes')}
        />
      )}
    </>
  )
}
