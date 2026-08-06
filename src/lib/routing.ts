function decodeRouteSlug(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

export function getPublicCatalogSlug(pathname: string): string | null {
  const match = pathname.match(/^\/tienda\/([^/]+)\/?$/)
  return match ? decodeRouteSlug(match[1]) : null
}
