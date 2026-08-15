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
      className="mt-4 mb-4 p-3.5 rounded-[10px] bg-[#faf7f9]"
      role="group"
      aria-label="Progreso de pago"
    >
      <div className="flex items-center justify-between mb-[10px]">
        <span className="text-muted-foreground text-[11px] font-bold">
          {isFullyPaid ? 'Pagado total' : 'Abonado'}
        </span>
        <span className="flex items-baseline gap-1 text-[13px] text-foreground">
          <strong className="text-primary text-[15px]">
            {formatMoney(paidAmount, currency)}
          </strong>
          <span className="text-muted-foreground text-[11px]">de</span>
          <span>{formatMoney(total, currency)}</span>
        </span>
      </div>
      <div
        className="h-2 rounded bg-[#e8e4e5] overflow-hidden"
        role="progressbar"
        aria-valuenow={paidAmount}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${percentage.toFixed(0)}% pagado`}
      >
        <div
          className={`h-full rounded transition-[width] duration-300 ${isFullyPaid ? 'bg-[#579078]' : 'bg-primary'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {!isFullyPaid && (
        <div className="mt-2">
          <span className="text-muted-foreground text-xs">
            Falta:{' '}
            <strong className="text-foreground">
              {formatMoney(remaining, currency)}
            </strong>
          </span>
        </div>
      )}
    </div>
  )
}
