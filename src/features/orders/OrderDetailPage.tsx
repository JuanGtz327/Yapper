import { ArrowLeft, Pencil, X } from 'lucide-react'
import type { Order, Product } from '../../types.ts'
import { formatMoney } from '../../lib/format.ts'
import { useOrderPaymentsQuery } from '../../hooks/queries/useOrderPayments.ts'
import { PaymentProgress } from './PaymentProgress.tsx'
import { PaymentHistory } from './PaymentHistory.tsx'
import { PaymentModal, PaymentButton } from './PaymentModal.tsx'
import { ConfirmModal } from '../../components/ui/ConfirmModal.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Badge } from '../../components/ui/badge.tsx'
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
    <section className="animate-[page-in_0.25s_ease_both] max-w-[1100px]">
      <div className="flex items-end justify-between mb-[27px] max-[650px]:flex-col max-[650px]:items-start max-[650px]:gap-[17px]">
        <div>
          <h1>Detalles del pedido {order.id}</h1>
          <p className='mt-0.5 ml-0.5'>
            {order.client} — {order.date}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="secondary"
            onClick={onBack}
            type="button"
            icon={<ArrowLeft size={16} aria-hidden="true" />}
          >
            Volver a pedidos
          </Button>
          {canEdit && (
            <Button
              variant="secondary"
              onClick={() => onEdit(order)}
              type="button"
              icon={<Pencil size={16} aria-hidden="true" />}
            >
              Editar pedido
            </Button>
          )}
          {canEdit && (
            <Button
              variant="danger"
              onClick={() => {
                onCancel(order)
                onBack()
              }}
              type="button"
              icon={<X size={16} aria-hidden="true" />}
            >
              Cancelar pedido
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-6 items-start max-[860px]:grid-cols-1">
        <div className="grid gap-5">
          <div className="p-5 border border-border rounded-xl bg-sidebar">
            <h3 className="m-0 mb-4 text-foreground text-sm tracking-[-0.3px]">
              Resumen
            </h3>
            <dl className="grid grid-cols-2 gap-3.5 m-0">
              <div className="p-3 rounded-[9px] bg-[#faf7f9]">
                <dt className="text-muted-foreground text-[10px] font-bold">
                  Pedido
                </dt>
                <dd className="mt-[5px] text-foreground text-[13px] font-bold font-mono tracking-[0.5px]">
                  {order.id}
                </dd>
              </div>
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
                  Total
                </dt>
                <dd className="mt-[5px] text-foreground text-[13px] font-bold !text-primary !text-lg">
                  {formatMoney(total, currency)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="p-5 border border-border rounded-xl bg-sidebar">
            <h3 className="m-0 mb-4 text-foreground text-sm tracking-[-0.3px]">
              Productos
            </h3>
            {lineItems.length ? (
              <div>
                <div
                  className="grid grid-cols-[1fr_60px_100px_100px] gap-2 py-2 border-b border-border text-muted-foreground text-[10px] font-bold"
                  aria-hidden="true"
                >
                  <span>Producto</span>
                  <span>Cant.</span>
                  <span>Precio</span>
                  <span>Total</span>
                </div>
                <ul className="list-none m-0 p-0">
                  {lineItems.map((line, index) => (
                    <li
                      key={`${line.name}-${index}`}
                      className="grid grid-cols-[1fr_60px_100px_100px] gap-2 items-start py-2.5 border-b border-border text-[13px] text-foreground last:border-b-0"
                    >
                      <div className="grid gap-[2px]">
                        <strong className="text-[13px]">{line.name}</strong>
                        {line.variantLabel && (
                          <span className="text-muted-foreground text-[11px]">
                            {line.variantLabel}
                          </span>
                        )}
                        <span>
                          {formatMoney(line.unitPrice, currency)} por unidad
                        </span>
                      </div>
                      <span className="font-bold">{line.quantity}</span>
                      <span>{formatMoney(line.unitPrice, currency)}</span>
                      <strong>{formatMoney(line.total, currency)}</strong>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-center mt-3 pt-3 border-t-2 border-primary text-sm font-bold">
                  <span>Total</span>
                  <strong className="text-primary text-[18px]">
                    {formatMoney(total, currency)}
                  </strong>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                No hay productos detallados para este pedido.
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-5 sticky top-6 max-[860px]:static">
          <div className="p-5 border border-border rounded-xl bg-sidebar">
            <h3 className="m-0 mb-4 text-foreground text-sm tracking-[-0.3px]">
              Estado
            </h3>
            {order.status === 'Cancelado' ? (
              <div className="flex items-center gap-2 py-2.5 px-3 rounded-[8px] bg-[#faf7f9] text-muted-foreground text-xs font-bold">
                <Badge variant="danger">Cancelado</Badge>
                Pedido cancelado
              </div>
            ) : (
              <div className="grid gap-3.5">
                <fieldset className="min-w-0 m-0 p-0 border-0">
                  <legend className="block mb-1.5 text-muted-foreground text-[11px] font-bold">
                    Entrega
                  </legend>
                  <div
                    className="flex p-[3px] border border-[#ded8dd] rounded-[9px] bg-[#faf7f9]"
                    role="radiogroup"
                    aria-label="Estado de entrega"
                  >
                    <button
                      className={`flex-1 min-h-[36px] py-[7px] px-[9px] border-0 rounded-[7px] bg-transparent text-[11px] font-bold ${order.status === 'Pendiente' ? 'text-[#6d3c72] bg-white shadow-[0_1px_4px_#30272e14]' : 'text-muted-foreground hover:text-[#6d3c72] hover:bg-[#f3eaf4]'}`}
                      onClick={() => onStatusChange(order, 'pending')}
                      type="button"
                      role="radio"
                      aria-checked={order.status === 'Pendiente'}
                    >
                      Pendiente
                    </button>
                    <button
                      className={`flex-1 min-h-[36px] py-[7px] px-[9px] border-0 rounded-[7px] bg-transparent text-[11px] font-bold ${order.status === 'Entregado' ? 'text-[#6d3c72] bg-white shadow-[0_1px_4px_#30272e14]' : 'text-muted-foreground hover:text-[#6d3c72] hover:bg-[#f3eaf4]'}`}
                      onClick={() => onStatusChange(order, 'delivered')}
                      type="button"
                      role="radio"
                      aria-checked={order.status === 'Entregado'}
                    >
                      Entregado
                    </button>
                  </div>
                </fieldset>
                <fieldset className="min-w-0 m-0 p-0 border-0">
                  <legend className="block mb-1.5 text-muted-foreground text-[11px] font-bold">
                    Pago
                  </legend>
                  {order.payment === 'Pagado' ? (
                    <div className="flex items-center">
                      <Badge variant="success">Pagado</Badge>
                    </div>
                  ) : order.payment === 'Parcial' ? (
                    <div className="flex items-center">
                      <Badge variant="info">Parcial</Badge>
                    </div>
                  ) : (
                    <div
                      className="flex p-[3px] border border-[#ded8dd] rounded-[9px] bg-[#faf7f9]"
                      role="radiogroup"
                      aria-label="Estado de pago"
                    >
                      <button
                        className={`flex-1 min-h-[36px] py-[7px] px-[9px] border-0 rounded-[7px] bg-transparent text-[11px] font-bold ${order.payment === 'Pendiente' ? 'text-[#6d3c72] bg-white shadow-[0_1px_4px_#30272e14]' : 'text-muted-foreground hover:text-[#6d3c72] hover:bg-[#f3eaf4]'}`}
                        onClick={() => onPaymentChange(order, 'pending')}
                        type="button"
                        role="radio"
                        aria-checked={order.payment === 'Pendiente'}
                      >
                        Pendiente
                      </button>
                      <button
                        className="flex-1 min-h-[36px] py-[7px] px-[9px] border-0 rounded-[7px] bg-transparent text-[11px] font-bold text-muted-foreground hover:text-[#6d3c72] hover:bg-[#f3eaf4]"
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

          <div className="p-5 border border-border rounded-xl bg-sidebar">
            <h3 className="m-0 mb-4 text-foreground text-sm tracking-[-0.3px]">
              Pago
            </h3>
            <PaymentProgress
              total={total}
              paidAmount={paidAmount}
              currency={currency}
            />
            {hasRemainingBalance && (
              <PaymentButton onClick={() => setShowPaymentModal(true)} />
            )}
          </div>

          {orderPayments.length > 0 && (
            <div className="p-5 border border-border rounded-xl bg-sidebar">
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
