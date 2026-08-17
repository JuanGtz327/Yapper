import { useCallback, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Order, OrderItemInput, Client, Product } from '../types.ts'

type OrderEditorData = {
  addOrder: (
    clientId: string,
    items: OrderItemInput[],
    payment: 'pending' | 'paid',
  ) => Promise<boolean>
  changeOrderStatus: (
    order: Order,
    status: 'pending' | 'delivered' | 'cancelled',
  ) => void
  changeOrderPayment: (order: Order, payment: 'pending' | 'paid') => void
  registerPayment: (data: {
    orderId: string
    amount: number
    paymentMethod: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Otro'
    reference?: string
    notes?: string
  }) => Promise<void>
  registerPaymentPending: boolean
  updateExistingOrder: (
    order: Order,
    clientId: string,
    items: OrderItemInput[],
    payment: 'pending' | 'paid',
  ) => Promise<boolean>
  clients: Client[]
  products: Product[]
}

export function useOrderEditor(
  _user: User | null,
  dashboardData: OrderEditorData,
) {
  const [orderEditor, setOrderEditor] = useState<Order | null | undefined>(
    undefined,
  )
  const [orderDetail, setOrderDetail] = useState<Order | null>(null)

  const {
    addOrder,
    changeOrderStatus,
    changeOrderPayment,
    registerPayment,
    registerPaymentPending,
    updateExistingOrder,
  } = dashboardData

  const openOrderEditor = useCallback(
    (order?: Order) => setOrderEditor(order ?? null),
    [],
  )

  const selectOrder = useCallback((order: Order) => {
    setOrderDetail(order)
  }, [])

  const closeOrderDetail = useCallback(() => {
    setOrderDetail(null)
  }, [])

  const closeOrderEditor = useCallback(() => {
    setOrderEditor(undefined)
  }, [])

  const handleOrderSubmit = useCallback(
    async (
      clientId: string,
      items: OrderItemInput[],
      payment: 'pending' | 'paid',
      routeOrder?: Order | null,
    ): Promise<boolean> => {
      const orderToUpdate = routeOrder ?? orderEditor
      if (!orderToUpdate) {
        return addOrder(clientId, items, payment)
      }
      return updateExistingOrder(orderToUpdate, clientId, items, payment)
    },
    [orderEditor, addOrder, updateExistingOrder],
  )

  const handleStatusChange = useCallback(
    (order: Order, status: 'pending' | 'delivered' | 'cancelled') => {
      changeOrderStatus(order, status)
    },
    [changeOrderStatus],
  )

  const handlePaymentChange = useCallback(
    (order: Order, payment: 'pending' | 'paid') => {
      changeOrderPayment(order, payment)
    },
    [changeOrderPayment],
  )

  const handleRegisterPayment = useCallback(
    (data: {
      orderId: string
      amount: number
      paymentMethod: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Otro'
      reference?: string
      notes?: string
    }) => registerPayment(data),
    [registerPayment],
  )

  const handleCancelOrder = useCallback(
    (order: Order) => {
      changeOrderStatus(order, 'cancelled')
    },
    [changeOrderStatus],
  )

  const resetOrders = useCallback(() => {
    setOrderEditor(undefined)
    setOrderDetail(null)
  }, [])

  return {
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
  }
}
