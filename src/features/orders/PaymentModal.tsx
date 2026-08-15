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
      <div className="grid gap-4">
        <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72]">
          RESUMEN DEL PEDIDO
        </span>
        <div className="grid gap-2 p-3.5 rounded-[10px] bg-[#faf7f9]">
          <div className="flex items-center justify-between text-[13px] text-foreground">
            <span className="text-muted-foreground text-xs">
              Total del pedido
            </span>
            <strong className="text-sm">{formatMoney(total, currency)}</strong>
          </div>
          <div className="flex items-center justify-between text-[13px] text-foreground">
            <span className="text-muted-foreground text-xs">Ya abonado</span>
            <strong className="text-primary text-[15px]">
              {formatMoney(paidAmount, currency)}
            </strong>
          </div>
          <div className="flex items-center justify-between text-[13px] text-foreground pt-2 mt-1 border-t border-border">
            <span className="text-muted-foreground text-xs">
              Saldo restante
            </span>
            <strong className="text-primary text-[15px]">
              {formatMoney(remaining, currency)}
            </strong>
          </div>
        </div>
      </div>
      <div className="h-px bg-[#e8e4e6] my-4" />
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
      className="w-full justify-center"
      onClick={onClick}
      type="button"
      icon={<Banknote size={16} aria-hidden="true" />}
    >
      Registrar abono
    </Button>
  )
}
