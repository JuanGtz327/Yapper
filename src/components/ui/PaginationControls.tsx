import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button.tsx'

export function PaginationControls({
  page,
  totalPages,
  total,
  isFetching = false,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  isFetching?: boolean
  onPageChange: (page: number) => void
}) {
  return (
    <div className="flex items-center gap-3 ml-auto shrink-0 text-muted-foreground text-[11px] max-[650px]:ml-0 max-[650px]:justify-between">
      <span aria-live="polite">
        {total} {total === 1 ? 'resultado' : 'resultados'}
        {isFetching && (
          <span
            className="inline-block align-[-2px] ml-2 w-3.5 h-3.5 border-2 border-primary border-r-transparent rounded-full animate-spin"
            role="status"
            aria-label="Actualizando resultados"
          />
        )}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1 || isFetching}
            onClick={() => onPageChange(page - 1)}
            aria-label="Página anterior"
          >
            <ChevronLeft size={14} aria-hidden="true" />
            Anterior
          </Button>
          <span aria-label={`Página ${page} de ${totalPages}`}>
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages || isFetching}
            onClick={() => onPageChange(page + 1)}
            aria-label="Página siguiente"
          >
            Siguiente
            <ChevronRight size={14} aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  )
}
