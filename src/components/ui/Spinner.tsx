export function Spinner({ label }: { label: string }) {
  return (
    <span className="loading-inline" role="status">
      <span className="spinner" aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </span>
  )
}
