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
import { useProductsMutations } from './queries/useProductsMutations.ts'
import { useClientsMutations } from './queries/useClientsMutations.ts'
import { useOrdersMutations } from './queries/useOrdersMutations.ts'
import { useSettingsMutation } from './queries/useSettingsMutation.ts'

export function useDashboardData(user: User | null) {
  const productsQuery = useProductsQuery(user)
  const clientsQuery = useClientsQuery(user)
  const ordersQuery = useOrdersQuery(user)
  const settingsQuery = useSettingsQuery(user)
  const salesQuery = useSalesQuery(user, '7d')

  const products = productsQuery.data ?? []
  const clients = clientsQuery.data ?? []
  const rawOrders = ordersQuery.data ?? []
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
  const dataError =
    productsQuery.isError || clientsQuery.isError || ordersQuery.isError
      ? 'No pudimos cargar tus datos. Revisa la configuración de Supabase.'
      : ''

  const [mutationError, setMutationError] = useState('')

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
      const price = Number(form.get('price'))
      const stock = Number(form.get('stock'))
      if (name.length < 2 || name.length > 120) {
        setMutationError('El nombre debe tener entre 2 y 120 caracteres.')
        return false
      }
      if (!Number.isFinite(price) || price < 0) {
        setMutationError('Introduce un precio válido mayor o igual a cero.')
        return false
      }
      if (!Number.isInteger(stock) || stock < 0) {
        setMutationError(
          'Las existencias deben ser un número entero no negativo.',
        )
        return false
      }
      const imageUrl = String(form.get('imageUrl') || '').trim() || null
      if (imageUrl && !isSafeImageUrl(imageUrl)) {
        setMutationError('La imagen pública debe usar una URL HTTPS válida.')
        return false
      }
      const newProduct = {
        id: editing?.id ?? `p${Date.now()}`,
        name,
        category: String(form.get('category') || 'General'),
        price,
        stock,
        unit: editing?.unit ?? 'pieza',
        color: editing?.color ?? 'sky',
        published: form.get('published') === 'on',
        publicDescription: String(form.get('publicDescription') || '').trim(),
        imageUrl,
      } satisfies Product
      try {
        if (editing) {
          await productMutations.update.mutateAsync(newProduct)
        } else {
          await productMutations.create.mutateAsync(newProduct)
        }
        setMutationError('')
        return true
      } catch {
        setMutationError('No pudimos guardar el producto. Inténtalo de nuevo.')
        return false
      }
    },
    [productMutations],
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
        setMutationError('El nombre debe tener entre 2 y 120 caracteres.')
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
        setMutationError('')
        return true
      } catch {
        setMutationError('No pudimos guardar el cliente. Inténtalo de nuevo.')
        return false
      }
    },
    [clientMutations],
  )

  const removeProduct = useCallback(
    async (id: string) => {
      try {
        await productMutations.remove.mutateAsync(id)
      } catch {
        setMutationError('No pudimos eliminar el producto.')
      }
    },
    [productMutations],
  )

  const removeClient = useCallback(
    async (id: string) => {
      try {
        await clientMutations.remove.mutateAsync(id)
      } catch {
        setMutationError('No pudimos eliminar el cliente.')
      }
    },
    [clientMutations],
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
        setMutationError('')
        return true
      } catch {
        setMutationError('No pudimos crear el pedido. Inténtalo de nuevo.')
        return false
      }
    },
    [clients, orderMutations],
  )

  const cancelExistingOrder = useCallback(
    async (order: Order) => {
      if (order.status === 'Cancelado') return
      if (
        !window.confirm(
          '¿Cancelar este pedido? Se restaurarán sus existencias en el inventario.',
        )
      )
        return
      try {
        await orderMutations.cancel.mutateAsync(order)
        setMutationError('')
      } catch {
        setMutationError(
          'No pudimos cancelar el pedido. Puede que ya esté cancelado.',
        )
      }
    },
    [orderMutations],
  )

  const changeOrderStatus = useCallback(
    async (order: Order, status: 'pending' | 'delivered' | 'cancelled') => {
      if (status === 'cancelled') {
        await cancelExistingOrder(order)
        return
      }
      try {
        await orderMutations.updateStatus.mutateAsync({ order, status })
      } catch {
        setMutationError('No pudimos actualizar el estado del pedido.')
      }
    },
    [orderMutations, cancelExistingOrder],
  )

  const changeOrderPayment = useCallback(
    async (order: Order, payment: 'pending' | 'paid') => {
      try {
        await orderMutations.updatePayment.mutateAsync({ order, payment })
      } catch {
        setMutationError('No pudimos actualizar el estado del pago.')
      }
    },
    [orderMutations],
  )

  const updateBusinessSettings = useCallback(
    async (next: BusinessSettings) => {
      const businessName = next.businessName.trim()
      if (businessName.length < 2 || businessName.length > 120) {
        setMutationError('El nombre debe tener entre 2 y 120 caracteres.')
        return
      }
      if (
        !Number.isInteger(next.lowStockThreshold) ||
        !Number.isFinite(next.lowStockThreshold) ||
        next.lowStockThreshold < 0 ||
        next.lowStockThreshold > 10000
      ) {
        setMutationError('El umbral debe ser un entero entre 0 y 10,000.')
        return
      }
      const slug = (next.publicSlug ?? '').trim().toLowerCase()
      if (
        next.publicCatalogEnabled &&
        !/^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(slug)
      ) {
        setMutationError(
          'El slug público solo acepta letras minúsculas, números y guiones (2–50 caracteres).',
        )
        return
      }
      const normalizedWhatsApp = normalizeMexicanWhatsApp(next.whatsappNumber)
      if (next.publicCatalogEnabled && !normalizedWhatsApp) {
        setMutationError('Configura un WhatsApp mexicano válido de 10 dígitos.')
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
        setMutationError('')
      } catch {
        setMutationError(
          'No pudimos guardar la configuración. Inténtalo de nuevo.',
        )
      }
    },
    [settingsMutation],
  )

  return {
    products,
    clients,
    orders,
    sales,
    settings,
    dataLoading,
    dataError: dataError || mutationError,
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
