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
  const selectItems = options.map((opt) => ({ value: opt.value, label: opt.label }))

  return (
    <Select value={value} onValueChange={(v) => { if (v) onChange(v) }} disabled={disabled} items={selectItems}>
      <SelectTrigger
        className={className}
        aria-label={ariaLabel}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} label={opt.label}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
