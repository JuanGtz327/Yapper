export type SelectOption = { value: string; label: string }

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export const filterOptions = (options: SelectOption[], query: string) => {
  const normalized = normalize(query.trim())
  if (!normalized) return options
  return options.filter((option) =>
    normalize(option.label).includes(normalized),
  )
}
