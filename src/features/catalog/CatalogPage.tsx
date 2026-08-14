import { Boxes, Copy, ExternalLink } from 'lucide-react'
import { formatMoney } from '../../lib/format.ts'
import { safeImageUrl } from '../../lib/security.ts'
import type { BusinessSettings, Product } from '../../types.ts'

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
    <section className="page-section">
      <div className="section-intro">
        <div>
          <span className="eyebrow">MODO PARA MOSTRAR</span>
          <h2>Tu tienda visual</h2>
          <p>
            Enséñale tus productos publicados a tus clientes sin mostrar
            información interna.
          </p>
        </div>
      </div>
      {url && (
        <div className="share-bar">
          <span>Catálogo público listo</span>
          <button
            className="secondary-button"
            onClick={() => void navigator.clipboard?.writeText(url)}
            type="button"
          >
            <Copy size={16} />
            Copiar enlace
          </button>
          <a
            className="secondary-button"
            href={url}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={16} />
            Abrir tienda
          </a>
        </div>
      )}
      <div className="catalog-grid">
        {products.filter((product) => product.published).length === 0 ? (
          <div className="empty-state">
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
                <article className="catalog-card" key={product.id}>
                  {imageUrl ? (
                    <img
                      className="catalog-image catalog-photo"
                      src={imageUrl}
                      alt={`${product.name} — ${product.category}`}
                    />
                  ) : (
                    <div className={`catalog-image ${product.color}`}>
                      <Boxes size={58} strokeWidth={1.2} aria-hidden="true" />
                    </div>
                  )}
                  <div>
                    <span>{product.category}</span>
                    <h3>{product.name}</h3>
                    <p className="catalog-description">
                      {product.publicDescription}
                    </p>
                    <strong>{formatMoney(price, currency)}</strong>
                  </div>
                </article>
              )
            })
        )}
      </div>
    </section>
  )
}
