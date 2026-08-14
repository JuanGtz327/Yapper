import { useState } from 'react'
import { Pencil, X } from 'lucide-react'
import type { MouseEvent } from 'react'
import type { Order, Product } from '../../types.ts'
import { formatMoney } from '../../lib/format.ts'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'
import { Button } from '../../components/ui/Button.tsx'
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
        <dl className="order-detail-grid">
          <div>
            <dt>Cliente</dt>
            <dd>{order.client}</dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>{order.date}</dd>
          </div>
          <div>
            <dt>Entrega</dt>
            <dd>
              <StatusBadge value={order.status} />
            </dd>
          </div>
          <div>
            <dt>Pago</dt>
            <dd>
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
          className="ticket-lines"
          aria-labelledby="ticket-products-title"
        >
          <div className="ticket-heading">
            <h3 id="ticket-products-title">Productos</h3>
            <span>
              {lineItems.reduce((sum, line) => sum + line.quantity, 0)} piezas
            </span>
          </div>
          {lineItems.length ? (
            <>
              <div className="ticket-columns" aria-hidden="true">
                <span>Producto</span>
                <span>Cant.</span>
                <span>Precio</span>
                <span>Total</span>
              </div>
              <ul>
                {lineItems.map((line, index) => (
                  <li key={`${line.name}-${index}`}>
                    <div className="ticket-product">
                      <strong>{line.name}</strong>
                      {line.variantLabel && (
                        <span className="detail-muted">
                          {line.variantLabel}
                        </span>
                      )}
                      <span>
                        {formatMoney(line.unitPrice, currency)} por unidad
                      </span>
                    </div>
                    <span className="ticket-quantity">{line.quantity}</span>
                    <span>{formatMoney(line.unitPrice, currency)}</span>
                    <strong>{formatMoney(line.total, currency)}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="detail-muted">
              No hay productos detallados para este pedido.
            </p>
          )}
        </section>
        <div className="ticket-total">
          <span>Total del pedido</span>
          <strong>{formatMoney(total, currency)}</strong>
        </div>

        {orderPayments.length > 0 && (
          <PaymentHistory payments={orderPayments} currency={currency} />
        )}

        {hasRemainingBalance && (
          <div className="payment-action-section">
            <PaymentButton onClick={() => setShowPaymentModal(true)} />
          </div>
        )}

        {order.status !== 'Cancelado' && (
          <section
            className="order-detail-actions"
            aria-label="Acciones del pedido"
          >
            <div className="order-status-controls">
              <fieldset>
                <legend>Estado de entrega</legend>
                <div
                  className="segmented-control"
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
                  className="segmented-control"
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
            <div className="modal-actions order-actions-footer">
              {onEdit && (
                <Button
                  variant="primary"
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
    <span
      className={
        value === 'Pagado' || value === 'Entregado'
          ? 'badge success'
          : value === 'Cancelado'
            ? 'badge danger'
            : value === 'Parcial'
              ? 'badge info'
              : 'badge warning'
      }
    >
      {value}
    </span>
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
      className={`segmented-control-button${active ? ' is-active' : ''}`}
      aria-pressed={active}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}
