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
    <article className="stat-card">
      <div className="stat-heading">
        <span>{label}</span>
        <ArrowUpRight size={17} />
      </div>
      <strong>{value}</strong>
      <small className={positive ? 'positive' : ''}>{detail}</small>
    </article>
  )
}
