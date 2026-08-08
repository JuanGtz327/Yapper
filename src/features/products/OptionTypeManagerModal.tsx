import { useState, useRef, type FormEvent } from 'react'
import { Plus, X, Palette, ChevronDown, ChevronRight } from 'lucide-react'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'
import {
  createOptionType,
  createOptionValue,
  deleteOptionType,
  deleteOptionValue,
} from '../../lib/repository.ts'

type OptionType = {
  id: string
  name: string
  values: Array<{ id: string; name: string }>
}

export function OptionTypeManagerModal({
  optionTypes,
  onRefresh,
  onClose,
}: {
  optionTypes: OptionType[]
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
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const valueInputRef = useRef<HTMLInputElement>(null)

  const handleCreateType = async (event?: FormEvent) => {
    event?.preventDefault()
    const name = newTypeName.trim()
    if (!name) return
    setCreatingType(true)
    setError('')
    try {
      await createOptionType(name)
      setNewTypeName('')
      onRefresh()
    } catch {
      setError('No pudimos crear el tipo de opción.')
    } finally {
      setCreatingType(false)
    }
  }

  const handleDeleteType = async (id: string) => {
    setDeletingTypeId(id)
    setError('')
    try {
      await deleteOptionType(id)
      onRefresh()
    } catch {
      setError('No pudimos eliminar el tipo de opción.')
    } finally {
      setDeletingTypeId(null)
    }
  }

  const handleAddValue = async (typeId: string) => {
    const name = (newValues[typeId] || '').trim()
    if (!name) return
    setAddingValueTo(typeId)
    setError('')
    try {
      await createOptionValue(typeId, name)
      setNewValues({ ...newValues, [typeId]: '' })
      onRefresh()
    } catch {
      setError('No pudimos agregar el valor.')
    } finally {
      setAddingValueTo(null)
    }
  }

  const handleDeleteValue = async (valueId: string) => {
    setDeletingValueId(valueId)
    setError('')
    try {
      await deleteOptionValue(valueId)
      onRefresh()
    } catch {
      setError('No pudimos eliminar el valor.')
    } finally {
      setDeletingValueId(null)
    }
  }

  return (
    <ModalFrame title="Opciones de producto" onClose={onClose}>
      <p className="field-help" style={{ marginTop: 0 }}>
        Crea tipos como Color, Talla o Capacidad. Luego asigna valores a cada
        variante de producto.
      </p>

      <form className="category-add-row" onSubmit={handleCreateType}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Nuevo tipo (ej. Color, Talla)..."
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          disabled={creatingType}
          aria-label="Nombre del tipo de opción"
        />
        <button
          className={`primary-button${creatingType ? ' button-loading' : ''}`}
          type="submit"
          disabled={creatingType || !newTypeName.trim()}
          aria-busy={creatingType}
        >
          <Plus size={15} aria-hidden="true" />
          Añadir
        </button>
      </form>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

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
                  onClick={() =>
                    setExpandedTypeId(isExpanded ? null : type.id)
                  }
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
                <button
                  className="icon-button danger"
                  onClick={() => handleDeleteType(type.id)}
                  disabled={deletingTypeId === type.id}
                  type="button"
                  aria-label={`Eliminar ${type.name}`}
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>

              {isExpanded && (
                <div className="option-type-values">
                  <ul className="option-value-list">
                    {type.values.map((val) => (
                      <li key={val.id} className="option-value-item">
                        <span>{val.name}</span>
                        <button
                          className="icon-button danger"
                          onClick={() => handleDeleteValue(val.id)}
                          disabled={deletingValueId === val.id}
                          type="button"
                          aria-label={`Eliminar ${val.name}`}
                        >
                          <X size={13} aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                    {type.values.length === 0 && (
                      <li className="option-value-empty">
                        Sin valores aún
                      </li>
                    )}
                  </ul>
                  <form
                    className="option-value-add-row"
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleAddValue(type.id)
                    }}
                  >
                    <input
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
                    <button
                      className={`small-button${addingValueTo === type.id ? ' button-loading' : ''}`}
                      type="submit"
                      disabled={
                        addingValueTo === type.id ||
                        !(newValues[type.id] || '').trim()
                      }
                      aria-busy={addingValueTo === type.id}
                    >
                      <Plus size={13} aria-hidden="true" />
                    </button>
                  </form>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </ModalFrame>
  )
}
