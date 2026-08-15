import { Boxes, Copy, ExternalLink } from 'lucide-react'
import { formatMoney } from '../../lib/format.ts'
import { safeImageUrl } from '../../lib/security.ts'
import { Button } from '../../components/ui/Button.tsx'
import type { BusinessSettings, Product } from '../../types.ts'

const catalogColors: Record<string, string> = {
  coral: 'text-[#b06b57] bg-[#f9e5dc]',
  mint: 'text-[#579078] bg-[#dff1e6]',
  sky: 'text-[#52829e] bg-[#e0eff5]',
  lavender: 'text-[#7963a2] bg-[#ece5f7]',
}

function minVariantPrice(product: Product): number {
  if (!product.variants.length) return 0
  return Math.min(...product.variants.map((v) => v.salePrice))
}

export function CatalogPage({
  products,
  currency,
  settings,
}: {
  products: Product[]
  currency: string
  settings: BusinessSettings
}) {
  const url =
    settings.publicCatalogEnabled && settings.publicSlug
      ? `${window.location.origin}/tienda/${settings.publicSlug}`
      : ''
  return (
    <section className="animate-[page-in_0.25s_ease_both]">
      <div className="flex items-end justify-between mb-[27px] max-[650px]:flex-col max-[650px]:items-start max-[650px]:gap-[17px]">
        <div>
          <h1>Tu tienda visual</h1>
          <p className='mt-0.5 ml-0.5'>
            Enséñale tus productos publicados a tus clientes sin mostrar
            información interna.
          </p>
        </div>
      </div>
      {url && (
        <div className="flex items-center gap-[9px] -mt-[10px] mb-[22px]">
          <span className="mr-auto text-[#579078] text-[12px] font-bold">
            Catálogo público listo
          </span>
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
      <div className="grid grid-cols-3 gap-4 max-[650px]:grid-cols-1">
        {products.filter((product) => product.published).length === 0 ? (
          <div className="p-[45px] border border-dashed border-[#d9d1d8] rounded-[13px] text-[#817d86] text-center text-[13px] bg-[#fffefa]">
            No hay productos publicados aún. Publica productos desde el almacén
            para que aparezcan aquí.
          </div>
        ) : (
          products
            .filter((product) => product.published)
            .map((product) => {
              const imageUrl = safeImageUrl(product.imageUrl)
              const price = minVariantPrice(product)
              return (
                <article
                  className="overflow-hidden border border-[#ebe8e4] rounded-[14px] bg-[#fffefa]"
                  key={product.id}
                >
                  {imageUrl ? (
                    <img
                      className="grid place-items-center h-[190px] catalog-photo w-full object-cover"
                      src={imageUrl}
                      alt={`${product.name} — ${product.category}`}
                    />
                  ) : (
                    <div
                      className={`grid place-items-center h-[190px] ${catalogColors[product.color] ?? ''}`}
                    >
                      <Boxes size={58} strokeWidth={1.2} aria-hidden="true" />
                    </div>
                  )}
                  <div className="p-4 px-[17px] pb-[18px]">
                    <span className="text-[#aaa5a8] text-[10px]">
                      {product.category}
                    </span>
                    <h3 className="mt-[6px] mb-3 text-ink text-[14px]">
                      {product.name}
                    </h3>
                    <p className="min-h-[32px] -mt-[5px] mb-3 text-muted text-[11px] leading-[1.45]">
                      {product.publicDescription}
                    </p>
                    <strong className="text-[#6d3c72] text-[17px]">
                      {formatMoney(price, currency)}
                    </strong>
                  </div>
                </article>
              )
            })
        )}
      </div>
    </section>
  )
}
