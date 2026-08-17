import { createContext } from 'react'
import type { Client } from '../types.ts'
import type { Modal } from '../lib/navigation.ts'

export type ConfirmState = {
  title: string
  message: string
  onConfirm: () => void
}

export type ModalContextValue = {
  modal: Modal
  editingClient: Client | null
  confirmState: ConfirmState | null
  openModal: (type: Modal, editing?: Client) => void
  closeModal: () => void
  clearConfirm: () => void
}

export const ModalContext = createContext<ModalContextValue | null>(null)
