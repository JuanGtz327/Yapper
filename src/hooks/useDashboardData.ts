import { useMemo, useState, useCallback, type FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import type {
  BusinessSettings,
  Client,
  Order,
  OrderItemInput,
  Product,
} from '../types.ts'
import { isSafeImageUrl } from '../lib/security.ts'
import { normalizeMexicanWhatsApp } from '../lib/whatsapp.ts'
import { useProductsQuery } from './queries/useProducts.ts'
import { useClientsQuery } from './queries/useClients.ts'
import { useOrdersQuery } from './queries/useOrders.ts'
import { useSettingsQuery } from './queries/useSettings.ts'
import { useSalesQuery } from './queries/useSales.ts'
import { useCategoriesQuery } from './queries/useCategories.ts'
import { useOptionTypesQuery } from './queries/useOptionTypes.ts'
import { useProductsMutations } from './queries/useProductsMutations.ts'
import { useClientsMutations } from './queries/useClientsMutations.ts'
import { useOrdersMutations } from './queries/useOrdersMutations.ts'
import { useSettingsMutation } from './queries/useSettingsMutation.ts'
import { useToast, toastMessages } from './useToast.ts'

export function useDashboardData(user: User | null) {
  const productsQuery = useProductsQuery(user)
  const clientsQuery = useClientsQuery(user)
  const ordersQuery = useOrdersQuery(user)
  const settingsQuery = useSettingsQuery(user)
  const salesQuery = useSalesQuery(user, '7d')
  const categoriesQuery = useCategoriesQuery(user)
  const optionTypesQuery = useOptionTypesQuery(user)

  const products = productsQuery.data ?? []
  const clients = clientsQuery.data ?? []
  const rawOrders = ordersQuery.data ?? []
  const categories = categoriesQuery.data ?? []
  const optionTypes = optionTypesQuery.data ?? []
  const settings = settingsQuery.data ?? {
    businessName: 'Mi negocio',
    currency: 'MXN',
    lowStockThreshold: 5,
    publicCatalogEnabled: false,
    publicSlug: '',
    whatsappNumber: '',
    publicIntro: '',
  }
  const sales = salesQuery.data ?? []

  const orders = useMemo(() => {
    return rawOrders.map((order) => ({
      ...order,
      client:
        clients.find((client) => client.id === order.clientId)?.name ||
        'Cliente sin nombre',
    }))
  }, [rawOrders, clients])

  const dataLoading =
    productsQuery.isLoading || clientsQuery.isLoading || ordersQuery.isLoading

  const toast = useToast()

  const [confirmState, setConfirmState] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  const productMutations = useProductsMutations(user)
  const clientMutations = useClientsMutations(user)
  const orderMutations = useOrdersMutations(user)
  const settingsMutation = useSettingsMutation(user)

  const addProduct = useCallback(
    async (
      event: FormEvent<HTMLFormElement>,
      editing: Product | null,
    ): Promise<boolean> => {
      event.preventDefault()
      const form = new FormData(event.currentTarget)
      const name = String(form.get('name') || '').trim()
      const sku = String(form.get('sku') || '').trim()
      const salePrice = Number(form.get('salePrice') ?? form.get('price'))
      const inventoryCost = Number(
        form.get('inventoryCost') ?? form.get('cost') ?? 0,
      )
      const stock = Number(form.get('stock'))
      if (name.length < 2 || name.length > 120) {
        toast.error('El nombre debe tener entre 2 y 120 caracteres.')
        return false
      }
      if (!editing) {
        if (!sku) {
          toast.error('El SKU es obligatorio.')
          return false
        }
        if (!Number.isFinite(salePrice) || salePrice < 0) {
          toast.error(
            'Introduce un precio de venta válido mayor o igual a cero.',
          )
          return false
        }
        if (!Number.isInteger(stock) || stock < 0) {
          toast.error(
            'Las existencias deben ser un número entero no negativo.',
          )
          return false
        }
      }
      const imageUrl = String(form.get('imageUrl') || '').trim() || null
      if (imageUrl && !isSafeImageUrl(imageUrl)) {
        toast.error('La imagen pública debe usar una URL HTTPS válida.')
        return false
      }
      const categoryId = (form.get('categoryId') as string) || null
      const newProduct = {
        id: editing?.id ?? `p${Date.now()}`,
        name,
        category: editing?.category ?? 'General',
        categoryId,
        published: form.get('published') === 'on',
        publicDescription: String(form.get('publicDescription') || '').trim(),
        imageUrl,
        color: editing?.color ?? 'sky',
        variants: editing?.variants ?? [],
      } satisfies Product
      try {
        if (editing) {
          await productMutations.update.mutateAsync(newProduct)
        } else {
          await productMutations.create.mutateAsync({
            product: newProduct,
            defaultVariant: {
              sku,
              inventoryCost,
              salePrice,
              stock,
              optionValueIds: [],
            },
          })
        }
        toast.success(
          editing
            ? toastMessages.product.updated
            : toastMessages.product.created,
        )
        return true
      } catch {
        toast.error('No pudimos guardar el producto. Inténtalo de nuevo.')
        return false
      }
    },
    [productMutations, toast],
  )

  const addClient = useCallback(
    async (
      event: FormEvent<HTMLFormElement>,
      editing: Client | null,
    ): Promise<boolean> => {
      event.preventDefault()
      const form = new FormData(event.currentTarget)
      const name = String(form.get('name') || '').trim()
      if (name.length < 2 || name.length > 120) {
        toast.error('El nombre debe tener entre 2 y 120 caracteres.')
        return false
      }
      const initials = name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
      const newClient = {
        id: editing?.id ?? `c${Date.now()}`,
        name,
        phone: String(form.get('phone') || ''),
        zone: String(form.get('zone') || 'Sin zona'),
        orders: editing?.orders ?? 0,
        initials,
      } satisfies Client
      try {
        if (editing) {
          await clientMutations.update.mutateAsync(newClient)
        } else {
          await clientMutations.create.mutateAsync(newClient)
        }
        toast.success(
          editing
            ? toastMessages.client.updated
            : toastMessages.client.created,
        )
        return true
      } catch {
        toast.error('No pudimos guardar el cliente. Inténtalo de nuevo.')
        return false
      }
    },
    [clientMutations, toast],
  )

  const removeProduct = useCallback(
    async (id: string) => {
      const product = products.find((p) => p.id === id)
      setConfirmState({
        title: 'Eliminar producto',
        message: `¿Eliminar el producto "${product?.name ?? ''}"? Esta acción no se puede deshacer.`,
        onConfirm: async () => {
          try {
            await productMutations.remove.mutateAsync(id)
            toast.success(toastMessages.product.deleted)
          } catch {
            toast.error('No pudimos eliminar el producto.')
          }
        },
      })
    },
    [products, productMutations, toast],
  )

  const removeClient = useCallback(
    async (id: string) => {
      const client = clients.find((c) => c.id === id)
      setConfirmState({
        title: 'Eliminar cliente',
        message: `¿Eliminar el cliente "${client?.name ?? ''}"? Esta acción no se puede deshacer.`,
        onConfirm: async () => {
          try {
            await clientMutations.remove.mutateAsync(id)
            toast.success(toastMessages.client.deleted)
          } catch {
            toast.error('No pudimos eliminar el cliente.')
          }
        },
      })
    },
    [clients, clientMutations, toast],
  )

  const addOrder = useCallback(
    async (
      clientId: string,
      items: OrderItemInput[],
      payment: 'pending' | 'paid',
    ): Promise<boolean> => {
      const client = clients.find((item) => item.id === clientId)
      if (!client) throw new Error('Selecciona un cliente')
      try {
        await orderMutations.create.mutateAsync({ clientId, items, payment })
        toast.success(toastMessages.order.created)
        return true
      } catch {
        toast.error('No pudimos crear el pedido. Inténtalo de nuevo.')
        return false
      }
    },
    [clients, orderMutations, toast],
  )

  const cancelExistingOrder = useCallback(
    async (order: Order) => {
      if (order.status === 'Cancelado') return
      setConfirmState({
        title: 'Cancelar pedido',
        message:
          '¿Cancelar este pedido? Se restaurarán sus existencias en el inventario.',
        onConfirm: async () => {
          try {
            await orderMutations.cancel.mutateAsync(order)
            toast.success(toastMessages.order.cancelled)
          } catch {
            toast.error(
              'No pudimos cancelar el pedido. Puede que ya esté cancelado.',
            )
          }
        },
      })
    },
    [orderMutations, toast],
  )

  const changeOrderStatus = useCallback(
    async (order: Order, status: 'pending' | 'delivered' | 'cancelled') => {
      if (status === 'cancelled') {
        await cancelExistingOrder(order)
        return
      }
      try {
        await orderMutations.updateStatus.mutateAsync({ order, status })
        toast.success(toastMessages.order.statusUpdated)
      } catch {
        toast.error('No pudimos actualizar el estado del pedido.')
      }
    },
    [orderMutations, cancelExistingOrder, toast],
  )

  const changeOrderPayment = useCallback(
    async (order: Order, payment: 'pending' | 'paid') => {
      try {
        await orderMutations.updatePayment.mutateAsync({ order, payment })
        toast.success(toastMessages.order.paymentUpdated)
      } catch {
        toast.error('No pudimos actualizar el estado del pago.')
      }
    },
    [orderMutations, toast],
  )

  const updateBusinessSettings = useCallback(
    async (next: BusinessSettings) => {
      const businessName = next.businessName.trim()
      if (businessName.length < 2 || businessName.length > 120) {
        toast.error('El nombre debe tener entre 2 y 120 caracteres.')
        return
      }
      if (
        !Number.isInteger(next.lowStockThreshold) ||
        !Number.isFinite(next.lowStockThreshold) ||
        next.lowStockThreshold < 0 ||
        next.lowStockThreshold > 10000
      ) {
        toast.error('El umbral debe ser un entero entre 0 y 10,000.')
        return
      }
      const slug = (next.publicSlug ?? '').trim().toLowerCase()
      if (
        next.publicCatalogEnabled &&
        !/^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(slug)
      ) {
        toast.error(
          'El slug público solo acepta letras minúsculas, números y guiones (2–50 caracteres).',
        )
        return
      }
      const normalizedWhatsApp = normalizeMexicanWhatsApp(next.whatsappNumber)
      if (next.publicCatalogEnabled && !normalizedWhatsApp) {
        toast.error('Configura un WhatsApp mexicano válido de 10 dígitos.')
        return
      }
      const validated = {
        ...next,
        businessName,
        publicSlug: slug,
        whatsappNumber: normalizedWhatsApp ?? '',
      }
      try {
        await settingsMutation.mutateAsync(validated)
        toast.success(toastMessages.settings.saved)
      } catch {
        toast.error(
          'No pudimos guardar la configuración. Inténtalo de nuevo.',
        )
      }
    },
    [settingsMutation, toast],
  )

  return {
    products,
    clients,
    orders,
    categories,
    optionTypes,
    sales,
    settings,
    dataLoading,
    confirmState,
    clearConfirm: () => setConfirmState(null),
    addProduct,
    addClient,
    removeProduct,
    removeClient,
    addOrder,
    changeOrderStatus,
    changeOrderPayment,
    updateBusinessSettings,
  }
}
