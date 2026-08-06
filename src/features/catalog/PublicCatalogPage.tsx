import { Boxes, Copy, MessageCircle } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner.tsx'
import { formatMoney } from '../../lib/format.ts'
import { safeImageUrl } from '../../lib/security.ts'
import { normalizeMexicanWhatsApp } from '../../lib/whatsapp.ts'
import { usePublicCatalog } from '../../hooks/queries/usePublicCatalog.ts'

export function PublicCatalogPage({ slug }: { slug: string }) {
  const { data: catalog, isLoading, error } = usePublicCatalog(slug)
  if (isLoading)
    return (
      <main className="public-page">
        <div className="public-status">
          <Spinner label="Cargando catálogo" /> Cargando catálogo...
        </div>
      </main>
    )
  if (error || !catalog)
    return (
      <main className="public-page">
        <div className="public-status">
          <div className="brand-mark">Y</div>
          <h1>Esta tienda no está disponible</h1>
          <p>El enlace puede estar desactivado o ya no existir.</p>
        </div>
      </main>
    )
  return (
    <main className="public-page">
      <header className="public-header">
        <div className="brand">
          <div className="brand-mark">Y</div>
          <div>
            <strong>{catalog.businessName}</strong>
            <span>Catálogo público</span>
          </div>
        </div>
        <button
          className="secondary-button"
          onClick={() =>
            void navigator.clipboard?.writeText(window.location.href)
          }
          type="button"
        >
          <Copy size={16} />
          Compartir
        </button>
      </header>
      <section className="public-hero">
        <span className="eyebrow">COMPRA DIRECTA</span>
        <h1>{catalog.businessName}</h1>
        <p>{catalog.publicIntro || 'Conoce nuestros productos disponibles.'}</p>
      </section>
      <section className="public-products" aria-label="Productos publicados">
        {catalog.products.map((product) => {
          const imageUrl = safeImageUrl(product.imageUrl)
          return (
            <article className="public-product" key={product.id}>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={`${product.name} — ${product.category}`}
                />
              ) : (
                <div className={`catalog-image ${product.color}`}>
                  <Boxes size={52} aria-hidden="true" />
                </div>
              )}
              <div className="public-product-body">
                <span>{product.category}</span>
                <h2>{product.name}</h2>
                <p>{product.publicDescription}</p>
                <strong>{formatMoney(product.price, catalog.currency)}</strong>
                {normalizeMexicanWhatsApp(catalog.whatsappNumber) && (
                  <a
                    className="whatsapp-button"
                    href={`https://wa.me/${normalizeMexicanWhatsApp(catalog.whatsappNumber)}?text=${encodeURIComponent(`Hola, ${catalog.businessName}. Me interesa ${product.name}. Vi su catálogo público.`)}`}
                  >
                    <MessageCircle size={17} />
                    Preguntar por WhatsApp
                  </a>
                )}
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}
