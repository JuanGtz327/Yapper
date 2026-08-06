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
    <div className="panel-heading">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action && (
        <button className="text-button" onClick={onAction} type="button">
          {action}
        </button>
      )}
    </div>
  )
}
