export function PanelHeading({
  title,
  subtitle,
  action,
  onAction,
}: {
  title: string
  subtitle: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h2>{title}</h2>
        <p className="text-muted-foreground text-xs mt-1">{subtitle}</p>
      </div>
      {action && (
        <button
          className="border-0 py-1 text-primary bg-transparent text-xs font-semibold cursor-pointer"
          onClick={onAction}
          type="button"
        >
          {action}
        </button>
      )}
    </div>
  )
}
