import { useState, useEffect, type FormEvent } from 'react'
import { Check, Settings, Palette } from 'lucide-react'
import type { BusinessSettings } from '../../types.ts'
import { CustomSelect } from '../../components/ui/CustomSelect.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { useToast } from '../../hooks/useToast.ts'

export function SettingsPage({
  settings,
  onSave,
  onSignOut,
  onOpenOptionTypes,
}: {
  settings: BusinessSettings
  onSave: (settings: BusinessSettings) => Promise<void>
  onSignOut: () => Promise<void>
  onOpenOptionTypes: () => void
}) {
  const [draft, setDraft] = useState({
    ...settings,
    publicSlug: settings.publicSlug ?? '',
    whatsappNumber: settings.whatsappNumber ?? '',
    publicIntro: settings.publicIntro ?? '',
  })
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  useEffect(
    () =>
      setDraft({
        ...settings,
        publicSlug: settings.publicSlug ?? '',
        whatsappNumber: settings.whatsappNumber ?? '',
        publicIntro: settings.publicIntro ?? '',
      }),
    [settings],
  )
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = draft.businessName.trim()
    if (name.length < 2 || name.length > 120) {
      toast.error('El nombre debe tener entre 2 y 120 caracteres.')
      return
    }
    if (
      !Number.isInteger(draft.lowStockThreshold) ||
      !Number.isFinite(draft.lowStockThreshold) ||
      draft.lowStockThreshold < 0 ||
      draft.lowStockThreshold > 10000
    ) {
      toast.error('El umbral debe ser un entero entre 0 y 10,000.')
      return
    }
    setSaving(true)
    try {
      await onSave({
        ...draft,
        businessName: name,
        publicSlug: draft.publicSlug ?? '',
        whatsappNumber: draft.whatsappNumber ?? '',
        publicIntro: draft.publicIntro ?? '',
      })
    } finally {
      setSaving(false)
    }
  }
  return (
    <section className="page-section">
      <div className="section-intro">
        <div>
          <span className="eyebrow">CONFIGURACIÓN</span>
          <h2>Tu negocio</h2>
          <p>Personaliza Yapper para trabajar a tu manera.</p>
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)] gap-4 max-[650px]:grid-cols-1">
        <form className="panel form-grid max-w-[620px] max-[650px]:max-w-none" onSubmit={submit}>
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-grid place-items-center w-10 h-10 rounded-[11px] text-[#6d3c72] bg-[#f3eaf4]">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="text-ink text-[16px]">Preferencias del negocio</h3>
              <p className="mt-1 text-muted text-[12px] leading-[1.5]">Estos datos se guardan en tu cuenta.</p>
            </div>
          </div>
          <label>
            Nombre del negocio
            <Input
              value={draft.businessName}
              onChange={(event) =>
                setDraft({ ...draft, businessName: event.target.value })
              }
              minLength={2}
              maxLength={120}
              required
            />
          </label>
          <label>
            Moneda predeterminada
            <CustomSelect
              value={draft.currency}
              onChange={(val) => setDraft({ ...draft, currency: val })}
              ariaLabel="Moneda predeterminada"
              options={[
                { value: 'MXN', label: 'Peso mexicano (MXN)' },
                { value: 'USD', label: 'Dólar estadounidense (USD)' },
                { value: 'CAD', label: 'Dólar canadiense (CAD)' },
              ]}
            />
          </label>
          <label>
            Umbral de stock bajo
            <span className="text-[#aaa5a8] text-[10px] font-normal">
              Te avisaremos cuando un producto llegue a esta cantidad.
            </span>
            <Input
              value={draft.lowStockThreshold}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  lowStockThreshold: Number(event.target.value),
                })
              }
              type="number"
              min="0"
              max="10000"
              step="1"
              required
            />
          </label>
          <fieldset className="grid gap-3 p-[14px] border border-[#ebe8e4] rounded-[10px]">
            <legend className="px-[5px] text-[#6d3c72] text-[12px] font-bold">Catálogo público</legend>
            <label className="!flex grid-cols-[auto_1fr] items-center gap-2">
              <input
                type="checkbox"
                className="w-auto"
                checked={draft.publicCatalogEnabled}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    publicCatalogEnabled: event.target.checked,
                  })
                }
              />
              Activar mi tienda pública
            </label>
            <label>
              Slug único
              <span className="text-[#aaa5a8] text-[10px] font-normal">Se verá en /tienda/tu-slug</span>
              <Input
                value={draft.publicSlug}
                onChange={(event) =>
                  setDraft({ ...draft, publicSlug: event.target.value })
                }
                placeholder="mi-negocio"
                maxLength={50}
              />
            </label>
            <label>
              WhatsApp de contacto
              <span className="text-[#aaa5a8] text-[10px] font-normal">
                México: 10 dígitos, por ejemplo 55 1234 5678.
              </span>
              <Input
                value={draft.whatsappNumber}
                onChange={(event) =>
                  setDraft({ ...draft, whatsappNumber: event.target.value })
                }
                placeholder="55 1234 5678"
                inputMode="tel"
              />
            </label>
            <label>
              Presentación pública
              <textarea
                value={draft.publicIntro}
                onChange={(event) =>
                  setDraft({ ...draft, publicIntro: event.target.value })
                }
                maxLength={240}
                placeholder="Productos hechos para tu día a día."
              />
            </label>
            {draft.publicCatalogEnabled && draft.publicSlug && (
              <p className="text-[#aaa5a8] text-[10px] font-normal">
                Tu enlace: {window.location.origin}/tienda/{draft.publicSlug}
              </p>
            )}
          </fieldset>
          <div className="flex justify-end gap-[10px] mt-[9px]">
            <Button
              variant="primary"
              disabled={saving}
              type="submit"
              icon={<Check size={18} />}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
        <aside className="panel self-start">
          <span className="eyebrow">CUENTA</span>
          <h3 className="text-ink text-[16px] mt-[7px]">Sesión actual</h3>
          <p className="mt-1 text-muted text-[12px] leading-[1.5]">Tu información está protegida y solo tú puedes acceder a ella.</p>
          <Button variant="danger" onClick={onSignOut} type="button">
            Cerrar sesión
          </Button>
          <div className="h-px bg-[#e8e5e3] my-[18px]" />
          <span className="eyebrow">INVENTARIO</span>
          <h3 className="text-ink text-[16px] mt-[7px]">Opciones de producto</h3>
          <p className="mt-1 text-muted text-[12px] leading-[1.5]">Administra tipos como Color, Talla o Capacidad y sus valores.</p>
          <Button
            variant="secondary"
            className="mt-[10px]"
            onClick={onOpenOptionTypes}
            type="button"
            icon={<Palette size={16} />}
          >
            Gestionar opciones
          </Button>
        </aside>
      </div>
    </section>
  )
}
