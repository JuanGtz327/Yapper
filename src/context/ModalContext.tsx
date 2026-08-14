import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Client } from '../types.ts'
import type { Modal } from '../lib/navigation.ts'

export type ConfirmState = {
  title: string
  message: string
  onConfirm: () => void
}

type ModalContextValue = {
  modal: Modal
  editingClient: Client | null
  confirmState: ConfirmState | null
  openModal: (type: Modal, editing?: Client) => void
  closeModal: () => void
  clearConfirm: () => void
}

const ModalContext = createContext<ModalContextValue | null>(null)

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

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}
