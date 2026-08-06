export function isSafeImageUrl(
  value: string | null | undefined,
): value is string {
  if (!value) return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

export function safeImageUrl(value: string | null | undefined): string | null {
  return isSafeImageUrl(value) ? value : null
}
