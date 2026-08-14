import { Banknote } from 'lucide-react'
import type { Order } from '../../types.ts'
import { formatMoney } from '../../lib/format.ts'
import { calculateRemainingAmount } from '../../lib/payment.ts'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { PaymentForm } from './PaymentForm.tsx'

export function PaymentModal({
  order,
  currency,
  isSubmitting,
  onClose,
  onSubmit,
}: {
  order: Order
  currency: string
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (data: {
    amount: number
    paymentMethod: 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Otro'
    reference?: string
    notes?: string
  }) => void
}) {
  const total = order.total
  const paidAmount = order.paidAmount ?? 0
  const remaining = calculateRemainingAmount(total, paidAmount)

  return (
    <ModalFrame title={`Abono — ${order.id}`} onClose={onClose}>
      <div className="payment-modal-summary">
        <div className="payment-modal-row">
          <span>Total del pedido</span>
          <strong>{formatMoney(total, currency)}</strong>
        </div>
        <div className="payment-modal-row">
          <span>Ya abonado</span>
          <strong className="text-plum">
            {formatMoney(paidAmount, currency)}
          </strong>
        </div>
        <div className="payment-modal-row payment-modal-remaining">
          <span>Saldo restante</span>
          <strong>{formatMoney(remaining, currency)}</strong>
        </div>
      </div>
      <PaymentForm
        total={total}
        paidAmount={paidAmount}
        currency={currency}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
      />
    </ModalFrame>
  )
}

export function PaymentButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="secondary"
      className="payment-trigger-btn"
      onClick={onClick}
      type="button"
      icon={<Banknote size={16} aria-hidden="true" />}
    >
      Registrar abono
    </Button>
  )
}
