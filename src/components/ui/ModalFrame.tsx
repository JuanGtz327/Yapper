import { useState, type ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog.tsx'
import { cn } from '../../lib/utils.ts'

export function ModalFrame({
  title,
  children,
  onClose,
  className,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  className?: string
}) {
  const [open, setOpen] = useState(true)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn('max-w-xl', className)}>
        <DialogHeader>
          <DialogTitle className="text-[#6d3c72] text-lg font-bold">{title}</DialogTitle>
        </DialogHeader>
        <div className="h-px bg-[#e8e4e6]" />
        {children}
      </DialogContent>
    </Dialog>
  )
}
