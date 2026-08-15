import { useState } from 'react'
import { Search } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select.tsx'
import { filterOptions, type SelectOption } from '../../lib/filterOptions.ts'

export function CustomSelect({
  value,
  options,
  placeholder = 'Seleccionar...',
  disabled = false,
  className = '',
  ariaLabel,
  searchable = false,
  label,
  onChange,
}: {
  value: string
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  ariaLabel?: string
  searchable?: boolean
  label?: string
  onChange: (value: string) => void
}) {
  const [query, setQuery] = useState('')
  const filtered = searchable ? filterOptions(options, query) : options
  const selectItems = filtered.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }))

  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v) onChange(v)
      }}
      onOpenChange={(open) => {
        if (!open) setQuery('')
      }}
      disabled={disabled}
      items={selectItems}
    >
      {label ? (
        <div className="relative">
          <SelectTrigger className={className} aria-label={ariaLabel}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <span className="pointer-events-none absolute top-[-7px] left-3 bg-white px-1 text-[10px] font-bold text-[#716b72]">
            {label}
          </span>
        </div>
      ) : (
        <SelectTrigger className={className} aria-label={ariaLabel}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      )}
      <SelectContent>
        {searchable && (
          <div className="flex items-center gap-2 border-b border-border px-2.5 py-2">
            <Search
              size={14}
              className="shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
              placeholder="Buscar..."
              aria-label="Buscar opción"
              className="w-full min-w-0 border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        )}
        {filtered.length > 0 ? (
          filtered.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} label={opt.label}>
              {opt.label}
            </SelectItem>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            Sin resultados
          </div>
        )}
      </SelectContent>
    </Select>
  )
}
