export type AccessibilityAnswer = 'yes' | 'no' | 'unsure';
export type AccessibilityAssessment = Partial<Record<string, AccessibilityAnswer>>;

export const accessibilityQuestions = [
  { key: 'step_free_route', label: 'Existe uma rota acessível, sem degraus, até as áreas abertas ao público?' },
  { key: 'accessible_entrance', label: 'A entrada principal pode ser usada por pessoas com mobilidade reduzida?' },
  { key: 'access_ramp', label: 'Há rampa de acesso onde existe desnível no percurso?' },
  { key: 'adapted_restroom', label: 'Há banheiro acessível disponível para visitantes?' },
  { key: 'accessible_parking', label: 'Há vaga reservada e rota acessível entre a vaga e a entrada?' },
  { key: 'guide_dog', label: 'Pessoas com deficiência visual podem entrar com cão-guia?' },
  { key: 'tactile_signage', label: 'Há sinalização tátil ou orientação acessível para circulação?' },
  { key: 'braille_information', label: 'Há informação importante disponível em Braille ou formato tátil?' },
  { key: 'libras_support', label: 'Há atendimento em Libras ou recurso de comunicação equivalente?' },
  { key: 'accessible_website', label: 'O site e os canais digitais oferecem informações acessíveis sobre a visita?' },
  { key: 'accessible_service', label: 'A equipe está preparada para oferecer atendimento inclusivo e respeitoso?' },
  { key: 'quiet_space', label: 'Existe espaço tranquilo para pessoas que precisem reduzir estímulos?' },
  { key: 'asd_friendly_space', label: 'Há recursos ou espaços adequados para acolher pessoas autistas?' },
  { key: 'sensory_support', label: 'São informados previamente ruídos, iluminação ou outros estímulos sensoriais relevantes?' },
  { key: 'staff_training', label: 'A equipe recebe orientação sobre acessibilidade e atendimento a pessoas com deficiência?' },
] as const;

export function accessibilityScore(assessment: AccessibilityAssessment): number | null {
  const answers = Object.values(assessment).filter((answer) => answer === 'yes' || answer === 'no');
  if (!answers.length) return null;
  return Math.round((answers.filter((answer) => answer === 'yes').length / answers.length) * 100);
}

export function accessibilityLevel(score: number | null): string {
  if (score === null) return 'Sem dados';
  return score < 40 ? 'Inicial' : score < 70 ? 'Intermediário' : 'Avançado';
}
