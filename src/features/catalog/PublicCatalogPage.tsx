import { useState } from 'react'
import { Copy } from 'lucide-react'
import { Spinner } from '../../components/ui/Spinner.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { CatalogCard } from './CatalogCard.tsx'
import { normalizeMexicanWhatsApp } from '../../lib/whatsapp.ts'
import { usePublicCatalog } from '../../hooks/queries/usePublicCatalog.ts'

export function PublicCatalogPage({ slug }: { slug: string }) {
  const { data: catalog, isLoading, error } = usePublicCatalog(slug)
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({})

  if (isLoading)
    return (
      <main className="min-h-screen py-7 px-[clamp(18px,6vw,90px)] pb-[70px] bg-[#f8f7f5] max-[520px]:px-4 max-[520px]:pb-[45px]">
        <div className="grid place-items-center min-h-[70vh] gap-3 text-center text-muted-foreground">
          <Spinner label="Cargando catálogo" />
        </div>
      </main>
    )
  if (error || !catalog)
    return (
      <main className="min-h-screen py-7 px-[clamp(18px,6vw,90px)] pb-[70px] bg-[#f8f7f5] max-[520px]:px-4 max-[520px]:pb-[45px]">
        <div className="grid place-items-center min-h-[70vh] gap-3 text-center text-muted-foreground">
          <div className="grid place-items-center w-[38px] h-[38px] rounded-xl text-white bg-primary text-[23px] font-bold -rotate-7">
            Y
          </div>
          <h1 className="text-[28px]">Esta tienda no está disponible</h1>
          <p className="text-[14px]">
            El enlace puede estar desactivado o ya no existir.
          </p>
        </div>
      </main>
    )

  const whatsappNum = normalizeMexicanWhatsApp(catalog.whatsappNumber)

  return (
    <main className="min-h-screen py-7 px-[clamp(18px,6vw,90px)] pb-[70px] bg-[#f8f7f5] max-[520px]:px-4 max-[520px]:pb-[45px]">
      <header className="flex items-center justify-between max-w-[1120px] mx-auto">
        <div className="flex items-center gap-[11px]">
          <div className="grid place-items-center w-[38px] h-[38px] rounded-xl text-white bg-primary text-[23px] font-bold -rotate-7 shrink-0">
            Y
          </div>
          <div>
            <strong>Yapper</strong>
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
      <section className="max-w-[1120px] mx-auto mt-[25px] mb-10 max-[520px]:mt-[55px] max-[520px]:mb-[30px]">
        <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72]">
          SELECCIÓN PRODUCTOS
        </span>
        <h1 className="mt-[7px] mb-[10px] text-[clamp(34px,7vw,62px)]">
          {catalog.businessName}
        </h1>
        <p className="max-w-[560px] text-muted-foreground text-[16px] leading-[1.6]">
          {catalog.publicIntro || 'Conoce nuestros productos disponibles.'}
        </p>
      </section>
      <section
        className="grid grid-cols-3 gap-[18px] max-w-[1120px] mx-auto max-[750px]:grid-cols-2 max-[520px]:grid-cols-1"
        aria-label="Productos publicados"
      >
        {catalog.products.length === 0 ? (
          <div className="p-[45px] border border-dashed border-[#d9d1d8] rounded-[13px] text-[#817d86] text-center text-[13px] bg-[#fffefa]">
            Aún no hay productos publicados. Vuelve pronto para conocer nuestros
            productos.
          </div>
        ) : (
          catalog.products.map((product) => (
            <CatalogCard
              key={product.id}
              product={product}
              currency={catalog.currency}
              selectedVariantId={selectedVariants[product.id]}
              onSelectVariant={(variantId) =>
                setSelectedVariants((prev) => ({
                  ...prev,
                  [product.id]: variantId,
                }))
              }
              whatsapp={
                whatsappNum
                  ? {
                      number: whatsappNum,
                      businessName: catalog.businessName,
                    }
                  : undefined
              }
            />
          ))
        )}
      </section>
    </main>
  )
}
