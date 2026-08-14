import { Boxes, Copy, MessageCircle } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { formatMoney } from '../../lib/format.ts'
import { safeImageUrl } from '../../lib/security.ts'
import { normalizeMexicanWhatsApp } from '../../lib/whatsapp.ts'
import { usePublicCatalog } from '../../hooks/queries/usePublicCatalog.ts'

export function PublicCatalogPage({ slug }: { slug: string }) {
  const { data: catalog, isLoading, error } = usePublicCatalog(slug)
  if (isLoading)
    return (
      <main className="min-h-screen py-7 px-[clamp(18px,6vw,90px)] pb-[70px] bg-[#f8f7f5] max-[520px]:px-4 max-[520px]:pb-[45px]">
        <div className="grid place-items-center min-h-[70vh] gap-3 text-center text-muted">
          <Spinner label="Cargando catálogo" /> Cargando catálogo...
        </div>
      </main>
    )
  if (error || !catalog)
    return (
      <main className="min-h-screen py-7 px-[clamp(18px,6vw,90px)] pb-[70px] bg-[#f8f7f5] max-[520px]:px-4 max-[520px]:pb-[45px]">
        <div className="grid place-items-center min-h-[70vh] gap-3 text-center text-muted">
          <div className="brand-mark">Y</div>
          <h1 className="text-[28px]">Esta tienda no está disponible</h1>
          <p className="text-[14px]">El enlace puede estar desactivado o ya no existir.</p>
        </div>
      </main>
    )
  return (
    <main className="min-h-screen py-7 px-[clamp(18px,6vw,90px)] pb-[70px] bg-[#f8f7f5] max-[520px]:px-4 max-[520px]:pb-[45px]">
      <header className="flex items-center justify-between max-w-[1120px] mx-auto">
        <div className="brand p-0">
          <div className="brand-mark">Y</div>
          <div>
            <strong>{catalog.businessName}</strong>
            <span>Catálogo público</span>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() =>
            void navigator.clipboard?.writeText(window.location.href)
          }
          type="button"
        >
          <Copy size={16} />
          Compartir
        </Button>
      </header>
      <section className="max-w-[1120px] mx-auto mt-[75px] mb-10 max-[520px]:mt-[55px] max-[520px]:mb-[30px]">
        <span className="eyebrow">COMPRA DIRECTA</span>
        <h1 className="mt-[7px] mb-[10px] text-[clamp(34px,7vw,62px)]">{catalog.businessName}</h1>
        <p className="max-w-[560px] text-muted text-[16px] leading-[1.6]">{catalog.publicIntro || 'Conoce nuestros productos disponibles.'}</p>
      </section>
      <section className="grid grid-cols-3 gap-[18px] max-w-[1120px] mx-auto max-[750px]:grid-cols-2 max-[520px]:grid-cols-1" aria-label="Productos publicados">
        {catalog.products.length === 0 ? (
          <div className="empty-state">
            Aún no hay productos publicados. Vuelve pronto para conocer nuestros
            productos.
          </div>
        ) : (
          catalog.products.map((product) => {
            const imageUrl = safeImageUrl(product.imageUrl)
            return (
              <article className="overflow-hidden border border-[#ebe8e4] rounded-[16px] bg-[#fffefa] shadow-[0_12px_30px_#30272e0a]" key={product.id}>
                {imageUrl ? (
                  <img
                    className="w-full h-[210px] object-cover max-[520px]:h-[190px]"
                    src={imageUrl}
                    alt={`${product.name} — ${product.category}`}
                  />
                ) : (
                  <div className={`catalog-image w-full h-[210px] object-cover max-[520px]:h-[190px] ${product.color}`}>
                    <Boxes size={52} aria-hidden="true" />
                  </div>
                )}
                <div className="p-[18px]">
                  <span className="text-[#aaa5a8] text-[10px]">{product.category}</span>
                  <h2 className="my-[7px] text-[18px]">{product.name}</h2>
                  <p className="min-h-[35px] text-muted text-[12px] leading-[1.5]">{product.publicDescription}</p>
                  <strong className="block mt-[13px] mb-[15px] text-[#6d3c72] text-[20px]">
                    {formatMoney(product.price, catalog.currency)}
                  </strong>
                  {normalizeMexicanWhatsApp(catalog.whatsappNumber) && (
                    <a
                      className="inline-flex items-center justify-center gap-[7px] w-full py-[11px] px-3 rounded-[9px] text-white bg-[#258c67] text-[12px] font-bold no-underline hover:bg-[#1e7657]"
                      href={`https://wa.me/${normalizeMexicanWhatsApp(catalog.whatsappNumber)}?text=${encodeURIComponent(`Hola, ${catalog.businessName}. Me interesa ${product.name}. Vi su catálogo público.`)}`}
                    >
                      <MessageCircle size={17} />
                      Preguntar por WhatsApp
                    </a>
                  )}
                </div>
              </article>
            )
          })
        )}
      </section>
    </main>
  )
}
