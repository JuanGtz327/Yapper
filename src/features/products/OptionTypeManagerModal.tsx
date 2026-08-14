import { useState, useRef, type FormEvent } from 'react'
import { Plus, X, Palette, ChevronDown, ChevronRight } from 'lucide-react'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { ConfirmModal } from '../../components/ui/ConfirmModal.tsx'
import {
  createOptionType,
  createOptionValue,
  deleteOptionType,
  deleteOptionValue,
} from '../../lib/repository.ts'
import { useToast, toastMessages } from '../../hooks/useToast.ts'
import type { OptionTypeWithValues } from '../../types.ts'

export function OptionTypeManagerModal({
  optionTypes,
  onRefresh,
  onClose,
}: {
  optionTypes: OptionTypeWithValues[]
  onRefresh: () => void
  onClose: () => void
}) {
  const [newTypeName, setNewTypeName] = useState('')
  const [creatingType, setCreatingType] = useState(false)
  const [deletingTypeId, setDeletingTypeId] = useState<string | null>(null)
  const [deletingValueId, setDeletingValueId] = useState<string | null>(null)
  const [expandedTypeId, setExpandedTypeId] = useState<string | null>(null)
  const [newValues, setNewValues] = useState<Record<string, string>>({})
  const [addingValueTo, setAddingValueTo] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const valueInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const handleCreateType = async (event?: FormEvent) => {
    event?.preventDefault()
    const name = newTypeName.trim()
    if (!name) return
    setCreatingType(true)
    try {
      await createOptionType(name)
      toast.success(toastMessages.optionType.created)
      setNewTypeName('')
      onRefresh()
    } catch {
      toast.error('No pudimos crear el tipo de opción.')
    } finally {
      setCreatingType(false)
    }
  }

  const handleDeleteType = (id: string) => {
    const type = optionTypes.find((t) => t.id === id)
    setConfirmState({
      title: 'Eliminar tipo de opción',
      message: `¿Eliminar el tipo "${type?.name ?? ''}" y todos sus valores? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setDeletingTypeId(id)
        try {
          await deleteOptionType(id)
          toast.success(toastMessages.optionType.deleted)
          onRefresh()
        } catch {
          toast.error('No pudimos eliminar el tipo de opción.')
        } finally {
          setDeletingTypeId(null)
        }
      },
    })
  }

  const handleAddValue = async (typeId: string) => {
    const name = (newValues[typeId] || '').trim()
    if (!name) return
    setAddingValueTo(typeId)
    try {
      await createOptionValue(typeId, name)
      toast.success(toastMessages.optionValue.created)
      setNewValues({ ...newValues, [typeId]: '' })
      onRefresh()
    } catch {
      toast.error('No pudimos agregar el valor.')
    } finally {
      setAddingValueTo(null)
    }
  }

  const handleDeleteValue = (valueId: string) => {
    let valueName = ''
    for (const type of optionTypes) {
      const val = type.values.find((v) => v.id === valueId)
      if (val) {
        valueName = val.name
        break
      }
    }
    setConfirmState({
      title: 'Eliminar valor',
      message: `¿Eliminar el valor "${valueName}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setDeletingValueId(valueId)
        try {
          await deleteOptionValue(valueId)
          toast.success(toastMessages.optionValue.deleted)
          onRefresh()
        } catch {
          toast.error('No pudimos eliminar el valor.')
        } finally {
          setDeletingValueId(null)
        }
      },
    })
  }

  return (
    <ModalFrame title="Opciones de producto" onClose={onClose}>
      <p className="field-help" style={{ marginTop: 0 }}>
        Crea tipos como Color, Talla o Capacidad. Luego asigna valores a cada
        variante de producto.
      </p>

      <form className="category-add-row" onSubmit={handleCreateType}>
        <Input
          ref={inputRef}
          type="text"
          placeholder="Nuevo tipo (ej. Color, Talla)..."
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          disabled={creatingType}
          aria-label="Nombre del tipo de opción"
        />
        <Button
          variant="primary"
          type="submit"
          disabled={creatingType || !newTypeName.trim()}
          aria-busy={creatingType}
          icon={<Plus size={15} aria-hidden="true" />}
        >
          Añadir
        </Button>
      </form>

      <ul className="option-type-list">
        {optionTypes.length === 0 && (
          <li className="category-list-empty">
            <Palette size={16} aria-hidden="true" />
            No hay tipos de opción todavía
          </li>
        )}
        {optionTypes.map((type) => {
          const isExpanded = expandedTypeId === type.id
          return (
            <li key={type.id} className="option-type-item">
              <div className="option-type-header">
                <button
                  className="option-type-toggle"
                  onClick={() => setExpandedTypeId(isExpanded ? null : type.id)}
                  type="button"
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                  <Palette size={14} aria-hidden="true" />
                  <span className="option-type-name">{type.name}</span>
                  <span className="option-type-count">
                    {type.values.length}{' '}
                    {type.values.length === 1 ? 'valor' : 'valores'}
                  </span>
                </button>
                <Button
                  variant="danger"
                  icon={<X size={15} aria-hidden="true" />}
                  onClick={() => handleDeleteType(type.id)}
                  disabled={deletingTypeId === type.id}
                  type="button"
                  aria-label={`Eliminar ${type.name}`}
                />
              </div>

              {isExpanded && (
                <div className="option-type-values">
                  <ul className="option-value-list">
                    {type.values.map((val) => (
                      <li key={val.id} className="option-value-item">
                        <span>{val.name}</span>
                        <Button
                          variant="danger"
                          icon={<X size={13} aria-hidden="true" />}
                          onClick={() => handleDeleteValue(val.id)}
                          disabled={deletingValueId === val.id}
                          type="button"
                          aria-label={`Eliminar ${val.name}`}
                        />
                      </li>
                    ))}
                    {type.values.length === 0 && (
                      <li className="option-value-empty">Sin valores aún</li>
                    )}
                  </ul>
                  <form
                    className="option-value-add-row"
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleAddValue(type.id)
                    }}
                  >
                    <Input
                      ref={valueInputRef}
                      type="text"
                      placeholder="Nuevo valor..."
                      value={newValues[type.id] || ''}
                      onChange={(e) =>
                        setNewValues({
                          ...newValues,
                          [type.id]: e.target.value,
                        })
                      }
                      disabled={addingValueTo === type.id}
                      aria-label={`Nuevo valor para ${type.name}`}
                    />
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Plus size={13} aria-hidden="true" />}
                      type="submit"
                      disabled={
                        addingValueTo === type.id ||
                        !(newValues[type.id] || '').trim()
                      }
                      aria-busy={addingValueTo === type.id}
                    />
                  </form>
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {confirmState && (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          danger
          confirmLabel="Eliminar"
          onConfirm={() => void confirmState.onConfirm()}
          onClose={() => setConfirmState(null)}
        />
      )}
    </ModalFrame>
  )
}
