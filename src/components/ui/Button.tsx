import { type ReactNode } from 'react'
import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"]):size-4 !rounded-lg',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/85',
        outline:
          'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10',
        secondary:
          'bg-[#ffffff] text-[#6d3c72] border border-[#6d3c72]/30 hover:bg-[#6d3c72]/10',
        ghost: 'bg-transparent text-foreground hover:bg-primary hover:text-white',
        destructive:
          'bg-destructive text-white hover:bg-destructive/85',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

const variantMap: Record<ButtonVariant, string> = {
  primary: 'default',
  secondary: 'secondary',
  danger: 'destructive',
  ghost: 'ghost',
}

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
  children?: ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const isIconOnly = !children && !!icon
  const shadcnVariant = variantMap[variant]
  const shadcnSize = size === 'sm' ? 'sm' : 'default'

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        buttonVariants({
          variant: shadcnVariant as VariantProps<typeof buttonVariants>['variant'],
          size: shadcnSize as VariantProps<typeof buttonVariants>['size'],
        }),
        isIconOnly && 'h-8 w-8 px-0',
        className,
      )}
      {...props}
    >
      {icon && <span className={cn('inline-flex shrink-0', !isIconOnly && 'mr-1.5')}>{icon}</span>}
      {children}
    </ButtonPrimitive>
  )
}

export { buttonVariants }
