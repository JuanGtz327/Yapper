import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      className={cn(
        'h-10 w-full min-w-0 rounded-lg border border-input bg-white px-2.5 py-1 text-sm font-semibold outline-none placeholder:text-muted-foreground placeholder:font-normal focus:border-ring focus:ring-1 focus:ring-ring/30 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
