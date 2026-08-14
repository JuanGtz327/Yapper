import { formatMoney } from '../../lib/format.ts'

export function PaymentProgress({
  total,
  paidAmount,
  currency,
}: {
  total: number
  paidAmount: number
  currency: string
}) {
  const remaining = Math.max(0, total - paidAmount)
  const percentage = total > 0 ? Math.min(100, (paidAmount / total) * 100) : 0
  const isFullyPaid = paidAmount >= total

  return (
    <div
      className="payment-progress"
      role="group"
      aria-label="Progreso de pago"
    >
      <div className="payment-progress-header">
        <span className="payment-progress-label">
          {isFullyPaid ? 'Pagado total' : 'Abonado'}
        </span>
        <span className="payment-progress-amounts">
          <strong>{formatMoney(paidAmount, currency)}</strong>
          <span className="payment-progress-separator">de</span>
          <span>{formatMoney(total, currency)}</span>
        </span>
      </div>
      <div
        className="payment-progress-bar"
        role="progressbar"
        aria-valuenow={paidAmount}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${percentage.toFixed(0)}% pagado`}
      >
        <div
          className={`payment-progress-fill${isFullyPaid ? ' is-complete' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {!isFullyPaid && (
        <div className="payment-progress-footer">
          <span className="payment-progress-remaining">
            Falta: <strong>{formatMoney(remaining, currency)}</strong>
          </span>
        </div>
      )}
    </div>
  )
}
