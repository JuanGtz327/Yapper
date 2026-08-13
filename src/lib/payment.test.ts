import { describe, it, expect } from 'vitest'
import {
  calculatePaymentStatus,
  calculateRemainingAmount,
  validatePaymentAmount,
} from './payment.ts'

describe('Lógica de pagos parciales', () => {
  describe('calculatePaymentStatus', () => {
    it('debería retornar "pending" cuando paidAmount es 0', () => {
      expect(calculatePaymentStatus(100, 0)).toBe('pending')
    })

    it('debería retornar "paid" cuando paidAmount es igual al total', () => {
      expect(calculatePaymentStatus(100, 100)).toBe('paid')
    })

    it('debería retornar "paid" cuando paidAmount excede el total', () => {
      expect(calculatePaymentStatus(100, 120)).toBe('paid')
    })

    it('debería retornar "partial" cuando paidAmount es menor al total y mayor a 0', () => {
      expect(calculatePaymentStatus(100, 50)).toBe('partial')
    })

    it('debería retornar "partial" con un abono pequeño', () => {
      expect(calculatePaymentStatus(1000, 100)).toBe('partial')
    })
  })

  describe('calculateRemainingAmount', () => {
    it('debería retornar el total completo cuando no hay abonos', () => {
      expect(calculateRemainingAmount(100, 0)).toBe(100)
    })

    it('debería retornar 0 cuando está completamente pagado', () => {
      expect(calculateRemainingAmount(100, 100)).toBe(0)
    })

    it('debería retornar 0 cuando se pagó de más', () => {
      expect(calculateRemainingAmount(100, 120)).toBe(0)
    })

    it('debería calcular el saldo restante correctamente', () => {
      expect(calculateRemainingAmount(500, 200)).toBe(300)
    })

    it('debería manejar montos decimales', () => {
      expect(calculateRemainingAmount(100.50, 30.25)).toBeCloseTo(70.25)
    })
  })

  describe('validatePaymentAmount', () => {
    it('debería aceptar un monto válido dentro del saldo', () => {
      const result = validatePaymentAmount(100, 50, 50)
      expect(result.valid).toBe(true)
    })

    it('debería aceptar un monto exacto al saldo restante', () => {
      const result = validatePaymentAmount(100, 70, 30)
      expect(result.valid).toBe(true)
    })

    it('debería aceptar un pago total cuando no hay abonos previos', () => {
      const result = validatePaymentAmount(100, 0, 100)
      expect(result.valid).toBe(true)
    })

    it('debería rechazar monto negativo', () => {
      const result = validatePaymentAmount(100, 50, -10)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('El monto debe ser mayor a 0')
      }
    })

    it('debería rechazar monto que excede el saldo restante', () => {
      const result = validatePaymentAmount(100, 80, 30)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('El monto excede el saldo restante ($20.00)')
      }
    })

    it('debería mostrar el saldo correcto en el mensaje de error', () => {
      const result = validatePaymentAmount(500, 400, 150)
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBe('El monto excede el saldo restante ($100.00)')
      }
    })
  })
})
