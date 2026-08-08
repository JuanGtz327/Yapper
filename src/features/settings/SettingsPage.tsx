import { useState, useEffect, type FormEvent } from 'react'
import { Check, Settings, Palette } from 'lucide-react'
import type { BusinessSettings } from '../../types.ts'
import { CustomSelect } from '../../components/ui/CustomSelect.tsx'
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
    <section className="page-section settings-page">
      <div className="section-intro">
        <div>
          <span className="eyebrow">CONFIGURACIÓN</span>
          <h2>Tu negocio</h2>
          <p>Personaliza Yapper para trabajar a tu manera.</p>
        </div>
      </div>
      <div className="settings-layout">
        <form className="panel form-grid settings-form" onSubmit={submit}>
          <div className="settings-heading">
            <div className="settings-icon">
              <Settings size={20} />
            </div>
            <div>
              <h3>Preferencias del negocio</h3>
              <p>Estos datos se guardan en tu cuenta.</p>
            </div>
          </div>
          <label>
            Nombre del negocio
            <input
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
              options={[
                { value: 'MXN', label: 'Peso mexicano (MXN)' },
                { value: 'USD', label: 'Dólar estadounidense (USD)' },
                { value: 'CAD', label: 'Dólar canadiense (CAD)' },
              ]}
            />
          </label>
          <label>
            Umbral de stock bajo
            <span className="field-help">
              Te avisaremos cuando un producto llegue a esta cantidad.
            </span>
            <input
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
          <fieldset className="public-settings">
            <legend>Catálogo público</legend>
            <label className="checkbox-label">
              <input
                type="checkbox"
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
              <span className="field-help">Se verá en /tienda/tu-slug</span>
              <input
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
              <span className="field-help">
                México: 10 dígitos, por ejemplo 55 1234 5678.
              </span>
              <input
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
              <p className="field-help">
                Tu enlace: {window.location.origin}/tienda/{draft.publicSlug}
              </p>
            )}
          </fieldset>
          <div className="modal-actions">
            <button
              className={`primary-button${saving ? ' button-loading' : ''}`}
              disabled={saving}
              type="submit"
            >
              <Check size={18} />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
        <aside className="panel account-panel">
          <span className="eyebrow">CUENTA</span>
          <h3>Sesión actual</h3>
          <p>Tu información está protegida y solo tú puedes acceder a ella.</p>
          <button className="sign-out-button" onClick={onSignOut} type="button">
            Cerrar sesión
          </button>
          <div className="settings-section-divider" />
          <span className="eyebrow">INVENTARIO</span>
          <h3>Opciones de producto</h3>
          <p>Administra tipos como Color, Talla o Capacidad y sus valores.</p>
          <button
            className="secondary-button option-type-btn"
            onClick={onOpenOptionTypes}
            type="button"
          >
            <Palette size={16} />
            Gestionar opciones
          </button>
        </aside>
      </div>
    </section>
  )
}
