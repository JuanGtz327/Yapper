import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProductCreatePage } from './ProductCreatePage'
import type { Product } from '../../types.ts'
import type { ProductDraft } from './validateProductDraft.ts'

const optionTypes = [
  {
    id: 'ot1',
    name: 'Color',
    values: [
      { id: 'ov_green', name: 'Verde' },
      { id: 'ov_blue', name: 'Azul' },
      { id: 'ov_red', name: 'Rojo' },
    ],
  },
  {
    id: 'ot2',
    name: 'Capacidad',
    values: [
      { id: 'ov_1l', name: '1L' },
      { id: 'ov_2l', name: '2L' },
    ],
  },
]

const productWithVariants: Product = {
  id: 'p1',
  name: 'Botella',
  category: 'General',
  categoryId: null,
  published: false,
  publicDescription: '',
  imageUrl: null,
  color: 'sky',
  variants: [
    {
      id: 'v1',
      productId: 'p1',
      sku: 'BOT-V1',
      name: ' Verde 1L',
      inventoryCost: 50,
      salePrice: 100,
      stock: 10,
      optionValues: [
        { optionType: 'Color', value: 'Verde' },
        { optionType: 'Capacidad', value: '1L' },
      ],
    },
    {
      id: 'v2',
      productId: 'p1',
      sku: 'BOT-V2',
      name: ' Azul',
      inventoryCost: 50,
      salePrice: 100,
      stock: 10,
      optionValues: [
        { optionType: 'Color', value: 'Azul' },
      ],
    },
  ],
}

describe('Variant options isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('variant A options should persist after saving variant B with new options', async () => {
    const user = userEvent.setup()
    let submittedDraft: ProductDraft | null = null
    const onSubmit = vi.fn().mockImplementation((draft: ProductDraft) => {
      submittedDraft = draft
      return Promise.resolve(true)
    })

    render(
      <ProductCreatePage
        {...defaultProps}
        initial={productWithVariants}
        optionTypes={optionTypes}
        onSubmit={onSubmit}
      />,
    )

    // 1. Open modal for variant A, verify its options load correctly
    await user.click(screen.getByLabelText('Editar variante BOT-V1'))
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Editar variante' })).toBeInTheDocument()
    })

    // Variant A should show Verde and 1L
    const modalA = screen.getByRole('dialog')
    const triggersA = modalA.querySelectorAll('.custom-select-trigger')
    const textsA = Array.from(triggersA).map((t) => t.textContent)
    expect(textsA.some((t) => t?.includes('Verde'))).toBe(true)
    expect(textsA.some((t) => t?.includes('1L'))).toBe(true)

    // Close modal (keep selections as-is)
    const cancelBtnA = modalA.querySelector('.cancel-button')!
    await user.click(cancelBtnA)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    // 2. Open modal for variant B, add a Red option, save
    await user.click(screen.getByLabelText('Editar variante BOT-V2'))
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Editar variante' })).toBeInTheDocument()
    })

    // Add a new option selection
    await user.click(screen.getByText('Agregar opción'))
    // Select Color type
    const modalB = screen.getByRole('dialog')
    const typeTriggers = modalB.querySelectorAll('.custom-select-trigger')
    // First trigger after existing ones should be "Tipo..."
    const tipoTrigger = Array.from(typeTriggers).find(
      (t) => t.textContent?.includes('Tipo'),
    )
    expect(tipoTrigger).toBeDefined()
    await user.click(tipoTrigger!)
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Color' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('option', { name: 'Color' }))

    // Select Rojo value
    await waitFor(() => {
      const valueTriggers = modalB.querySelectorAll('.custom-select-trigger')
      const valorTrigger = Array.from(valueTriggers).find(
        (t) => t.textContent?.includes('Valor'),
      )
      expect(valorTrigger).toBeDefined()
    })
    const valorTrigger = Array.from(
      modalB.querySelectorAll('.custom-select-trigger'),
    ).find((t) => t.textContent?.includes('Valor'))!
    await user.click(valorTrigger)
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Rojo' })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('option', { name: 'Rojo' }))

    // Save variant B
    const submitBtnB = modalB.querySelector('button[type="submit"]')!
    await user.click(submitBtnB)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    // 3. Submit the whole product and check the draft
    const submitBtn = screen.getByText('Guardar cambios')
    await user.click(submitBtn)
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })

    expect(submittedDraft).not.toBeNull()
    const variants = submittedDraft!.variants
    expect(variants).toHaveLength(2)

    // Variant A (index 0) should still have its original option value IDs
    expect(variants[0].sku).toBe('BOT-V1')
    expect(variants[0].optionValueIds).toContain('ov_green')
    expect(variants[0].optionValueIds).toContain('ov_1l')

    // Variant B (index 1) should have its new option
    expect(variants[1].sku).toBe('BOT-V2')
    expect(variants[1].optionValueIds).toContain('ov_red')
  })
})

const defaultProps = {
  categories: [],
  onCategoryCreated: vi.fn(),
  onVariantsChanged: vi.fn(),
  onClose: vi.fn(),
}
