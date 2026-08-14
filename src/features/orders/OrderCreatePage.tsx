import { useState, type FormEvent } from 'react'
import { ArrowLeft, Check, Plus, X } from 'lucide-react'
import type {
  Client,
  Order,
  OrderItemInput,
  Product,
  VariantOption,
  OrderDraftLine,
} from '../../types.ts'
import { formatMoney } from '../../lib/format.ts'
import { CustomSelect } from '../../components/ui/CustomSelect.tsx'
import { Empty } from '../../components/ui/Empty.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { useToast } from '../../hooks/useToast.ts'

function buildVariantOptions(products: Product[]): VariantOption[] {
  return products.flatMap((product) =>
    product.variants.map((variant) => ({ variant, productName: product.name })),
  )
}

export function OrderCreatePage({
  initial,
  clients,
  products,
  currency,
  onClose,
  onBackToDetail,
  onSubmit,
}: {
  initial: Order | null
  clients: Client[]
  products: Product[]
  currency: string
  onClose: () => void
  onBackToDetail?: () => void
  onSubmit: (
    clientId: string,
    items: OrderItemInput[],
    payment: 'pending' | 'paid',
  ) => Promise<boolean>
}) {
  const variantOptions = buildVariantOptions(products)
  const firstAvailable = variantOptions.find(
    (option) => option.variant.stock > 0,
  )
  const [clientId, setClientId] = useState(
    initial?.clientId ?? clients[0]?.id ?? '',
  )
  const [lines, setLines] = useState<OrderDraftLine[]>(
    initial?.itemLines?.map((line) => ({
      variantId: line.variantId,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    })) ??
      (firstAvailable
        ? [{ variantId: firstAvailable.variant.id, quantity: 1 }]
        : []),
  )
  const [payment, setPayment] = useState<'pending' | 'paid'>(
    initial?.payment === 'Pendiente' ? 'pending' : 'paid',
  )
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  const originalQuantities = new Map(
    (initial?.itemLines ?? []).map((line) => [line.variantId, line.quantity]),
  )

  const findVariant = (variantId: string) =>
    variantOptions.find((option) => option.variant.id === variantId)
  const availableStock = (variantId: string) =>
    (findVariant(variantId)?.variant.stock ?? 0) +
    (originalQuantities.get(variantId) ?? 0)
  const priceFor = (line: OrderDraftLine) =>
    line.unitPrice ?? findVariant(line.variantId)?.variant.salePrice ?? 0
  const total = lines.reduce(
    (sum, line) => sum + priceFor(line) * line.quantity,
    0,
  )
  const money = (value: number) => formatMoney(value, currency)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!clientId || !lines.length) {
      toast.error('Selecciona un cliente y al menos un producto.')
      return
    }
    if (
      lines.some(
        (line) =>
          !Number.isInteger(line.quantity) ||
          line.quantity < 1 ||
          line.quantity > availableStock(line.variantId),
      )
    ) {
      toast.error('Revisa las cantidades y las existencias disponibles.')
      return
    }
    if (new Set(lines.map((line) => line.variantId)).size !== lines.length) {
      toast.error('No repitas variantes en el mismo pedido.')
      return
    }
    setSaving(true)
    try {
      if (
        await onSubmit(
          clientId,
          lines.map(({ variantId, quantity }) => ({ variantId, quantity })),
          payment,
        )
      )
        onClose()
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No pudimos guardar el pedido.',
      )
    } finally {
      setSaving(false)
    }
  }

  const formatVariantLabel = (option: VariantOption) => {
    const labels = [option.productName]
    if (option.variant.sku) labels.push(`(${option.variant.sku})`)
    const options = option.variant.optionValues
      .map((value) => value.value)
      .join(', ')
    if (options) labels.push(`— ${options}`)
    labels.push(`— ${availableStock(option.variant.id)} disponibles`)
    return labels.join(' ')
  }

  return (
    <section className="page-section w-full">
      <div className="section-intro mb-[26px] max-[520px]:mb-5">
        <div>
          <span className="eyebrow">VENTAS</span>
          <h2>{initial ? 'Editar pedido' : 'Nuevo pedido'}</h2>
          <p>
            {initial
              ? 'Actualiza los productos, cantidades o forma de pago.'
              : 'Completa los datos para registrar una nueva venta.'}
          </p>
        </div>
        <div className="section-actions">
          {onBackToDetail && (
            <Button
              variant="secondary"
              onClick={onBackToDetail}
              type="button"
              icon={<ArrowLeft size={16} aria-hidden="true" />}
            >
              Volver al pedido
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} type="button" icon={<ArrowLeft size={16} aria-hidden="true" />}>
            Volver a pedidos
          </Button>
        </div>
      </div>
      {!clients.length || !variantOptions.length ? (
        <Empty text="Necesitas al menos un cliente y un producto para crear un pedido." />
      ) : (
        <form
          className="form-grid gap-4 w-full p-[clamp(18px,3vw,30px)] border border-border rounded-[14px] bg-sidebar shadow-[0_10px_28px_rgba(70,46,65,0.06)] max-[520px]:px-[18px] max-[520px]:py-[18px]"
          onSubmit={submit}
        >
          <label>
            Cliente
            <CustomSelect
              value={clientId}
              onChange={setClientId}
              options={clients.map((client) => ({
                value: client.id,
                label: client.name,
              }))}
              placeholder="Seleccionar cliente..."
              ariaLabel="Cliente"
            />
          </label>
          <div className="grid gap-[9px]">
            <div className="grid grid-cols-[minmax(0,1fr)_68px_90px_30px] items-center gap-[7px] text-[#716b72] text-[11px] font-bold max-[520px]:grid-cols-[minmax(0,1fr)_56px_76px_30px] max-[520px]:gap-[5px] max-[520px]:text-[10px]">
              <span>Productos</span>
              <span>Cantidad</span>
              <span>Total</span>
              <span className="sr-only">Acciones</span>
            </div>
            {lines.map((line, index) => {
              const selected = findVariant(line.variantId)
              return (
                <div className="grid grid-cols-[minmax(0,1fr)_68px_90px_30px] items-center gap-[7px] max-[520px]:grid-cols-[minmax(0,1fr)_56px_76px_30px] max-[520px]:gap-[5px]" key={`${line.variantId}-${index}`}>
                  <CustomSelect
                    value={line.variantId}
                    onChange={(value) =>
                      setLines((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                variantId: value,
                                unitPrice: undefined,
                              }
                            : item,
                        ),
                      )
                    }
                    options={variantOptions.map((option) => ({
                      value: option.variant.id,
                      label: formatVariantLabel(option),
                    }))}
                    placeholder="Producto..."
                    ariaLabel="Producto"
                  />
                  <Input
                    aria-label={`Cantidad ${index + 1}`}
                    value={line.quantity}
                    onChange={(event) =>
                      setLines((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, quantity: Number(event.target.value) }
                            : item,
                        ),
                      )
                    }
                    type="number"
                    min="1"
                    max={availableStock(line.variantId)}
                    step="1"
                  />
                  <span className="text-foreground text-[13px] font-bold text-right whitespace-nowrap max-[520px]:text-xs">
                    {money(priceFor(line) * line.quantity)}
                  </span>
                  <Button
                    variant="danger"
                    icon={<X size={16} aria-hidden="true" />}
                    size="sm"
                    className="justify-self-end max-[520px]:p-[6px]"
                    onClick={() =>
                      setLines((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    aria-label="Quitar producto"
                    type="button"
                  />
                  <small className="col-start-1 col-end-2 text-[#716b72] text-[10px]">
                    {selected
                      ? `${availableStock(line.variantId)} disponibles`
                      : 'Producto no disponible'}
                  </small>
                </div>
              )
            })}
            <button
              className="flex items-center justify-center gap-[5px] py-[9px] border border-dashed border-[#d8c8d8] rounded-[8px] text-primary bg-[#fbf7fb] text-[11px] font-bold"
              onClick={() => {
                const next = variantOptions.find(
                  (option) =>
                    availableStock(option.variant.id) > 0 &&
                    !lines.some((line) => line.variantId === option.variant.id),
                )
                if (next)
                  setLines((current) => [
                    ...current,
                    { variantId: next.variant.id, quantity: 1 },
                  ])
              }}
              type="button"
            >
              <Plus size={15} /> Añadir otro producto
            </button>
          </div>
          <label>
            Estado del pago
            <CustomSelect
              value={payment}
              onChange={(value) => setPayment(value as 'pending' | 'paid')}
              options={[
                { value: 'paid', label: 'Pagado' },
                { value: 'pending', label: 'Pendiente de pago' },
              ]}
              ariaLabel="Estado del pago"
            />
          </label>
          <div className="flex items-center justify-between pt-[15px] border-t border-border text-[#716b72] text-xs">
            <span>Total del pedido</span>
            <strong className="text-primary text-[22px]">{money(total)}</strong>
          </div>
          <div className="flex justify-end gap-[10px] mt-[9px]">
            <Button
              variant="primary"
              disabled={saving}
              type="submit"
              icon={<Check size={18} />}
            >
              {saving
                ? 'Guardando...'
                : initial
                  ? 'Guardar cambios'
                  : 'Guardar pedido'}
            </Button>
          </div>
        </form>
      )}
    </section>
  )
}
