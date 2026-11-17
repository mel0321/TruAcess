export const placeCategories = [
  { value: 'ACCOMMODATION', label: 'Hospedagem' },
  { value: 'GASTRONOMY', label: 'Gastronomia' },
  { value: 'TOURIST_ATTRACTION', label: 'Atrações turísticas' },
  { value: 'OTHERS', label: 'Outros' },
] as const;

export const placeCategoryDetails: Record<string, Array<{ value: string; label: string }>> = {
  ACCOMMODATION: [
    { value: 'HOTEL', label: 'Hotel' },
    { value: 'HOSTEL', label: 'Hostel' },
    { value: 'INN', label: 'Pousada' },
    { value: 'RESORT', label: 'Resort' },
    { value: 'CAMPING', label: 'Camping' },
    { value: 'VACATION_RENTAL', label: 'Aluguel por temporada' },
  ],
  GASTRONOMY: [
    { value: 'RESTAURANT', label: 'Restaurante' },
    { value: 'CAFE', label: 'Café' },
    { value: 'BAR', label: 'Bar' },
    { value: 'BAKERY', label: 'Padaria' },
    { value: 'FOOD_TRUCK', label: 'Food truck' },
  ],
  TOURIST_ATTRACTION: [
    { value: 'MUSEUM', label: 'Museu' },
    { value: 'PARK', label: 'Parque' },
    { value: 'BEACH', label: 'Praia' },
    { value: 'TRAIL', label: 'Trilha' },
    { value: 'CULTURAL_SITE', label: 'Espaço cultural' },
    { value: 'EVENT_VENUE', label: 'Espaço de eventos' },
    { value: 'HISTORIC_SITE', label: 'Ponto histórico' },
  ],
  OTHERS: [
    { value: 'SHOPPING', label: 'Compras' },
    { value: 'HEALTH', label: 'Saúde e bem-estar' },
    { value: 'TRANSPORT', label: 'Transporte' },
    { value: 'PUBLIC_SERVICE', label: 'Serviço público' },
    { value: 'OTHER_SERVICE', label: 'Outro serviço' },
  ],
};

const categoryLabels = Object.fromEntries(
  placeCategories.map(({ value, label }) => [value, label]),
) as Record<string, string>;

const categoryDetailLabels = Object.fromEntries(
  Object.values(placeCategoryDetails).flat().map(({ value, label }) => [value, label]),
) as Record<string, string>;

export function getPlaceCategoryLabel(category: string): string {
  return categoryLabels[category] || category;
}

export function getPlaceCategoryDetailLabel(categoryDetail?: string | null): string {
  if (!categoryDetail) return '';
  return categoryDetailLabels[categoryDetail] || categoryDetail;
}
