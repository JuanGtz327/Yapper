export type PaymentStatus = 'pending' | 'partial' | 'paid'

export function calculatePaymentStatus(
  total: number,
  paidAmount: number,
): PaymentStatus {
  if (paidAmount <= 0) return 'pending'
  if (paidAmount >= total) return 'paid'
  return 'partial'
}

export function calculateRemainingAmount(
  total: number,
  paidAmount: number,
): number {
  const remaining = total - paidAmount
  return remaining > 0 ? remaining : 0
}

export function validatePaymentAmount(
  total: number,
  paidAmount: number,
  paymentAmount: number,
): { valid: true } | { valid: false; error: string } {
  if (paymentAmount <= 0) {
    return { valid: false, error: 'El monto debe ser mayor a 0' }
  }

  const remaining = calculateRemainingAmount(total, paidAmount)
  if (paymentAmount > remaining) {
    return {
      valid: false,
      error: `El monto excede el saldo restante ($${remaining.toFixed(2)})`,
    }
  }

  return { valid: true }
}
