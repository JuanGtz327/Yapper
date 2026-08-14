import { useState, useRef, type FormEvent } from 'react'
import { Plus, X, Tag } from 'lucide-react'
import { ModalFrame } from '../../components/ui/ModalFrame.tsx'
import { Button } from '../../components/ui/Button.tsx'
import { Input } from '../../components/ui/Input.tsx'
import { ConfirmModal } from '../../components/ui/ConfirmModal.tsx'
import { createCategory, deleteCategory } from '../../lib/repository.ts'
import { useToast, toastMessages } from '../../hooks/useToast.ts'

export function CategoryManagerModal({
  categories,
  onSelect,
  onCategoryCreated,
  onClose,
}: {
  categories: Array<{ id: string; name: string }>
  onSelect: (categoryId: string) => void
  onCategoryCreated: () => void
  onClose: () => void
}) {
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const handleCreate = async (event?: FormEvent) => {
    event?.preventDefault()
    const name = newName.trim()
    if (!name) return
    setCreating(true)
    try {
      const id = await createCategory(name)
      toast.success(toastMessages.category.created)
      setNewName('')
      onCategoryCreated()
      onSelect(id)
    } catch {
      toast.error('No pudimos crear la categoría.')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = (id: string) => {
    const cat = categories.find((c) => c.id === id)
    setConfirmState({
      title: 'Eliminar categoría',
      message: `¿Eliminar la categoría "${cat?.name ?? ''}"? Los productos asociados perderán su categoría.`,
      onConfirm: async () => {
        setDeletingId(id)
        try {
          await deleteCategory(id)
          toast.success(toastMessages.category.deleted)
          onCategoryCreated()
        } catch {
          toast.error('No pudimos eliminar la categoría.')
        } finally {
          setDeletingId(null)
        }
      },
    })
  }

  return (
    <ModalFrame title="Categorías" onClose={onClose}>
      <form className="flex gap-2 mb-[14px]" onSubmit={handleCreate}>
        <Input
          ref={inputRef}
          type="text"
          placeholder="Nueva categoría..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          disabled={creating}
          aria-label="Nombre de la nueva categoría"
        />
        <Button
          variant="primary"
          type="submit"
          disabled={creating || !newName.trim()}
          aria-busy={creating}
          icon={<Plus size={15} aria-hidden="true" />}
        >
          Añadir
        </Button>
      </form>
      <ul className="grid gap-1 p-0 m-0 list-none max-h-[280px] overflow-y-auto">
        {categories.length === 0 && (
          <li className="flex items-center justify-center gap-2 p-7 px-4 text-muted-foreground text-[13px]">
            <Tag size={16} aria-hidden="true" className="text-[#c9bfca]" />
            No hay categorías todavía
          </li>
        )}
        {categories.map((cat) => (
          <li key={cat.id} className="flex items-center gap-1">
            <button
              className="flex-1 flex items-center gap-2 py-[10px] px-3 border-0 rounded-[8px] text-foreground bg-transparent text-[13px] text-left cursor-pointer hover:bg-[#f3eaf4]"
              onClick={() => onSelect(cat.id)}
              type="button"
            >
              <Tag size={14} aria-hidden="true" className="text-primary shrink-0" />
              {cat.name}
            </button>
            <Button
              variant="danger"
              icon={<X size={15} aria-hidden="true" />}
              onClick={() => handleDelete(cat.id)}
              disabled={deletingId === cat.id}
              type="button"
              aria-label={`Eliminar ${cat.name}`}
            />
          </li>
        ))}
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
