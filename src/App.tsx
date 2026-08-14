import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/ReactToastify.css'
import './App.css'
import { AuthScreen } from './features/auth/AuthScreen.tsx'
import { PublicCatalogPage } from './features/catalog/PublicCatalogPage.tsx'
import { Spinner } from './components/ui/Spinner.tsx'
import { AppSidebar } from './components/layout/AppSidebar.tsx'
import { Topbar } from './components/layout/Topbar.tsx'
import { MobileNavDrawer } from './components/layout/MobileNavDrawer.tsx'
import { ModalManager } from './components/layout/ModalManager.tsx'
import { PageRouter } from './components/layout/PageRouter.tsx'
import { ModalProvider, useModal } from './context/ModalContext.tsx'
import { isSupabaseConfigured } from './lib/supabase.ts'
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
        <PageRouter
          page={page}
          user={user}
          products={products}
          clients={clients}
          orders={orders}
          categories={categories}
          optionTypes={optionTypes}
          settings={settings}
          sales={sales}
          search={search}
          setSearch={setSearch}
          productEditor={productEditor}
          orderEditor={orderEditor}
          orderDetail={orderDetail}
          registerPaymentPending={registerPaymentPending}
          qc={qc}
          openModal={openModal}
          onNavigate={navigateToPage}
          openProductEditor={openProductEditor}
          closeProductEditor={closeProductEditor}
          handleProductSubmit={handleProductSubmit}
          handleVariantsChanged={handleVariantsChanged}
          openOrderEditor={openOrderEditor}
          selectOrder={selectOrder}
          closeOrderDetail={closeOrderDetail}
          closeOrderEditor={closeOrderEditor}
          handleOrderSubmit={handleOrderSubmit}
          handleStatusChange={handleStatusChange}
          handlePaymentChange={handlePaymentChange}
          handleRegisterPayment={handleRegisterPayment}
          handleCancelOrder={handleCancelOrder}
          removeProduct={removeProduct}
          removeClient={removeClient}
          updateBusinessSettings={updateBusinessSettings}
          signOut={signOut}
        />
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
