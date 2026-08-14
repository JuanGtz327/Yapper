import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select.tsx'

type Option = { value: string; label: string }

export function CustomSelect({
  value,
  options,
  placeholder = 'Seleccionar...',
  disabled = false,
  className = '',
  ariaLabel,
  onChange,
}: {
  value: string
  options: Option[]
  placeholder?: string
  disabled?: boolean
  className?: string
  ariaLabel?: string
  onChange: (value: string) => void
}) {
  return (
    <Select value={value} onValueChange={(v) => { if (v) onChange(v) }} disabled={disabled}>
      <SelectTrigger
        className={className}
        aria-label={ariaLabel}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
