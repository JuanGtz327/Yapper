import { useState, useRef, useEffect, useCallback } from 'react'

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
  const [open, setOpen] = useState(false)
  const [focusIdx, setFocusIdx] = useState(-1)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selected = options.find((o) => o.value === value)
  const label = selected?.label ?? placeholder

  const close = useCallback(() => {
    setOpen(false)
    setFocusIdx(-1)
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !listRef.current?.contains(e.target as Node)
      ) {
        close()
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open, close])

  useEffect(() => {
    if (open && focusIdx >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]')
      items[focusIdx]?.scrollIntoView({ block: 'nearest' })
    }
  }, [open, focusIdx])

  const selectOption = (val: string) => {
    onChange(val)
    close()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === ' ')) {
      e.preventDefault()
      setOpen(true)
      setFocusIdx(0)
      return
    }
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusIdx((prev) => Math.min(prev + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusIdx((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && focusIdx >= 0) {
      e.preventDefault()
      selectOption(options[focusIdx].value)
    }
  }

  return (
    <div className={`custom-select${open ? ' custom-select--open' : ''} ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className={`custom-select-trigger${!selected ? ' custom-select-trigger--placeholder' : ''}`}
        disabled={disabled}
        aria-label={ariaLabel}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev)
        }}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {label}
      </button>
      {open && (
        <ul
          ref={listRef}
          className="custom-select-dropdown"
          role="listbox"
          tabIndex={-1}
        >
          {options.map((opt, idx) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`custom-select-option${opt.value === value ? ' custom-select-option--selected' : ''}${idx === focusIdx ? ' custom-select-option--focused' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault()
                selectOption(opt.value)
              }}
              onMouseEnter={() => setFocusIdx(idx)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
