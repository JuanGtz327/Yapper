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
  products: demoProducts
    .filter((product) => product.published)
    .map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      publicDescription: product.publicDescription,
      imageUrl: product.imageUrl,
      color: product.color,
      price: product.variants[0]?.salePrice ?? 0,
      variants: product.variants.map((v) => ({
        name: v.name,
        optionValues: v.optionValues,
        salePrice: v.salePrice,
        stock: v.stock,
      })),
    })),
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
