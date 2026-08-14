import { Banknote, FileText } from 'lucide-react'
import { formatMoney } from '../../lib/format.ts'
import type { OrderPayment } from '../../types.ts'

const METHOD_ICONS: Record<string, string> = {
  Efectivo: '$',
  Transferencia: 'TR',
  Tarjeta: 'TC',
  Otro: 'OT',
}

export function PaymentHistory({
  payments,
  currency,
}: {
  payments: OrderPayment[]
  currency: string
}) {
  if (!payments.length) {
    return (
      <div className="flex items-center gap-2 p-4 text-muted-foreground text-xs text-center justify-center">
        <Banknote size={18} aria-hidden="true" />
        <p>No hay abonos registrados</p>
      </div>
    )
  }

  return (
    <div
      className="mt-4"
      role="list"
      aria-label="Historial de abonos"
    >
      <div className="flex items-center gap-[6px] text-muted-foreground mb-[10px]">
        <FileText size={14} aria-hidden="true" />
        <h4 className="m-0 text-xs">Abonos ({payments.length})</h4>
      </div>
      <ul className="list-none m-0 p-0 grid gap-2">
        {payments.map((payment) => (
          <li key={payment.id} className="flex items-start gap-[10px] py-[10px] px-3 rounded-[8px] bg-[#faf7f9]">
            <div className="grid place-items-center w-7 h-7 rounded-[6px] bg-[#f3eaf4] text-primary text-[10px] font-extrabold shrink-0">
              {METHOD_ICONS[payment.paymentMethod] ?? 'OT'}
            </div>
            <div className="grid gap-[2px] min-w-0">
              <div className="flex items-baseline gap-2">
                <strong className="text-foreground text-[13px]">{formatMoney(payment.amount, currency)}</strong>
                <span className="text-muted-foreground text-[11px]">
                  {payment.paymentMethod}
                </span>
              </div>
              {payment.reference && (
                <span className="text-muted-foreground text-[11px] truncate">
                  Ref: {payment.reference}
                </span>
              )}
              {payment.notes && (
                <span className="text-muted-foreground text-[11px] truncate">{payment.notes}</span>
              )}
              <time className="text-[#b8b3b9] text-[10px]">
                {new Intl.DateTimeFormat('es-MX', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(payment.createdAt))}
              </time>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
