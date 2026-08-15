import { cn } from '@/lib/utils'

function Checkbox({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type="checkbox"
      className={cn(
        'h-3.5 w-3.5 shrink-0 rounded-[4px] border border-[#c9c5ca] accent-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export { Checkbox }
