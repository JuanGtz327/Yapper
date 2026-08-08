import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

export function Button({
  variant = 'primary',
  icon,
  size = 'md',
  className = '',
  children,
  ...props
}: {
  variant?: ButtonVariant
  icon?: ReactNode
  size?: 'sm' | 'md'
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const isIconOnly = !children && icon
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : '',
    isIconOnly ? 'btn-icon-only' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} {...props}>
      {icon && <span className="btn-icon">{icon}</span>}
      {children && <span className="btn-label">{children}</span>}
    </button>
  )
}
