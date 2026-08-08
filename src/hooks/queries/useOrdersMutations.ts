import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'
import {
  createOrder,
  cancelOrder,
  updateOrderStatus,
  updateOrderPayment,
} from '../../lib/repository.ts'
import { qk } from '../../lib/queryKeys.ts'
import type { Client, Order, Product } from '../../types.ts'

export function useOrdersMutations(user: User | null) {
  const qc = useQueryClient()

  const create = useMutation({
    mutationFn: ({
      clientId,
      items,
      payment,
    }: {
      clientId: string
      items: Array<{ variantId: string; quantity: number }>
      payment: 'pending' | 'paid'
    }) => {
      const clients = qc.getQueryData<Client[]>(qk.clients(user)) ?? []
      const client = clients.find((c) => c.id === clientId)
      return user
        ? createOrder(clientId, items, payment, client?.name ?? '')
        : Promise.resolve(`d${Date.now()}`)
    },
    onSuccess: (_databaseId, { clientId, items, payment }) => {
      const clients = qc.getQueryData<Client[]>(qk.clients(user)) ?? []
      const products = qc.getQueryData<Product[]>(qk.products(user)) ?? []

      // Find the variant price from products
      const total = items.reduce((sum, item) => {
        const product = products.find((p) =>
          p.variants.some((v) => v.id === item.variantId),
        )
        const variant = product?.variants.find((v) => v.id === item.variantId)
        return sum + (variant?.salePrice ?? 0) * item.quantity
      }, 0)

      const client = clients.find((c) => c.id === clientId)
      const databaseId = _databaseId as string

      // Optimistically update variant stock
      qc.setQueryData<Product[]>(qk.products(user), (current) =>
        (current ?? []).map((product) => ({
          ...product,
          variants: product.variants.map((variant) => {
            const item = items.find((entry) => entry.variantId === variant.id)
            return item
              ? { ...variant, stock: variant.stock - item.quantity }
              : variant
          }),
        })),
      )

      qc.setQueryData<Client[]>(qk.clients(user), (current) =>
        (current ?? []).map((item) =>
          item.id === clientId ? { ...item, orders: item.orders + 1 } : item,
        ),
      )
      qc.setQueryData<Order[]>(qk.orders(user), (current) => [
        {
          id: databaseId
            ? `#${databaseId.slice(0, 6).toUpperCase()}`
            : `#${1049 + (current ?? []).length}`,
          databaseId,
          clientId,
          client: client?.name || 'Cliente sin nombre',
          clientNameSnapshot: client?.name || undefined,
          date: 'Ahora',
          items: items.reduce((sum, item) => sum + item.quantity, 0),
          total,
          status: 'Pendiente',
          payment: payment === 'paid' ? 'Pagado' : 'Pendiente',
          itemLines: items,
        },
        ...(current ?? []),
      ])
      qc.invalidateQueries({ queryKey: qk.sales(user, '7d') })
    },
  })

  const cancel = useMutation({
    mutationFn: (order: Order) => {
      if (order.databaseId) return cancelOrder(order.databaseId)
      return Promise.resolve()
    },
    onSuccess: (_data, order) => {
      qc.setQueryData<Order[]>(qk.orders(user), (current) =>
        (current ?? []).map((item) =>
          item.id === order.id ? { ...item, status: 'Cancelado' } : item,
        ),
      )
      if (order.databaseId && user) {
        qc.invalidateQueries({ queryKey: qk.products(user) })
      } else if (order.itemLines) {
        // Restore stock for demo orders
        qc.setQueryData<Product[]>(qk.products(user), (current) =>
          (current ?? []).map((product) => ({
            ...product,
            variants: product.variants.map((variant) => {
              const line = order.itemLines?.find(
                (item) => item.variantId === variant.id,
              )
              return line
                ? { ...variant, stock: variant.stock + line.quantity }
                : variant
            }),
          })),
        )
      }
      qc.setQueryData<Client[]>(qk.clients(user), (current) =>
        (current ?? []).map((item) =>
          item.id === order.clientId
            ? { ...item, orders: Math.max(0, item.orders - 1) }
            : item,
        ),
      )
      qc.invalidateQueries({ queryKey: qk.sales(user, '7d') })
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({
      order,
      status,
    }: {
      order: Order
      status: 'pending' | 'delivered'
    }) => {
      if (order.databaseId) return updateOrderStatus(order.databaseId, status)
      return Promise.resolve()
    },
    onMutate: async ({ order, status }) => {
      await qc.cancelQueries({ queryKey: qk.orders(user) })
      const prev = qc.getQueryData<Order[]>(qk.orders(user))
      qc.setQueryData<Order[]>(qk.orders(user), (current) =>
        (current ?? []).map((item) =>
          item.id === order.id
            ? {
                ...item,
                status: status === 'delivered' ? 'Entregado' : 'Pendiente',
              }
            : item,
        ),
      )
      return { prev }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) qc.setQueryData(qk.orders(user), context.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.orders(user) })
    },
  })

  const updatePayment = useMutation({
    mutationFn: ({
      order,
      payment,
    }: {
      order: Order
      payment: 'pending' | 'paid'
    }) => {
      if (order.databaseId) return updateOrderPayment(order.databaseId, payment)
      return Promise.resolve()
    },
    onMutate: async ({ order, payment }) => {
      await qc.cancelQueries({ queryKey: qk.orders(user) })
      const prev = qc.getQueryData<Order[]>(qk.orders(user))
      qc.setQueryData<Order[]>(qk.orders(user), (current) =>
        (current ?? []).map((item) =>
          item.id === order.id
            ? {
                ...item,
                payment: payment === 'paid' ? 'Pagado' : 'Pendiente',
              }
            : item,
        ),
      )
      return { prev }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) qc.setQueryData(qk.orders(user), context.prev)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: qk.orders(user) })
      qc.invalidateQueries({ queryKey: qk.sales(user, '7d') })
    },
  })

  return { create, cancel, updateStatus, updatePayment }
}
