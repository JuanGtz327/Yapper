import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/ReactToastify.css'
import './App.css'
import { AuthScreen } from './features/auth/AuthScreen.tsx'
import { DashboardPage } from './features/dashboard/DashboardPage.tsx'
import { ProductsPage } from './features/products/ProductsPage.tsx'
import { ClientsPage } from './features/clients/ClientsPage.tsx'
import { OrdersPage } from './features/orders/OrdersPage.tsx'
import { OrderDetailPage } from './features/orders/OrderDetailPage.tsx'
import { OrderCreatePage } from './features/orders/OrderCreatePage.tsx'
import { CatalogPage } from './features/catalog/CatalogPage.tsx'
import { StatsPage } from './features/stats/StatsPage.tsx'
import { SettingsPage } from './features/settings/SettingsPage.tsx'
import { PublicCatalogPage } from './features/catalog/PublicCatalogPage.tsx'
import { ProductCreatePage } from './features/products/ProductCreatePage.tsx'
import { Spinner } from './components/ui/Spinner.tsx'
import { AppSidebar } from './components/layout/AppSidebar.tsx'
import { Topbar } from './components/layout/Topbar.tsx'
import { MobileNavDrawer } from './components/layout/MobileNavDrawer.tsx'
import { ModalManager } from './components/layout/ModalManager.tsx'
import { ModalProvider, useModal } from './context/ModalContext.tsx'
import { isSupabaseConfigured } from './lib/supabase.ts'
import { qk } from './lib/queryKeys.ts'
import type { Page } from './lib/navigation.ts'
import { getPublicCatalogSlug } from './lib/routing.ts'
import { useAuth } from './hooks/useAuth.ts'
import { useDashboardData } from './hooks/useDashboardData.ts'
import { useProductEditor } from './hooks/useProductEditor.ts'
import { useOrderEditor } from './hooks/useOrderEditor.ts'

const publicSlug = getPublicCatalogSlug(window.location.pathname)

function App() {
  return publicSlug ? <PublicCatalogPage slug={publicSlug} /> : <DashboardApp />
}

function DashboardApp() {
  const { user, authLoading } = useAuth()
  const dashboardData = useDashboardData(user)

  if (authLoading)
    return (
      <main className="auth-loading">
        <div className="brand-mark">Y</div>
        <p>
          <Spinner label="Cargando Yapper" /> Cargando Yapper...
        </p>
      </main>
    )
  if (isSupabaseConfigured && !user) return <AuthScreen />

  return (
    <ModalProvider
      confirmState={dashboardData.confirmState}
      clearConfirm={dashboardData.clearConfirm}
    >
      <DashboardContent user={user} dashboardData={dashboardData} />
    </ModalProvider>
  )
}

function DashboardContent({
  user,
  dashboardData,
}: {
  user: import('@supabase/supabase-js').User | null
  dashboardData: ReturnType<typeof useDashboardData>
}) {
  const qc = useQueryClient()
  const [page, setPage] = useState<Page>('Inicio')
  const [search, setSearch] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  const { openModal } = useModal()
  const { signOut } = useAuth()
  const {
    products,
    clients,
    orders,
    categories,
    optionTypes,
    sales,
    settings,
    dataLoading,
    addClient: addClientAction,
    removeProduct,
    removeClient,
    updateBusinessSettings,
  } = dashboardData

  const {
    productEditor,
    openProductEditor,
    closeProductEditor,
    handleProductSubmit,
    handleVariantsChanged,
  } = useProductEditor(user, qc)

  const {
    orderEditor,
    orderDetail,
    openOrderEditor,
    selectOrder,
    closeOrderDetail,
    closeOrderEditor,
    handleOrderSubmit,
    handleStatusChange,
    handlePaymentChange,
    handleRegisterPayment,
    handleCancelOrder,
    registerPaymentPending,
    resetOrders,
  } = useOrderEditor(user, dashboardData)

  const navigateToPage = (nextPage: Page) => {
    setPage(nextPage)
    resetOrders()
    setMobileMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <AppSidebar
        page={page}
        onNavigate={navigateToPage}
        businessName={settings.businessName}
        accountLabel={user?.email || 'Modo demo'}
      />
      <main className="main-content">
        <Topbar
          page={page}
          businessName={settings.businessName}
          menuOpen={mobileMenuOpen}
          hamburgerRef={hamburgerRef}
          onOpenMenu={() => setMobileMenuOpen(true)}
        />
        {dataLoading && (
          <div className="data-notice">
            <Spinner label="Sincronizando tus datos" /> Sincronizando tus
            datos...
          </div>
        )}
        {page === 'Inicio' && (
          <DashboardPage
            orders={orders}
            products={products}
            sales={sales}
            threshold={settings.lowStockThreshold}
            currency={settings.currency}
            onNavigate={navigateToPage}
          />
        )}
        {page === 'Almacén' && !productEditor && (
          <ProductsPage
            products={products}
            threshold={settings.lowStockThreshold}
            currency={settings.currency}
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
            currency={settings.currency}
            onAdd={() => openOrderEditor()}
            onSelectOrder={selectOrder}
          />
        )}
        {page === 'Pedidos' && orderDetail && orderEditor === undefined && (
          <OrderDetailPage
            order={orders.find((o) => o.id === orderDetail.id) ?? orderDetail}
            products={products}
            currency={settings.currency}
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
            currency={settings.currency}
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
            currency={settings.currency}
            settings={settings}
          />
        )}
        {page === 'Estadísticas' && (
          <StatsPage user={user} currency={settings.currency} />
        )}
        {page === 'Ajustes' && (
          <SettingsPage
            settings={settings}
            onSave={updateBusinessSettings}
            onSignOut={signOut}
            onOpenOptionTypes={() => openModal('optionTypes')}
          />
        )}
      </main>
      {mobileMenuOpen && (
        <MobileNavDrawer
          page={page}
          onSelect={navigateToPage}
          onClose={() => setMobileMenuOpen(false)}
          hamburgerRef={hamburgerRef}
        />
      )}
      <ModalManager
        categories={categories}
        optionTypes={optionTypes}
        user={user}
        addClientAction={addClientAction}
      />
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />
    </div>
  )
}

export default App
