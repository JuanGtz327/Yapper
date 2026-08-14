import type { FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useModal } from '../../context/ModalContext.tsx'
import { ClientModal } from '../../features/clients/ClientModal.tsx'
import { CategoryManagerModal } from '../../features/products/CategoryManagerModal.tsx'
import { OptionTypeManagerModal } from '../../features/products/OptionTypeManagerModal.tsx'
import { ConfirmModal } from '../ui/ConfirmModal.tsx'
import { qk } from '../../lib/queryKeys.ts'
import type { Category, OptionTypeWithValues } from '../../types.ts'

type ModalManagerProps = {
  categories: Category[]
  optionTypes: OptionTypeWithValues[]
  user: User | null
  addClientAction: (
    event: FormEvent<HTMLFormElement>,
    editing: import('../../types.ts').Client | null,
  ) => Promise<boolean>
}

export function ModalManager({
  categories,
  optionTypes,
  user,
  addClientAction,
}: ModalManagerProps) {
  const { modal, editingClient, confirmState, closeModal, clearConfirm } =
    useModal()
  const qc = useQueryClient()

  if (modal === 'client') {
    return (
      <ClientModal
        initial={editingClient}
        onClose={closeModal}
        onSubmit={async (event) => {
          if (await addClientAction(event, editingClient)) {
            closeModal()
          }
        }}
      />
    )
  }

  if (modal === 'categories') {
    return (
      <CategoryManagerModal
        categories={categories}
        onSelect={closeModal}
        onCategoryCreated={() => {
          void qc.invalidateQueries({ queryKey: qk.categories(user) })
        }}
        onClose={closeModal}
      />
    )
  }

  if (modal === 'optionTypes') {
    return (
      <OptionTypeManagerModal
        optionTypes={optionTypes}
        onRefresh={() => {
          void qc.invalidateQueries({ queryKey: qk.optionTypes(user) })
        }}
        onClose={closeModal}
      />
    )
  }

  if (confirmState) {
    return (
      <ConfirmModal
        title={confirmState.title}
        message={confirmState.message}
        danger
        onConfirm={() => {
          void confirmState.onConfirm()
        }}
        onClose={clearConfirm}
      />
    )
  }

  return null
}
