export type AccessibilityAnswer = 'yes' | 'no' | 'unsure';
export type AccessibilityAssessment = Partial<Record<string, AccessibilityAnswer>>;

export const accessibilityQuestions = [
  { key: 'step_free_route', label: 'Há um caminho contínuo, sem degraus, da calçada ou vaga até a entrada e as áreas abertas aos visitantes?' },
  { key: 'accessible_entrance', label: 'A entrada permite a passagem de cadeira de rodas e de pessoas com mobilidade reduzida, sem barreiras difíceis de transpor?' },
  { key: 'access_ramp', label: 'Nos desníveis do percurso, há rampa firme e segura para chegar às áreas de atendimento e visita?' },
  { key: 'adapted_restroom', label: 'Há banheiro acessível aos visitantes, com espaço de circulação e apoios necessários?' },
  { key: 'accessible_parking', label: 'Há vaga reservada e sinalizada, ligada à entrada por uma rota acessível?' },
  { key: 'guide_dog', label: 'A pessoa pode permanecer com seu cão-guia nas áreas abertas ao público?' },
  { key: 'tactile_signage', label: 'Há sinalização tátil ou piso tátil que ajude pessoas cegas ou com baixa visão a se orientar?' },
  { key: 'braille_information', label: 'Informações importantes, como cardápio, orientações e avisos, estão disponíveis em Braille ou formato tátil?' },
  { key: 'libras_support', label: 'É possível receber atendimento em Libras ou por outro recurso de comunicação acessível?' },
  { key: 'accessible_website', label: 'Os canais digitais informam como chegar, quais recursos de acessibilidade existem e como pedir apoio?' },
  { key: 'accessible_service', label: 'A equipe oferece ajuda respeitando a autonomia e as preferências de cada visitante?' },
  { key: 'quiet_space', label: 'Há um local tranquilo onde visitantes possam fazer uma pausa quando precisarem?' },
  { key: 'asd_friendly_space', label: 'Há recursos ou um espaço preparado para acolher pessoas autistas?' },
  { key: 'sensory_support', label: 'Antes da visita, é possível saber sobre ruídos, iluminação, lotação ou outros estímulos sensoriais?' },
  { key: 'staff_training', label: 'A equipe recebe orientação para atender pessoas com diferentes deficiências e necessidades de acesso?' },
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
