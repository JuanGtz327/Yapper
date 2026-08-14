import { useState, type FormEvent } from 'react'
import { Banknote, Loader2 } from 'lucide-react'
import { formatMoney } from '../../lib/format.ts'
import { calculateRemainingAmount } from '../../lib/payment.ts'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'

type PaymentMethod = 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Otro'

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Transferencia', label: 'Transferencia' },
  { value: 'Tarjeta', label: 'Tarjeta' },
  { value: 'Otro', label: 'Otro' },
]

export function PaymentForm({
  total,
  paidAmount,
  currency,
  isSubmitting,
  onSubmit,
}: {
  total: number
  paidAmount: number
  currency: string
  isSubmitting: boolean
  onSubmit: (data: {
    amount: number
    paymentMethod: PaymentMethod
    reference?: string
    notes?: string
  }) => void
}) {
  const remaining = calculateRemainingAmount(total, paidAmount)
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Efectivo')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const parsedAmount = parseFloat(amount) || 0
  const isValid = parsedAmount > 0 && parsedAmount <= remaining

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (parsedAmount <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }
    if (parsedAmount > remaining) {
      setError(
        `El monto excede el saldo restante (${formatMoney(remaining, currency)})`,
      )
      return
    }

    onSubmit({
      amount: parsedAmount,
      paymentMethod,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    })

    setAmount('')
    setReference('')
    setNotes('')
  }

  function handleQuickAmount(value: number) {
    setAmount(String(Math.min(value, remaining)))
    setError('')
  }

  return (
    <form className="grid gap-3.5" onSubmit={handleSubmit} noValidate>
      <label className="grid gap-[6px]">
        <span className="text-muted-foreground text-[11px] font-bold">Monto</span>
        <div>
          <Input
            type="number"
            min="0.01"
            max={remaining}
            step="0.01"
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value)
              setError('')
            }}
            placeholder="0.00"
            disabled={isSubmitting}
            required
          />
        </div>
        {error && <span className="text-[#b94b4b] text-[11px] font-semibold">{error}</span>}
      </label>

      <div className="flex gap-2">
        {[100, 200, 500]
          .filter((v) => v <= remaining)
          .map((value) => (
            <button
              key={value}
              type="button"
              className="flex-1 py-2 border border-[#ded8dd] rounded-[7px] bg-sidebar text-foreground text-xs font-bold cursor-pointer transition-colors hover:border-primary hover:text-primary hover:bg-[#f8f2f8]"
              onClick={() => handleQuickAmount(value)}
              disabled={isSubmitting}
            >
              {formatMoney(value, currency)}
            </button>
          ))}
        {remaining > 0 && (
          <button
            type="button"
            className="flex-1 py-2 border border-[#ded8dd] rounded-[7px] bg-sidebar text-foreground text-xs font-bold cursor-pointer transition-colors hover:border-primary hover:text-primary hover:bg-[#f8f2f8]"
            onClick={() => {
              setAmount(String(remaining))
              setError('')
            }}
            disabled={isSubmitting}
          >
            Total
          </button>
        )}
      </div>

      <label className="grid gap-[6px]">
        <span className="text-muted-foreground text-[11px] font-bold">Método de pago</span>
        <div
          className="flex gap-[6px]"
          role="radiogroup"
          aria-label="Método de pago"
        >
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.value}
              type="button"
              role="radio"
              aria-checked={paymentMethod === method.value}
              className={`flex-1 py-2 px-1 border border-[#ded8dd] rounded-[7px] bg-sidebar text-muted-foreground text-[11px] font-bold cursor-pointer transition-colors hover:text-primary hover:bg-[#f8f2f8]${paymentMethod === method.value ? ' border-primary bg-[#f3eaf4] text-primary' : ''}`}
              onClick={() => setPaymentMethod(method.value)}
              disabled={isSubmitting}
            >
              {method.label}
            </button>
          ))}
        </div>
      </label>

      <label className="grid gap-[6px]">
        <span className="text-muted-foreground text-[11px] font-bold">Referencia (opcional)</span>
        <Input
          type="text"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="Número de transferencia, folio, etc."
          disabled={isSubmitting}
        />
      </label>

      <label className="grid gap-[6px]">
        <span className="text-muted-foreground text-[11px] font-bold">Notas (opcional)</span>
        <Input
          type="text"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Observaciones del abono"
          disabled={isSubmitting}
        />
      </label>

      <Button
        variant="primary"
        type="submit"
        className="w-full justify-center mt-1"
        disabled={isSubmitting || !isValid}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Registrando...
          </>
        ) : (
          <>
            <Banknote size={16} aria-hidden="true" />
            Registrar abono de{' '}
            {parsedAmount > 0 ? formatMoney(parsedAmount, currency) : ''}
          </>
        )}
      </Button>
    </form>
  )
}
