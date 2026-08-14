import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/ReactToastify.css'
import './App.css'
import type { Order, Product } from './types.ts'
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
import { useProductsMutations } from './hooks/queries/useProductsMutations.ts'
import {
  createVariant,
  updateVariant,
  deleteVariant,
} from './lib/repository.ts'
import { useToast, toastMessages } from './hooks/useToast.ts'
import type { ProductDraft } from './features/products/validateProductDraft.ts'

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
  const [productEditor, setProductEditor] = useState<{
    mode: 'create' | 'edit'
    product: Product | null
  } | null>(null)
  const [orderEditor, setOrderEditor] = useState<Order | null | undefined>(
    undefined,
  )
  const [orderDetail, setOrderDetail] = useState<Order | null>(null)
  const [search, setSearch] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  const { openModal } = useModal()
  const { signOut } = useAuth()
  const toast = useToast()
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
    addOrder: addOrderAction,
    changeOrderStatus,
    changeOrderPayment,
    registerPayment,
    registerPaymentPending,
    updateExistingOrder,
    updateBusinessSettings,
  } = dashboardData

  const productMutations = useProductsMutations(user)

  const navigateToPage = (nextPage: Page) => {
    setPage(nextPage)
    setProductEditor(null)
    setOrderEditor(undefined)
    setOrderDetail(null)
    setMobileMenuOpen(false)
  }

  const openProductEditor = (product?: Product) => {
    setProductEditor({
      mode: product ? 'edit' : 'create',
      product: product ?? null,
    })
  }

  const openOrderEditor = (order?: Order) => setOrderEditor(order ?? null)

  const handleProductSubmit = async (draft: ProductDraft): Promise<boolean> => {
    if (productEditor?.mode === 'edit' && productEditor.product) {
      try {
        await productMutations.update.mutateAsync({
          ...productEditor.product,
          name: draft.name,
          categoryId: draft.categoryId,
          published: draft.published,
          publicDescription: draft.publicDescription,
          imageUrl: draft.imageUrl || null,
        })
        const existingVariants = productEditor.product.variants

        for (const existing of existingVariants) {
          if (!draft.variants.some((v) => v.id === existing.id)) {
            await deleteVariant(existing.id)
          }
        }

        for (const v of draft.variants) {
          if (v.id && !v.id.startsWith('pending-')) {
            await updateVariant(v.id, {
              sku: v.sku,
              name: v.name,
              inventoryCost: v.inventoryCost,
              salePrice: v.salePrice,
              stock: v.stock,
              optionValueIds: v.optionValueIds,
            })
          } else {
            await createVariant(productEditor.product.id, {
              sku: v.sku,
              name: v.name,
              inventoryCost: v.inventoryCost,
              salePrice: v.salePrice,
              stock: v.stock,
              optionValueIds: v.optionValueIds,
            })
          }
        }
        toast.success(toastMessages.product.updated)
        void qc.invalidateQueries({ queryKey: qk.products(user) })
        return true
      } catch {
        toast.error('No pudimos guardar el producto. Inténtalo de nuevo.')
        return false
      }
    }

    try {
      await productMutations.createWithVariants.mutateAsync({
        product: {
          name: draft.name,
          categoryId: draft.categoryId,
          published: draft.published,
          publicDescription: draft.publicDescription,
          imageUrl: draft.imageUrl || null,
        },
        variants: draft.variants.map((v) => ({
          sku: v.sku,
          name: v.name,
          inventoryCost: v.inventoryCost,
          salePrice: v.salePrice,
          stock: v.stock,
          optionValueIds: v.optionValueIds,
        })),
      })
      toast.success(toastMessages.product.created)
      setProductEditor(null)
      return true
    } catch {
      toast.error('No pudimos guardar el producto. Inténtalo de nuevo.')
      return false
    }
  }

  const handleVariantsChanged = () => {
    void qc.invalidateQueries({ queryKey: qk.products(user) }).then(() => {
      if (productEditor?.product) {
        const freshProducts = qc.getQueryData<Product[]>(qk.products(user))
        if (freshProducts) {
          const freshProduct = freshProducts.find(
            (p) => p.id === productEditor.product!.id,
          )
          if (freshProduct) {
            setProductEditor({ ...productEditor, product: freshProduct })
          }
        }
      }
    })
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
            onClose={() => setProductEditor(null)}
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
            onSelectOrder={(order) => setOrderDetail(order)}
          />
        )}
        {page === 'Pedidos' && orderDetail && orderEditor === undefined && (
          <OrderDetailPage
            order={orders.find((o) => o.id === orderDetail.id) ?? orderDetail}
            products={products}
            currency={settings.currency}
            isSubmittingPayment={registerPaymentPending}
            onBack={() => setOrderDetail(null)}
            onEdit={(order) => {
              setOrderDetail(null)
              setOrderEditor(order)
            }}
            onStatusChange={changeOrderStatus}
            onPaymentChange={changeOrderPayment}
            onRegisterPayment={registerPayment}
            onCancel={(order) => changeOrderStatus(order, 'cancelled')}
          />
        )}
        {page === 'Pedidos' && orderEditor !== undefined && (
          <OrderCreatePage
            initial={orderEditor}
            clients={clients}
            products={products}
            currency={settings.currency}
            onClose={() => setOrderEditor(undefined)}
            onBackToDetail={
              orderEditor?.databaseId
                ? () => {
                    setOrderEditor(undefined)
                    setOrderDetail(orderEditor)
                  }
                : undefined
            }
            onSubmit={async (clientId, items, payment) => {
              if (!orderEditor) {
                return addOrderAction(clientId, items, payment)
              }
              return updateExistingOrder(orderEditor, clientId, items, payment)
            }}
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
