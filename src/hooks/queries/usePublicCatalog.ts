import { useQuery } from '@tanstack/react-query'
import { demoProducts } from '../../data/demo.ts'
import { loadPublicCatalog } from '../../lib/repository.ts'
import { isSupabaseConfigured } from '../../lib/supabase.ts'
import { qk } from '../../lib/queryKeys.ts'
import type { PublicCatalog } from '../../types.ts'

const demoCatalog: PublicCatalog = {
  businessName: 'Mi negocio',
  currency: 'MXN',
  whatsappNumber: '525512348765',
  publicIntro: 'Productos útiles para tu día a día.',
  products: demoProducts.filter((product) => product.published),
}

function fetchPublicCatalog(slug: string): Promise<PublicCatalog | null> {
  if (!isSupabaseConfigured && slug === 'demo') {
    return Promise.resolve(demoCatalog)
  }
  return loadPublicCatalog(slug)
}

export function usePublicCatalog(slug: string) {
  return useQuery({
    queryKey: qk.publicCatalog(slug),
    queryFn: () => fetchPublicCatalog(slug),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  })
}
