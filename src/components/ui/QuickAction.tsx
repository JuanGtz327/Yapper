import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'

const colorMap: Record<string, string> = {
  peach: 'text-[#b06b57] bg-[#f9e5dc]',
  mint: 'text-[#579078] bg-[#dff1e6]',
  lavender: 'text-[#7963a2] bg-[#ece5f7]',
}

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
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 w-full px-3 py-3 border-0 bg-transparent cursor-pointer text-left hover:bg-primary/10 rounded-lg transition-colors"
    >
      <span
        className={`grid place-items-center w-[37px] h-[37px] rounded-[10px] ${colorMap[color] ?? ''}`}
      >
        {icon}
      </span>
      <span className="flex-1">
        <strong className="block text-foreground text-sm font-semibold">
          {title}
        </strong>
        <small className="block text-muted-foreground text-xs mt-0.5">
          {detail}
        </small>
      </span>
      <ArrowUpRight size={17} className="text-muted-foreground" />
    </button>
  )
}
