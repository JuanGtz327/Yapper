import { toast } from 'react-toastify'

const DEFAULT_AUTO_CLOSE = 3000

export const toastMessages = {
  product: {
    created: 'Producto guardado exitosamente.',
    updated: 'Producto actualizado exitosamente.',
    deleted: 'Producto eliminado.',
  },
  client: {
    created: 'Cliente guardado exitosamente.',
    updated: 'Cliente actualizado exitosamente.',
    deleted: 'Cliente eliminado.',
  },
  order: {
    created: 'Pedido creado exitosamente.',
    cancelled: 'Pedido cancelado.',
    statusUpdated: 'Estado del pedido actualizado.',
    paymentUpdated: 'Estado del pago actualizado.',
  },
  category: {
    created: 'Categoría creada.',
    deleted: 'Categoría eliminada.',
  },
  variant: {
    created: 'Variante guardada exitosamente.',
    updated: 'Variante actualizada exitosamente.',
    deleted: 'Variante eliminada.',
  },
  optionType: {
    created: 'Tipo de opción creado.',
    deleted: 'Tipo de opción eliminado.',
  },
  optionValue: {
    created: 'Valor agregado.',
    deleted: 'Valor eliminado.',
  },
  settings: {
    saved: 'Configuración guardada.',
  },
} as const

export function useToast() {
  const success = (message: string) => {
    toast.success(message, { autoClose: DEFAULT_AUTO_CLOSE })
  }

  const error = (message: string) => {
    toast.error(message, { autoClose: 5000 })
  }

  return { success, error }
}
