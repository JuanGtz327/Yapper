import { ArrowLeft, Pencil, X } from 'lucide-react'
import type { Order, Product } from '../../types.ts'
import { formatMoney } from '../../lib/format.ts'
import { useOrderPaymentsQuery } from '../../hooks/queries/useOrderPayments.ts'
import { PaymentProgress } from './PaymentProgress.tsx'
import { PaymentHistory } from './PaymentHistory.tsx'
import { PaymentModal, PaymentButton } from './PaymentModal.tsx'
import { ConfirmModal } from '../../components/ui/ConfirmModal.tsx'
import { useState } from 'react'

export function OrderDetailPage({
  order,
  products,
  currency,
  isSubmittingPayment,
  onBack,
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
  onBack: () => void
  onEdit: (order: Order) => void
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
  const [confirmPaid, setConfirmPaid] = useState(false)
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
          total: line.lineTotal ?? (line.unitPrice ?? 0) * line.quantity,
        }
      }
      let productName = 'Producto no disponible'
      let variantLabel = ''
      let unitPrice = 0
      for (const product of products) {
        const variant = product.variants.find((v) => v.id === line.variantId)
        if (variant) {
          productName = product.name
          unitPrice = variant.salePrice
          variantLabel = formatVariantLabel(line)
          break
        }
      }
      return {
        name: productName,
        variantLabel,
        quantity: line.quantity,
        unitPrice,
        total: unitPrice * line.quantity,
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
  const isPaid = order.payment === 'Pagado' || order.payment === 'Parcial'
  const canEdit = order.status !== 'Cancelado' && !isPaid

  return (
    <section className="page-section order-detail-page">
      <div className="section-intro">
        <div>
          <span className="eyebrow">VENTAS</span>
          <h2>Detalles del pedido {order.id}</h2>
          <p>
            {order.client} — {order.date}
          </p>
        </div>
        <div className="section-actions">
          <button className="secondary-button" onClick={onBack} type="button">
            <ArrowLeft size={16} aria-hidden="true" />
            Volver a pedidos
          </button>
          {canEdit && (
            <button
              className="secondary-button"
              onClick={() => onEdit(order)}
              type="button"
            >
              <Pencil size={16} aria-hidden="true" />
              Editar pedido
            </button>
          )}
          {canEdit && (
            <button
              className="cancel-button danger-action"
              onClick={() => {
                onCancel(order)
                onBack()
              }}
              type="button"
            >
              <X size={16} aria-hidden="true" />
              Cancelar pedido
            </button>
          )}
        </div>
      </div>

      <div className="order-detail-layout">
        <div className="order-detail-main">
          <div className="order-detail-card">
            <h3>Resumen</h3>
            <dl className="order-detail-grid-full">
              <div>
                <dt>Pedido</dt>
                <dd className="order-detail-id">{order.id}</dd>
              </div>
              <div>
                <dt>Cliente</dt>
                <dd>{order.client}</dd>
              </div>
              <div>
                <dt>Fecha</dt>
                <dd>{order.date}</dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd className="order-detail-total">{formatMoney(total, currency)}</dd>
              </div>
            </dl>
          </div>

          <div className="order-detail-card">
            <h3>Productos</h3>
            {lineItems.length ? (
              <div className="order-detail-products">
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
                          <span className="detail-muted">{line.variantLabel}</span>
                        )}
                        <span>{formatMoney(line.unitPrice, currency)} por unidad</span>
                      </div>
                      <span className="ticket-quantity">{line.quantity}</span>
                      <span>{formatMoney(line.unitPrice, currency)}</span>
                      <strong>{formatMoney(line.total, currency)}</strong>
                    </li>
                  ))}
                </ul>
                <div className="ticket-total">
                  <span>Total</span>
                  <strong>{formatMoney(total, currency)}</strong>
                </div>
              </div>
            ) : (
              <p className="detail-muted">
                No hay productos detallados para este pedido.
              </p>
            )}
          </div>
        </div>

        <div className="order-detail-sidebar">
          <div className="order-detail-card">
            <h3>Estado</h3>
            {order.status === 'Cancelado' ? (
              <div className="status-card-cancelled">
                <span className="badge danger">Cancelado</span>
                Pedido cancelado
              </div>
            ) : (
              <div className="status-card-rows">
                <fieldset className="status-card-row">
                  <legend>Entrega</legend>
                  <div
                    className="segmented-control"
                    role="radiogroup"
                    aria-label="Estado de entrega"
                  >
                    <button
                      className={`segmented-control-button${order.status === 'Pendiente' ? ' is-active' : ''}`}
                      onClick={() => onStatusChange(order, 'pending')}
                      type="button"
                      role="radio"
                      aria-checked={order.status === 'Pendiente'}
                    >
                      Pendiente
                    </button>
                    <button
                      className={`segmented-control-button${order.status === 'Entregado' ? ' is-active' : ''}`}
                      onClick={() => onStatusChange(order, 'delivered')}
                      type="button"
                      role="radio"
                      aria-checked={order.status === 'Entregado'}
                    >
                      Entregado
                    </button>
                  </div>
                </fieldset>
                <fieldset className="status-card-row">
                  <legend>Pago</legend>
                  {order.payment === 'Pagado' ? (
                    <div className="status-card-readonly">
                      <span className="badge success">Pagado</span>
                    </div>
                  ) : order.payment === 'Parcial' ? (
                    <div className="status-card-readonly">
                      <span className="badge info">Parcial</span>
                    </div>
                  ) : (
                    <div
                      className="segmented-control"
                      role="radiogroup"
                      aria-label="Estado de pago"
                    >
                      <button
                        className={`segmented-control-button${order.payment === 'Pendiente' ? ' is-active' : ''}`}
                        onClick={() => onPaymentChange(order, 'pending')}
                        type="button"
                        role="radio"
                        aria-checked={order.payment === 'Pendiente'}
                      >
                        Pendiente
                      </button>
                      <button
                        className="segmented-control-button"
                        onClick={() => setConfirmPaid(true)}
                        type="button"
                        role="radio"
                        aria-checked={false}
                      >
                        Pagado
                      </button>
                    </div>
                  )}
                </fieldset>
              </div>
            )}
          </div>

          <div className="order-detail-card">
            <h3>Pago</h3>
            <PaymentProgress
              total={total}
              paidAmount={paidAmount}
              currency={currency}
            />
            {hasRemainingBalance && (
              <PaymentButton
                onClick={() => setShowPaymentModal(true)}
              />
            )}
          </div>

          {orderPayments.length > 0 && (
            <div className="order-detail-card">
              <PaymentHistory payments={orderPayments} currency={currency} />
            </div>
          )}
        </div>
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

      {confirmPaid && (
        <ConfirmModal
          title="Marcar como pagado"
          message="Al marcar el pedido como pagado, no podrá ser editado. ¿Deseas continuar?"
          confirmLabel="Sí, marcar pagado"
          danger
          onConfirm={() => {
            onPaymentChange(order, 'paid')
            setConfirmPaid(false)
          }}
          onClose={() => setConfirmPaid(false)}
        />
      )}
    </section>
  )
}
