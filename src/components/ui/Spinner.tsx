export function Spinner({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center mr-1.5" role="status">
      <span
        className="inline-block w-[15px] h-[15px] border-2 border-primary border-r-transparent rounded-full animate-spin"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
