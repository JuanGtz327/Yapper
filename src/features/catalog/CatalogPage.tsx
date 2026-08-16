import { useState } from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import { Button } from '../../components/ui/Button.tsx'
import { CatalogCard } from './CatalogCard.tsx'
import type { BusinessSettings, Product } from '../../types.ts'

export function CatalogPage({
  products,
  currency,
  settings,
}: {
  products: Product[]
  currency: string
  settings: BusinessSettings
}) {
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({})

  const url =
    settings.publicCatalogEnabled && settings.publicSlug
      ? `${window.location.origin}/tienda/${settings.publicSlug}`
      : ''

  return (
    <section className="animate-[page-in_0.25s_ease_both]">
      <div className="flex items-end justify-between mb-[27px] max-[650px]:flex-col max-[650px]:items-start max-[650px]:gap-[17px]">
        <div>
          <h1>Tu tienda visual</h1>
          <p className="mt-0.5 ml-0.5">
            Enséñale tus productos publicados a tus clientes sin mostrar
            información interna.
          </p>
        </div>
        {url && (
          <div className="flex items-center gap-[9px]">
            <Button
              variant="secondary"
              onClick={() => void navigator.clipboard?.writeText(url)}
              type="button"
              icon={<Copy size={16} />}
            >
              Copiar enlace
            </Button>
            <Button
              variant="secondary"
              icon={<ExternalLink size={16} />}
              onClick={() => window.open(url, '_blank', 'noreferrer')}
            >
              Abrir tienda
            </Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-4 max-[650px]:grid-cols-1">
        {products.filter((product) => product.published).length === 0 ? (
          <div className="p-[45px] border border-dashed border-[#d9d1d8] rounded-[13px] text-[#817d86] text-center text-[13px] bg-[#fffefa]">
            No hay productos publicados aún. Publica productos desde el almacén
            para que aparezcan aquí.
          </div>
        ) : (
          products
            .filter((product) => product.published)
            .map((product) => (
              <CatalogCard
                key={product.id}
                product={product}
                currency={currency}
                selectedVariantId={selectedVariants[product.id]}
                onSelectVariant={(variantId) =>
                  setSelectedVariants((prev) => ({
                    ...prev,
                    [product.id]: variantId,
                  }))
                }
                lowStockThreshold={settings.lowStockThreshold}
              />
            ))
        )}
      </div>
    </section>
  )
}
