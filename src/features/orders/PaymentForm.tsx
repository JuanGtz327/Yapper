import { useState, type FormEvent } from 'react'
import { Banknote, Loader2 } from 'lucide-react'
import { formatMoney } from '../../lib/format.ts'
import { calculateRemainingAmount } from '../../lib/payment.ts'

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
      setError(`El monto excede el saldo restante (${formatMoney(remaining, currency)})`)
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
    <form className="payment-form" onSubmit={handleSubmit} noValidate>
      <label className="payment-form-field">
        <span>Monto</span>
        <div className="payment-form-amount-input">
          <input
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
        {error && <span className="payment-form-error">{error}</span>}
      </label>

      <div className="payment-form-quick-amounts">
        {[100, 200, 500].filter((v) => v <= remaining).map((value) => (
          <button
            key={value}
            type="button"
            className="payment-form-quick-btn"
            onClick={() => handleQuickAmount(value)}
            disabled={isSubmitting}
          >
            {formatMoney(value, currency)}
          </button>
        ))}
        {remaining > 0 && (
          <button
            type="button"
            className="payment-form-quick-btn"
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

      <label className="payment-form-field">
        <span>Método de pago</span>
        <div className="payment-form-method-group" role="radiogroup" aria-label="Método de pago">
          {PAYMENT_METHODS.map((method) => (
            <button
              key={method.value}
              type="button"
              role="radio"
              aria-checked={paymentMethod === method.value}
              className={`payment-form-method${paymentMethod === method.value ? ' is-active' : ''}`}
              onClick={() => setPaymentMethod(method.value)}
              disabled={isSubmitting}
            >
              {method.label}
            </button>
          ))}
        </div>
      </label>

      <label className="payment-form-field">
        <span>Referencia (opcional)</span>
        <input
          type="text"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="Número de transferencia, folio, etc."
          disabled={isSubmitting}
        />
      </label>

      <label className="payment-form-field">
        <span>Notas (opcional)</span>
        <input
          type="text"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Observaciones del abono"
          disabled={isSubmitting}
        />
      </label>

      <button
        type="submit"
        className="primary-button payment-form-submit"
        disabled={isSubmitting || !isValid}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={16} className="spin" aria-hidden="true" />
            Registrando...
          </>
        ) : (
          <>
            <Banknote size={16} aria-hidden="true" />
            Registrar abono de {parsedAmount > 0 ? formatMoney(parsedAmount, currency) : ''}
          </>
        )}
      </button>
    </form>
  )
}
