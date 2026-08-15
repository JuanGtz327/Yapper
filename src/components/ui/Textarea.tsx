import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-semibold outline-none placeholder:text-muted-foreground placeholder:font-normal focus:border-ring focus:ring-1 focus:ring-ring/30 disabled:opacity-50 resize-y',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
