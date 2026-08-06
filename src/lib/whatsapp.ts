export function normalizeMexicanWhatsApp(value: string) {
  const digits = value.replace(/\D/g, '').replace(/^00/, '')
  if (/^521\d{10}$/.test(digits)) return `52${digits.slice(3)}`
  if (/^52\d{10}$/.test(digits)) return digits
  if (/^\d{10}$/.test(digits)) return `52${digits}`
  return null
}
