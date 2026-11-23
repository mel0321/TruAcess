export type ReviewAccessibilityAnswer = 'yes' | 'partially' | 'no' | 'not_applicable';
export type ReviewAccessibilityDetails = Partial<Record<string, ReviewAccessibilityAnswer>>;

export const reviewAccessibilityQuestions = [
  { key: 'access_route', label: 'Na sua visita, você conseguiu sair da calçada ou vaga, entrar e chegar aos espaços que precisava?' },
  { key: 'entrance_access', label: 'A porta, os desníveis e a entrada permitiram que você entrasse e saísse com autonomia?' },
  { key: 'accessible_facilities', label: 'Você conseguiu usar as áreas e instalações de que precisava, como balcão, mesas ou assentos?' },
  { key: 'restroom_access', label: 'Se precisou usar o banheiro, conseguiu chegar e utilizá-lo com segurança e autonomia?' },
  { key: 'communication', label: 'Você conseguiu acessar as informações e se comunicar da forma necessária durante a visita?' },
  { key: 'staff_support', label: 'Quando precisou de apoio, a equipe ouviu você, respeitou sua autonomia e ajudou adequadamente?' },
  { key: 'guide_dog_access', label: 'Se estava com cão-guia, ele pôde acompanhar você nas áreas abertas ao público?' },
  { key: 'sensory_comfort', label: 'Ruídos, iluminação, cheiros e lotação foram confortáveis para você durante a visita?' },
] as const;

export const reviewAccessibilityAnswerOptions: Array<{ value: ReviewAccessibilityAnswer; label: string }> = [
  { value: 'yes', label: 'Sim' },
  { value: 'partially', label: 'Em parte' },
  { value: 'no', label: 'Não' },
  { value: 'not_applicable', label: 'Não se aplica / não consegui avaliar' },
];

export function reviewAccessibilityAnswerLabel(answer: ReviewAccessibilityAnswer): string {
  return reviewAccessibilityAnswerOptions.find((option) => option.value === answer)?.label || answer;
}
