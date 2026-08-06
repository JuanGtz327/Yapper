import { useRef, useState } from 'react'
import './App.css'
import type { Client, Product } from './types.ts'
import { AuthScreen } from './features/auth/AuthScreen.tsx'
import { DashboardPage } from './features/dashboard/DashboardPage.tsx'
import { ProductsPage } from './features/products/ProductsPage.tsx'
import { ClientsPage } from './features/clients/ClientsPage.tsx'
import { OrdersPage } from './features/orders/OrdersPage.tsx'
import { CatalogPage } from './features/catalog/CatalogPage.tsx'
import { StatsPage } from './features/stats/StatsPage.tsx'
import { SettingsPage } from './features/settings/SettingsPage.tsx'
import { PublicCatalogPage } from './features/catalog/PublicCatalogPage.tsx'
import { Spinner } from './components/ui/Spinner.tsx'
import { AppSidebar } from './components/layout/AppSidebar.tsx'
import { Topbar } from './components/layout/Topbar.tsx'
import { MobileNavDrawer } from './components/layout/MobileNavDrawer.tsx'
import { ProductModal } from './features/products/ProductModal.tsx'
import { ClientModal } from './features/clients/ClientModal.tsx'
import { OrderModal } from './features/orders/OrderModal.tsx'
import { isSupabaseConfigured } from './lib/supabase.ts'
import type { Page, Modal } from './lib/navigation.ts'
import { getPublicCatalogSlug } from './lib/routing.ts'
import { useAuth } from './hooks/useAuth.ts'
import { useDashboardData } from './hooks/useDashboardData.ts'

const publicSlug = getPublicCatalogSlug(window.location.pathname)

function App() {
  return publicSlug ? <PublicCatalogPage slug={publicSlug} /> : <DashboardApp />
}

function DashboardApp() {
  const [page, setPage] = useState<Page>('Inicio')
  const [modal, setModal] = useState<Modal>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [search, setSearch] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  const { user, authLoading, signOut } = useAuth()
  const {
    products,
    clients,
    orders,
    sales,
    settings,
    dataLoading,
    dataError,
    addProduct: addProductAction,
    addClient: addClientAction,
    removeProduct,
    removeClient,
    addOrder: addOrderAction,
    changeOrderStatus,
    changeOrderPayment,
    updateBusinessSettings,
  } = useDashboardData(user)

  const navigateToPage = (nextPage: Page) => {
    setPage(nextPage)
    setMobileMenuOpen(false)
  }

  const openModalForAction = (
    type: 'product' | 'client' | 'order',
    editing?: Product | Client,
  ) => {
    setEditingProduct(type === 'product' ? (editing as Product | null) : null)
    setEditingClient(type === 'client' ? (editing as Client | null) : null)
    setModal(type)
  }

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
        {dataError && (
          <div className="data-notice error" role="alert" aria-live="assertive">
            {dataError}
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
        {page === 'Almacén' && (
          <ProductsPage
            products={products}
            threshold={settings.lowStockThreshold}
            currency={settings.currency}
            search={search}
            setSearch={setSearch}
            onAdd={() => openModalForAction('product')}
            onEdit={(product) => openModalForAction('product', product)}
            onRemove={removeProduct}
          />
        )}
        {page === 'Clientes' && (
          <ClientsPage
            clients={clients}
            search={search}
            setSearch={setSearch}
            onAdd={() => openModalForAction('client')}
            onEdit={(client) => openModalForAction('client', client)}
            onRemove={removeClient}
          />
        )}
        {page === 'Pedidos' && (
          <OrdersPage
            orders={orders}
            products={products}
            currency={settings.currency}
            onAdd={() => setModal('order')}
            onStatusChange={changeOrderStatus}
            onPaymentChange={changeOrderPayment}
            onCancel={(order) => changeOrderStatus(order, 'cancelled')}
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
      {modal === 'product' && (
        <ProductModal
          initial={editingProduct}
          onClose={() => {
            setModal(null)
            setEditingProduct(null)
          }}
          onSubmit={async (event) => {
            if (await addProductAction(event, editingProduct)) {
              setModal(null)
              setEditingProduct(null)
            }
          }}
        />
      )}
      {modal === 'client' && (
        <ClientModal
          initial={editingClient}
          onClose={() => {
            setModal(null)
            setEditingClient(null)
          }}
          onSubmit={async (event) => {
            if (await addClientAction(event, editingClient)) {
              setModal(null)
              setEditingClient(null)
            }
          }}
        />
      )}
      {modal === 'order' && (
        <OrderModal
          clients={clients}
          products={products}
          currency={settings.currency}
          onClose={() => setModal(null)}
          onSubmit={async (clientId, items, payment) => {
            if (await addOrderAction(clientId, items, payment)) {
              setModal(null)
            }
          }}
        />
      )}
    </div>
  )
}

export default App
