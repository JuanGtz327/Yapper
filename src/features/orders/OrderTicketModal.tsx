import { useState } from 'react'
import { Pencil, X } from 'lucide-react'
import type { MouseEvent } from 'react'
import type { Order, Product } from '../../types.ts'
import { formatMoney } from '../../lib/format.ts'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Badge } from '../../components/ui/badge.tsx'
import { useOrderPaymentsQuery } from '../../hooks/queries/useOrderPayments.ts'
import { PaymentProgress } from './PaymentProgress.tsx'
import { PaymentHistory } from './PaymentHistory.tsx'
import { PaymentModal, PaymentButton } from './PaymentModal.tsx'

export function OrderTicketModal({
  order,
  products,
  currency,
  isSubmittingPayment,
  onClose,
  onEdit,
  onStatusChange,
  onPaymentChange,
  onRegisterPayment,
  onCancel,
}: {
  order: Order
  products: Product[]
  currency: string
  isSubmittingPayment: boolean
  onClose: () => void
  onEdit?: (order: Order) => void
  onStatusChange: (order: Order, status: 'pending' | 'delivered') => void
  onPaymentChange: (order: Order, payment: 'pending' | 'paid') => void
  onRegisterPayment: (data: {
    orderId: string
    amount: number
    paymentMethod: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Otro'
    reference?: string
    notes?: string
  }) => void
  onCancel: (order: Order) => void
}) {
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const { data: orderPayments = [] } = useOrderPaymentsQuery(
    order.databaseId ?? null,
  )
  const lines = order.itemLines ?? []
  const findVariant = (variantId: string) =>
    products
      .flatMap((product) => product.variants)
      .find((variant) => variant.id === variantId)
  const formatVariantLabel = (line: (typeof lines)[number]) => {
    const variant = findVariant(line.variantId)
    const optionValues =
      variant?.optionValues
        .map((option) => option.value)
        .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })) ?? []
    if (optionValues.length) return optionValues.join(' - ')
    return line.variantLabelSnapshot || variant?.name || ''
  }
  const lineItems = lines
    .map((line) => {
      if (line.productNameSnapshot) {
        return {
          name: line.productNameSnapshot,
          variantLabel: formatVariantLabel(line),
          quantity: line.quantity,
          unitPrice: line.unitPrice ?? 0,
          unitCost: line.unitCostSnapshot ?? 0,
          total: line.lineTotal ?? (line.unitPrice ?? 0) * line.quantity,
          isSnapshot: true,
        }
      }
      let productName = 'Producto no disponible'
      let variantLabel = ''
      let unitPrice = 0
      let unitCost = 0
      for (const product of products) {
        const variant = product.variants.find((v) => v.id === line.variantId)
        if (variant) {
          productName = product.name
          unitPrice = variant.salePrice
          unitCost = variant.inventoryCost
          variantLabel = formatVariantLabel(line)
          break
        }
      }
      return {
        name: productName,
        variantLabel,
        quantity: line.quantity,
        unitPrice,
        unitCost,
        total: unitPrice * line.quantity,
        isSnapshot: false,
      }
    })
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }) ||
        a.variantLabel.localeCompare(b.variantLabel, 'es', {
          sensitivity: 'base',
        }),
    )
  const calculatedTotal = lineItems.reduce((sum, line) => sum + line.total, 0)
  const total = lineItems.length ? calculatedTotal : order.total
  const paidAmount = order.paidAmount ?? 0
  const hasRemainingBalance = paidAmount < total && order.status !== 'Cancelado'

  return (
    <ModalFrame title={`Detalles del pedido ${order.id}`} onClose={onClose}>
      <div className="order-ticket">
        <dl className="grid grid-cols-2 gap-3.5 m-0">
          <div className="p-3 rounded-[9px] bg-[#faf7f9]">
            <dt className="text-muted-foreground text-[10px] font-bold">
              Cliente
            </dt>
            <dd className="mt-[5px] text-foreground text-[13px] font-bold">
              {order.client}
            </dd>
          </div>
          <div className="p-3 rounded-[9px] bg-[#faf7f9]">
            <dt className="text-muted-foreground text-[10px] font-bold">
              Fecha
            </dt>
            <dd className="mt-[5px] text-foreground text-[13px] font-bold">
              {order.date}
            </dd>
          </div>
          <div className="p-3 rounded-[9px] bg-[#faf7f9]">
            <dt className="text-muted-foreground text-[10px] font-bold">
              Entrega
            </dt>
            <dd className="mt-[5px] text-foreground text-[13px] font-bold">
              <StatusBadge value={order.status} />
            </dd>
          </div>
          <div className="p-3 rounded-[9px] bg-[#faf7f9]">
            <dt className="text-muted-foreground text-[10px] font-bold">
              Pago
            </dt>
            <dd className="mt-[5px] text-foreground text-[13px] font-bold">
              <StatusBadge value={order.payment} />
            </dd>
          </div>
        </dl>

        <PaymentProgress
          total={total}
          paidAmount={paidAmount}
          currency={currency}
        />

        <section
          className="mt-[22px] p-4 border border-[#e8e0e7] rounded-xl bg-white max-[650px]:p-3"
          aria-labelledby="ticket-products-title"
        >
          <div className="flex items-center justify-between mb-3.5">
            <h3
              id="ticket-products-title"
              className="m-0 text-foreground text-sm"
            >
              Productos
            </h3>
            <span className="text-muted-foreground text-[11px]">
              {lineItems.reduce((sum, line) => sum + line.quantity, 0)} piezas
            </span>
          </div>
          {lineItems.length ? (
            <>
              <div
                className="grid grid-cols-[minmax(0,1fr)_44px_76px_76px] items-center gap-[10px] max-[650px]:grid-cols-[minmax(0,1fr)_34px_64px_64px] max-[650px]:gap-[6px] pb-2 border-b border-border text-[#aaa5a8] text-[9px] font-bold tracking-[0.6px] uppercase max-[650px]:text-[8px]"
                aria-hidden="true"
              >
                <span className="text-right">Producto</span>
                <span className="text-right">Cant.</span>
                <span className="text-right">Precio</span>
                <span className="text-right">Total</span>
              </div>
              <ul className="grid gap-0 p-0 m-0 list-none">
                {lineItems.map((line, index) => (
                  <li
                    className="grid grid-cols-[minmax(0,1fr)_44px_76px_76px] items-center gap-[10px] max-[650px]:grid-cols-[minmax(0,1fr)_34px_64px_64px] max-[650px]:gap-[6px] py-3 border-b border-dashed border-[#e8e0e7] text-[#5e5960] text-[11px] last:border-b-0"
                    key={`${line.name}-${index}`}
                  >
                    <div className="ticket-product">
                      <strong className="block text-foreground text-xs max-[650px]:text-[11px]">
                        {line.name}
                      </strong>
                      {line.variantLabel && (
                        <span className="block mt-[3px] text-muted-foreground text-[10px] text-muted-foreground text-xs">
                          {line.variantLabel}
                        </span>
                      )}
                      <span className="block mt-[3px] text-muted-foreground text-[10px] mt-[2px] text-[9px]">
                        {formatMoney(line.unitPrice, currency)} por unidad
                      </span>
                    </div>
                    <span className="text-foreground font-bold text-right">
                      {line.quantity}
                    </span>
                    <span className="text-right">
                      {formatMoney(line.unitPrice, currency)}
                    </span>
                    <strong className="text-right text-primary">
                      {formatMoney(line.total, currency)}
                    </strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-muted-foreground text-xs">
              No hay productos detallados para este pedido.
            </p>
          )}
        </section>
        <div className="flex items-center justify-between mt-[18px] pt-4 border-t-2 border-primary text-foreground text-sm font-bold">
          <span>Total del pedido</span>
          <strong className="text-primary text-[24px] max-[650px]:text-[21px]">
            {formatMoney(total, currency)}
          </strong>
        </div>

        {orderPayments.length > 0 && (
          <PaymentHistory payments={orderPayments} currency={currency} />
        )}

        {hasRemainingBalance && (
          <div className="mt-4 pt-4 border-t border-border">
            <PaymentButton onClick={() => setShowPaymentModal(true)} />
          </div>
        )}

        {order.status !== 'Cancelado' && (
          <section
            className="grid gap-[18px] mt-[23px] pt-5 border-t border-border"
            aria-label="Acciones del pedido"
          >
            <div className="order-status-controls">
              <fieldset>
                <legend>Estado de entrega</legend>
                <div
                  className="flex p-[3px] border border-[#ded8dd] rounded-[9px] bg-[#faf7f9]"
                  role="group"
                  aria-label={`Estado de entrega de ${order.id}`}
                >
                  <StatusButton
                    active={order.status === 'Pendiente'}
                    label="Pendiente"
                    onClick={(event) => {
                      event.stopPropagation()
                      onStatusChange(order, 'pending')
                    }}
                  />
                  <StatusButton
                    active={order.status === 'Entregado'}
                    label="Entregado"
                    onClick={(event) => {
                      event.stopPropagation()
                      onStatusChange(order, 'delivered')
                    }}
                  />
                </div>
              </fieldset>
              <fieldset>
                <legend>Estado del pago</legend>
                <div
                  className="flex p-[3px] border border-[#ded8dd] rounded-[9px] bg-[#faf7f9]"
                  role="group"
                  aria-label={`Estado de pago de ${order.id}`}
                >
                  <StatusButton
                    active={order.payment === 'Pendiente'}
                    label="Pendiente"
                    onClick={(event) => {
                      event.stopPropagation()
                      onPaymentChange(order, 'pending')
                    }}
                  />
                  <StatusButton
                    active={order.payment === 'Pagado'}
                    label="Pagado"
                    onClick={(event) => {
                      event.stopPropagation()
                      onPaymentChange(order, 'paid')
                    }}
                  />
                </div>
              </fieldset>
            </div>
            <div className="flex justify-end gap-[10px] m-0 max-[650px]:flex-wrap">
              {onEdit && (
                <Button
                  variant="primary"
                  className="max-[650px]:flex-1"
                  onClick={(event) => {
                    event.stopPropagation()
                    onEdit(order)
                    onClose()
                  }}
                  type="button"
                >
                  <Pencil size={16} aria-hidden="true" />
                  Editar pedido
                </Button>
              )}
              <Button
                variant="danger"
                className="max-[650px]:flex-1"
                onClick={(event) => {
                  event.stopPropagation()
                  onCancel(order)
                  onClose()
                }}
                type="button"
              >
                <X size={16} aria-hidden="true" />
                Cancelar pedido
              </Button>
            </div>
          </section>
        )}
      </div>

      {showPaymentModal && order.databaseId && (
        <PaymentModal
          order={order}
          currency={currency}
          isSubmitting={isSubmittingPayment}
          onClose={() => setShowPaymentModal(false)}
          onSubmit={(data) => {
            onRegisterPayment({ orderId: order.databaseId!, ...data })
            setShowPaymentModal(false)
          }}
        />
      )}
    </ModalFrame>
  )
}

function StatusBadge({ value }: { value: string }) {
  return (
    <Badge
      variant={
        value === 'Pagado' || value === 'Entregado'
          ? 'success'
          : value === 'Cancelado'
            ? 'danger'
            : value === 'Parcial'
              ? 'info'
              : 'warning'
      }
    >
      {value}
    </Badge>
  )
}

function StatusButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      className={`flex-1 min-h-[36px] py-[7px] px-[9px] border-0 rounded-[7px] bg-transparent text-[11px] font-bold ${active ? 'text-[#6d3c72] bg-white shadow-[0_1px_4px_#30272e14]' : 'text-muted-foreground hover:text-[#6d3c72] hover:bg-[#f3eaf4]'}`}
      aria-pressed={active}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}
