# Build Plan

## Shipped

- [x] 1. **Project scaffolding** - Vite + React 19 + TypeScript setup with oxlint, Prettier, and Tailwind CSS v4
- [x] 2. **Supabase integration** - client setup, env vars, and database connection
- [x] 3. **Auth** - email/password authentication with Supabase Auth
- [x] 4. **Dashboard** - summary of sales, recent orders, and low-stock products
- [x] 5. **Product management** - CRUD with categories, option types, and variants
- [x] 6. **Client management** - CRUD with phone, zone, and order history
- [x] 7. **Order management** - create/edit orders with line items, status (Pendiente/Entregado/Cancelado)
- [x] 8. **Payment tracking** - register payments with method (Efectivo/Transferencia/Tarjeta/Otro), reference, and notes
- [x] 9. **Public catalog** - slug-based public page with WhatsApp link
- [x] 10. **Stats pages** - sales aggregates and reports
- [x] 11. **Business settings** - name, currency, low-stock threshold, catalog config
- [x] 12. **PWA** - installable with auto-update via vite-plugin-pwa
- [x] 13. **Toast notifications** - success/error feedback via react-toastify
- [x] 14. **Basic tests** - Vitest + Testing Library with tests in lib/ and hooks/

## Next

- [x] 15. **Refactor App.tsx** - break up the monolith into route-level components, extract state to hooks/contexts
  - [x] 15a. Extract modal manager - move modal state and rendering to ModalContext + ModalManager
  - [x] 15b. Extract product editor hook - move product editor state and handlers to useProductEditor
  - [x] 15c. Extract order editor hook - move order editor/detail state and handlers to useOrderEditor
  - [x] 15d. Split page sections - extract each page block into named components
- [x] 16. **Real routing** - replace useState-based page switching with wouter routes
- [x] 17. **Type cleanup** - consolidate types.ts and types/supabase.ts, add missing types, remove loose `any`s
- [x] 18. **Full restyle** - migrate from App.css monolith to Tailwind utility classes, add shadcn/ui components
  - [x] 18a. Theme & shadcn/ui setup - install shadcn/ui, configure tokens, create base component primitives
  - [x] 18b. Layout restyle - app shell, sidebar, topbar, mobile nav drawer to Tailwind
  - [x] 18c. Dashboard restyle - welcome card, stats grid, charts, quick actions
  - [x] 18d. Products & Orders restyle - product forms, order forms, variants, payment tracking
    - [x] 18d. Products pages - ProductsPage, ProductCreatePage, product modals
    - [x] 18d2. Orders pages - OrdersPage, OrderCreatePage, OrderDetailPage, order modals
    - [x] 18d3. Payment components - PaymentForm, PaymentModal, PaymentProgress, PaymentHistory
    - [x] 18d4. Shared classes - table styles, form-grid, modal-actions, badge, segmented-control
  - [x] 18e. Clients, Settings, Stats, Catalog restyle - remaining pages + public catalog + auth screen
    - [x] 18e. Clients, Settings, Stats restyle - ClientsPage, ClientModal, SettingsPage, StatsPage
    - [x] 18e2. Auth & Catalog restyle - AuthScreen, CatalogPage, PublicCatalogPage
  - [x] 18f. Cleanup - remove App.css, verify responsive behavior, final pass
- [ ] 19. **Business test strategy** - estrategia de pruebas centrada en reglas y flujos de negocio
  - [x] 19a. **Test audit and cleanup** - eliminar tests que solo validan renderizado, clases o textos sin comportamiento relevante
  - [x] 19b. **Unit tests for business actions** - probar cada acción importante de productos, variantes, inventario, pedidos, pagos, clientes y configuración
    - [x] 19b1. **Product & variant repository tests** - createProduct, createProductWithVariants, createVariant, updateVariantPrice, deleteVariant, loadProductsPage, loadProductById, loadInventoryAggregates
    - [x] 19b2. **Order & payment repository + hook tests** - updateOrderStatus, cancelOrder, updateOrderPayment, loadOrdersPage, useOrdersMutations.update, handleRegisterPayment, updateExistingOrder
    - [x] 19b3. **Client, settings & remaining hook tests** - loadClients, loadClientsPage, loadSettings, saveSettings, useSettingsMutation, useOrderPaymentsQuery, useProductEditor full paths
  - [x] 19c. **E2E foundation** - configurar Playwright, entorno aislado, autenticación reutilizable, fixtures, seed y comandos
  - [x] 19d. **Order lifecycle E2E** - crear pedido completo, calcular total, guardar, registrar pago, cambiar estado y verificar inventario
  - [x] 19e. **Inventory and product lifecycle E2E** - crear producto, categoría, opciones y variante; actualizar individualmente título, precio, costo, SKU y stock
  - [x] 19f. **Clients and payments E2E** - alta/edición de cliente, historial, pagos parciales y pagos completos
  - [x] 19g. **Catalog, settings, stats and auth E2E** - autenticación, configuración, publicación del catálogo, acceso público y estadísticas
- [x] 20. **Deploy readiness** - Vercel config, env vars, production build verification
