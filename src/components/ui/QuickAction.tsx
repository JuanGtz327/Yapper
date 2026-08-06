import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'

export function QuickAction({
  icon,
  color,
  title,
  detail,
  onClick,
}: {
  icon: ReactNode
  color: string
  title: string
  detail: string
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick}>
      <span className={`action-icon ${color}`}>{icon}</span>
      <span>
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      <ArrowUpRight size={17} />
    </button>
  )
}
