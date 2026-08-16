import { Boxes, MessageCircle } from 'lucide-react'
import { formatMoney } from '../../lib/format.ts'
import { safeImageUrl } from '../../lib/security.ts'

export const catalogColors: Record<string, string> = {
  coral: 'text-[#b06b57] bg-[#f9e5dc]',
  mint: 'text-[#579078] bg-[#dff1e6]',
  sky: 'text-[#52829e] bg-[#e0eff5]',
  lavender: 'text-[#7963a2] bg-[#ece5f7]',
}

export const sphereColors = [
  '#52829e',
  '#b06b57',
  '#579078',
  '#7963a2',
  '#b97740',
  '#4a7fb5',
  '#8b6f5c',
  '#6d8a6e',
]

type CardVariant = {
  id?: string
  name: string
  optionValues: Array<{ optionType: string; value: string }>
  salePrice: number
  stock: number
}

type CardProduct = {
  id: string
  name: string
  category: string
  publicDescription: string
  imageUrl: string | null
  color: string
  variants: CardVariant[]
}

function variantOptionLabel(variant: CardVariant): string {
  return [...variant.optionValues]
    .sort((a, b) => a.value.localeCompare(b.value))
    .map((ov) => ov.value)
    .join(' - ')
}

function variantLabel(variant: CardVariant): string {
  if (variant.name) return variant.name
  return variantOptionLabel(variant)
}

export function CatalogCard({
  product,
  currency,
  selectedVariantId,
  onSelectVariant,
  whatsapp,
  lowStockThreshold = 5,
}: {
  product: CardProduct
  currency: string
  selectedVariantId?: string
  onSelectVariant: (variantId: string) => void
  whatsapp?: { number: string; businessName: string }
  lowStockThreshold?: number
}) {
  const imageUrl = safeImageUrl(product.imageUrl)
  const selectedIdx = selectedVariantId != null
    ? (() => {
        const byId = product.variants.findIndex((v) => v.id === selectedVariantId)
        return byId >= 0 ? byId : Number(selectedVariantId) || 0
      })()
    : 0
  const selected = product.variants[selectedIdx] ?? product.variants[0]
  const variantHint = selected?.name ? ` (${selected.name})` : ''

  return (
    <article className="overflow-hidden border border-[#ebe8e4] rounded-[14px] bg-[#fffefa]">
      {imageUrl ? (
        <img
          className="grid place-items-center h-[190px] w-full object-cover"
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
      <div className="p-4 px-[17px] pb-[18px] pt-5">
        <div className="flex items-start justify-between gap-3 h-[42px]">
          <div className="min-w-0">
            <h3 className="text-[#6d3c72] text-[18px] font-bold leading-tight">
              {product.name}
            </h3>
            <span className="mt-[4px] block text-[#aaa5a8] text-[10px]">
              {product.category}
            </span>
          </div>
          <div className="shrink-0 flex flex-col items-end justify-start gap-[6px] h-full">
            <strong className="text-[#6d3c72] text-[17px]">
              {selected
                ? formatMoney(selected.salePrice, currency)
                : formatMoney(0, currency)}
            </strong>
            {selected && selected.stock === 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#f9e5dc] text-[#aa5244]">
                Agotado
              </span>
            ) : selected && selected.stock <= lowStockThreshold ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[#fef3cd] text-[#856404]">
                Últimas unidades
              </span>
            ) : null}
          </div>
        </div>
        {product.publicDescription && (
          <p className="min-h-[32px] mt-3 mb-3 text-muted-foreground text-[11px] leading-[1.45]">
            {product.publicDescription}
          </p>
        )}
        {product.variants.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-[10px] h-[28px]">
            {product.variants.map((variant, idx) => {
              const isSelected = idx === selectedIdx
              return (
                <button
                  key={variant.id ?? idx}
                  type="button"
                  onClick={() => onSelectVariant(variant.id ?? String(idx))}
                  className="group/sphere relative flex items-center justify-center"
                  title={variantLabel(variant)}
                >
                  <span
                    className="block w-[22px] h-[22px] rounded-full transition-all duration-200"
                    style={{
                      backgroundColor:
                        sphereColors[idx % sphereColors.length],
                      transform: isSelected
                        ? 'scale(1.15)'
                        : 'scale(1)',
                      boxShadow: isSelected
                        ? `0 0 0 2px #fff, 0 0 0 3.5px ${sphereColors[idx % sphereColors.length]}`
                        : '0 1px 3px rgba(0,0,0,0.12)',
                    }}
                  />
                </button>
              )
            })}
            {selected && variantOptionLabel(selected) && (
              <span className="ml-auto text-[11px] text-muted-foreground">
                {variantOptionLabel(selected)}
              </span>
            )}
          </div>
        )}
        {whatsapp && (
          <a
            className={`mt-3 inline-flex items-center justify-center gap-[7px] w-full py-[11px] px-3 rounded-[9px] text-[12px] font-bold no-underline ${
              selected?.stock === 0
                ? 'bg-[#ccc] text-[#888] pointer-events-none cursor-not-allowed'
                : 'text-white bg-[#258c67] hover:bg-[#1e7657]'
            }`}
            href={selected?.stock === 0 ? undefined : `https://wa.me/${whatsapp.number}?text=${encodeURIComponent(`Hola, ${whatsapp.businessName}. Me interesa ${product.name}${variantHint}. Vi su catálogo público.`)}`}
            aria-disabled={selected?.stock === 0}
            tabIndex={selected?.stock === 0 ? -1 : undefined}
          >
            <MessageCircle size={17} />
            {selected?.stock === 0 ? 'Sin stock disponible' : 'Preguntar por WhatsApp'}
          </a>
        )}
      </div>
    </article>
  )
}
