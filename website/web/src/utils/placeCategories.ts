export const placeCategories = [
  { value: 'ACCOMMODATION', label: 'Hospedagem' },
  { value: 'GASTRONOMY', label: 'Gastronomia' },
  { value: 'TOURIST_ATTRACTION', label: 'Atrações turísticas' },
  { value: 'SHOPPING', label: 'Compras' },
  { value: 'HEALTH', label: 'Saúde e bem-estar' },
  { value: 'TRANSPORT', label: 'Transporte' },
  { value: 'EDUCATION', label: 'Educação' },
  { value: 'ENTERTAINMENT', label: 'Entretenimento' },
  { value: 'SPORTS', label: 'Esportes e lazer' },
  { value: 'RELIGIOUS_SITE', label: 'Espaços religiosos' },
  { value: 'PUBLIC_SERVICE', label: 'Serviços públicos' },
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
    { value: 'OTHER_SERVICE', label: 'Outro serviço' },
  ],
  SHOPPING: [
    { value: 'SHOPPING_MALL', label: 'Shopping center' },
    { value: 'STORE', label: 'Loja' },
    { value: 'MARKET', label: 'Mercado' },
    { value: 'FAIR', label: 'Feira' },
  ],
  HEALTH: [
    { value: 'CLINIC', label: 'Clínica' },
    { value: 'HOSPITAL', label: 'Hospital' },
    { value: 'PHARMACY', label: 'Farmácia' },
    { value: 'WELLNESS', label: 'Bem-estar' },
  ],
  TRANSPORT: [
    { value: 'AIRPORT', label: 'Aeroporto' },
    { value: 'BUS_STATION', label: 'Terminal rodoviário' },
    { value: 'TRAIN_STATION', label: 'Estação de trem/metrô' },
    { value: 'PORT', label: 'Porto' },
  ],
  EDUCATION: [
    { value: 'SCHOOL', label: 'Escola' },
    { value: 'UNIVERSITY', label: 'Universidade' },
    { value: 'LIBRARY', label: 'Biblioteca' },
  ],
  ENTERTAINMENT: [
    { value: 'CINEMA', label: 'Cinema' },
    { value: 'THEATER', label: 'Teatro' },
    { value: 'CONCERT_HALL', label: 'Casa de shows' },
    { value: 'EVENT_VENUE', label: 'Espaço de eventos' },
  ],
  SPORTS: [
    { value: 'STADIUM', label: 'Estádio' },
    { value: 'GYM', label: 'Academia' },
    { value: 'SPORTS_CENTER', label: 'Centro esportivo' },
  ],
  RELIGIOUS_SITE: [
    { value: 'CHURCH', label: 'Igreja' },
    { value: 'TEMPLE', label: 'Templo' },
    { value: 'OTHER_RELIGIOUS_SITE', label: 'Outro espaço religioso' },
  ],
  PUBLIC_SERVICE: [
    { value: 'GOVERNMENT_OFFICE', label: 'Órgão público' },
    { value: 'POST_OFFICE', label: 'Correios' },
    { value: 'CITIZEN_SERVICE', label: 'Atendimento ao cidadão' },
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
