export function Spinner({ label, size = 40 }: { label: string; size?: number }) {
  return (
    <span className="inline-flex items-center gap-3" role="status">
      <span
        className="inline-block border-2 border-primary border-r-transparent rounded-full animate-spin"
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
      <span className="text-muted-foreground text-sm">{label}</span>
    </span>
  )
}
