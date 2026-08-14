import { ArrowUpRight } from 'lucide-react'

export function Stat({
  label,
  value,
  detail,
  positive = false,
}: {
  label: string
  value: string
  detail: string
  positive?: boolean
}) {
  return (
    <article className="border border-border rounded-xl bg-sidebar p-5">
      <div className="flex justify-between text-muted text-xs mb-4">
        <span>{label}</span>
        <ArrowUpRight size={17} className="text-muted-foreground" />
      </div>
      <strong className="block text-foreground text-[27px] tracking-tight font-bold">{value}</strong>
      <small className={`text-xs ${positive ? 'text-green-600' : 'text-muted-foreground'}`}>{detail}</small>
    </article>
  )
}
