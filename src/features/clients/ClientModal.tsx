import { useState, type FormEvent } from 'react'
import { Check } from 'lucide-react'
import type { Client } from '../../types.ts'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'

export function ClientModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial: Client | null
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    setSaving(true)
    try {
      await onSubmit(event)
    } finally {
      setSaving(false)
    }
  }
  return (
    <ModalFrame
      title={initial ? 'Editar cliente' : 'Nuevo cliente'}
      onClose={onClose}
    >
      <form className="grid gap-[15px]" onSubmit={submit}>
        <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
          Nombre completo
          <Input
            name="name"
            defaultValue={initial?.name}
            placeholder="Ej. Mariana González"
            required
          />
        </label>
        <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
          Teléfono
          <Input
            name="phone"
            defaultValue={initial?.phone}
            placeholder="55 1234 5678"
          />
        </label>
        <label className="grid gap-[6px] text-[#716b72] text-[11px] font-bold">
          Zona o colonia
          <Input
            name="zone"
            defaultValue={initial?.zone}
            placeholder="Ej. Coyoacán"
          />
        </label>
        <div className="flex justify-end gap-[10px] mt-[9px]">
          <Button
            variant="primary"
            disabled={saving}
            type="submit"
            icon={<Check size={18} aria-hidden="true" />}
          >
            {saving ? 'Guardando...' : 'Guardar cliente'}
          </Button>
        </div>
      </form>
    </ModalFrame>
  )
}
