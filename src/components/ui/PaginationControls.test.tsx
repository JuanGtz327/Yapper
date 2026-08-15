import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PaginationControls } from './PaginationControls.tsx'

describe('PaginationControls', () => {
  it('keeps the result count and hides navigation for one page', () => {
    render(
      <PaginationControls
        page={1}
        total={25}
        totalPages={1}
        onPageChange={vi.fn()}
      />,
    )
    expect(screen.getByText('25 resultados')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Página siguiente' }),
    ).not.toBeInTheDocument()
  })

  it('shows navigation beside the result count when there are more pages', () => {
    render(
      <PaginationControls
        page={1}
        total={27}
        totalPages={2}
        onPageChange={vi.fn()}
      />,
    )
    expect(screen.getByText('27 resultados')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Página siguiente' }),
    ).toBeInTheDocument()
  })
})
