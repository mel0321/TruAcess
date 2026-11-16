export const placeCategories = [
  { value: 'ACCOMMODATION', label: 'Hospedagem' },
  { value: 'GASTRONOMY', label: 'Gastronomia' },
  { value: 'TOURIST_ATTRACTION', label: 'Atrações turísticas' },
  { value: 'OTHERS', label: 'Outros' },
] as const;

const categoryLabels = Object.fromEntries(
  placeCategories.map(({ value, label }) => [value, label]),
) as Record<string, string>;

export function getPlaceCategoryLabel(category: string): string {
  return categoryLabels[category] || category;
}
