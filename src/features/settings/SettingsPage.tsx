import { useState, useEffect, type FormEvent } from 'react'
import { Check, Palette } from 'lucide-react'
import type { BusinessSettings } from '../../types.ts'
import { CustomSelect } from '../../components/ui/CustomSelect.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { Checkbox } from '../../components/ui/Checkbox.tsx'
import { Textarea } from '../../components/ui/Textarea.tsx'
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
    <section className="animate-[page-in_0.25s_ease_both]">
      <div className="flex items-end justify-between mb-[27px] max-[650px]:flex-col max-[650px]:items-start max-[650px]:gap-[17px]">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-[0.7px] text-[#817d86]">
            CONFIGURACIÓN
          </span>
          <h2>Tu negocio</h2>
          <p>Personaliza Yapper para trabajar a tu manera.</p>
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(260px,1fr)] gap-4 max-[650px]:grid-cols-1">
        <form
          className="border border-[#ebe8e4] rounded-[13px] bg-[#fffefa] p-[23px_24px] grid gap-6 max-w-[620px] max-[650px]:max-w-none"
          onSubmit={submit}
        >
          {/* ── PREFERENCIAS ────────────────────────────────── */}
          <div className="grid gap-4">
            <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72]">
              PREFERENCIAS
            </span>
            <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
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
            <CustomSelect
              label="Moneda predeterminada"
              value={draft.currency}
              onChange={(val) => setDraft({ ...draft, currency: val })}
              ariaLabel="Moneda predeterminada"
              options={[
                { value: 'MXN', label: 'Peso mexicano (MXN)' },
                { value: 'USD', label: 'Dólar estadounidense (USD)' },
                { value: 'CAD', label: 'Dólar canadiense (CAD)' },
              ]}
            />
            <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
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
          </div>

          <div className="h-px bg-[#e8e4e6]" />

          {/* ── CATÁLOGO PÚBLICO ───────────────────────────── */}
          <div className="grid gap-4">
            <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72]">
              CATÁLOGO PÚBLICO
            </span>
            <label className="flex! items-center gap-2! text-[#716b72] text-[11px] font-bold">
              <Checkbox
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
            <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
              Slug único
              <span className="text-[#aaa5a8] text-[10px] font-normal">
                Se verá en /tienda/tu-slug
              </span>
              <Input
                value={draft.publicSlug}
                onChange={(event) =>
                  setDraft({ ...draft, publicSlug: event.target.value })
                }
                placeholder="mi-negocio"
                maxLength={50}
              />
            </label>
            <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
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
            <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
              Presentación pública
              <Textarea
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
          </div>
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
        <aside className="border border-[#ebe8e4] rounded-[13px] bg-[#fffefa] p-[23px_24px] self-start grid gap-6">
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72]">
              CUENTA
            </span>
            <h3 className="text-ink text-[16px] mt-[7px]">Sesión actual</h3>
            <p className="mt-1 text-muted-foreground text-[12px] leading-[1.5]">
              Tu información está protegida y solo tú puedes acceder a ella.
            </p>
            <Button variant="danger" onClick={onSignOut} type="button">
              Cerrar sesión
            </Button>
          </div>
          <div className="h-px bg-[#e8e4e6]" />
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-[0.7px] text-[#6d3c72]">
              INVENTARIO
            </span>
            <h3 className="text-ink text-[16px] mt-[7px]">
              Opciones de producto
            </h3>
            <p className="mt-1 text-muted-foreground text-[12px] leading-[1.5]">
              Administra tipos como Color, Talla o Capacidad y sus valores.
            </p>
            <Button
              variant="secondary"
              className="mt-[10px]"
              onClick={onOpenOptionTypes}
              type="button"
              icon={<Palette size={16} />}
            >
              Gestionar opciones
            </Button>
          </div>
        </aside>
      </div>
    </section>
  )
}
