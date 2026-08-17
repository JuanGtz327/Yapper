import { useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import type { Client } from '../types.ts'
import { ModalContext, type ConfirmState } from './ModalContextValue.ts'
import type { Modal } from '../lib/navigation.ts'

type ModalProviderProps = {
  children: ReactNode
  confirmState: ConfirmState | null
  clearConfirm: () => void
}

export function ModalProvider({
  children,
  confirmState,
  clearConfirm,
}: ModalProviderProps) {
  const [modal, setModal] = useState<Modal>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const openModal = useCallback((type: Modal, editing?: Client) => {
    setEditingClient(editing ?? null)
    setModal(type)
  }, [])

  const closeModal = useCallback(() => {
    setModal(null)
    setEditingClient(null)
  }, [])

  return (
    <ModalContext.Provider
      value={{
        modal,
        editingClient,
        confirmState,
        openModal,
        closeModal,
        clearConfirm,
      }}
    >
      {children}
    </ModalContext.Provider>
  )
}
