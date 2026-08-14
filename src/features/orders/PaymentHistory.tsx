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
      <div className="payment-history-empty">
        <Banknote size={18} aria-hidden="true" />
        <p>No hay abonos registrados</p>
      </div>
    )
  }

  return (
    <div
      className="payment-history"
      role="list"
      aria-label="Historial de abonos"
    >
      <div className="payment-history-header">
        <FileText size={14} aria-hidden="true" />
        <h4>Abonos ({payments.length})</h4>
      </div>
      <ul>
        {payments.map((payment) => (
          <li key={payment.id} className="payment-history-item">
            <div className="payment-history-icon">
              {METHOD_ICONS[payment.paymentMethod] ?? 'OT'}
            </div>
            <div className="payment-history-details">
              <div className="payment-history-main">
                <strong>{formatMoney(payment.amount, currency)}</strong>
                <span className="payment-history-method">
                  {payment.paymentMethod}
                </span>
              </div>
              {payment.reference && (
                <span className="payment-history-ref">
                  Ref: {payment.reference}
                </span>
              )}
              {payment.notes && (
                <span className="payment-history-notes">{payment.notes}</span>
              )}
              <time className="payment-history-date">
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
