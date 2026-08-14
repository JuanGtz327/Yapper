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
    <section className="page-section order-editor-page">
      <div className="section-intro">
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
          className="form-grid order-form order-editor-card"
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
          <div className="order-lines">
            <div className="line-heading">
              <span>Productos</span>
              <span>Cantidad</span>
              <span>Total</span>
              <span className="visually-hidden">Acciones</span>
            </div>
            {lines.map((line, index) => {
              const selected = findVariant(line.variantId)
              return (
                <div className="order-line" key={`${line.variantId}-${index}`}>
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
                  <span className="line-total">
                    {money(priceFor(line) * line.quantity)}
                  </span>
                  <Button
                    variant="danger"
                    icon={<X size={16} aria-hidden="true" />}
                    size="sm"
                    className="order-line-remove"
                    onClick={() =>
                      setLines((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    aria-label="Quitar producto"
                    type="button"
                  />
                  <small className="order-line-stock">
                    {selected
                      ? `${availableStock(line.variantId)} disponibles`
                      : 'Producto no disponible'}
                  </small>
                </div>
              )
            })}
            <button
              className="add-line"
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
          <div className="order-total">
            <span>Total del pedido</span>
            <strong>{money(total)}</strong>
          </div>
          <div className="modal-actions">
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
