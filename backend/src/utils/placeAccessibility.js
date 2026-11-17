import { AppError } from '../middlewares/error.middleware.js';

export const ACCESSIBILITY_QUESTION_KEYS = [
  'step_free_route',
  'accessible_entrance',
  'access_ramp',
  'adapted_restroom',
  'accessible_parking',
  'guide_dog',
  'tactile_signage',
  'braille_information',
  'libras_support',
  'accessible_website',
  'accessible_service',
  'quiet_space',
  'asd_friendly_space',
  'sensory_support',
  'staff_training'
];

const LEGACY_ACCESSIBILITY_FIELDS = {
  has_access_ramp: 'access_ramp',
  has_adapted_bathroom: 'adapted_restroom',
  allows_guide_dog: 'guide_dog',
  has_braille_signage: 'braille_information',
  has_sign_language_interpreter: 'libras_support',
  has_asd_friendly_space: 'asd_friendly_space'
};

export function parseAccessibilityAssessment(value) {
  if (value === undefined || value === null || value === '') return null;

  let assessment = value;
  if (typeof value === 'string') {
    try {
      assessment = JSON.parse(value);
    } catch {
      throw new AppError('Questionário de acessibilidade inválido.', 400);
    }
  }

  if (typeof assessment !== 'object' || Array.isArray(assessment)) {
    throw new AppError('Questionário de acessibilidade inválido.', 400);
  }

  const normalized = {};
  for (const [key, answer] of Object.entries(assessment)) {
    if (!ACCESSIBILITY_QUESTION_KEYS.includes(key) || !['yes', 'no', 'unsure'].includes(answer)) {
      throw new AppError(`Resposta inválida no questionário de acessibilidade: ${key}.`, 400);
    }
    normalized[key] = answer;
  }
  return normalized;
}

export function assessmentScore(assessment) {
  if (!assessment) return null;
  const answers = Object.values(assessment).filter((answer) => answer === 'yes' || answer === 'no');
  if (answers.length === 0) return null;
  return Math.round((answers.filter((answer) => answer === 'yes').length / answers.length) * 100);
}

export function accessibilitySummary(assessment, reviewAverage, reviewCount) {
  const questionnaireScore = assessmentScore(assessment);
  const travelerScore = reviewCount > 0 && reviewAverage !== null && reviewAverage !== undefined
    ? Math.round(((Number(reviewAverage) - 1) / 4) * 100)
    : null;

  let score = null;
  if (questionnaireScore !== null && travelerScore !== null) {
    score = Math.round((questionnaireScore + travelerScore) / 2);
  } else {
    score = questionnaireScore ?? travelerScore;
  }

  return {
    questionnaire_score: questionnaireScore,
    traveler_accessibility_score: travelerScore,
    accessibility_score: score,
    accessibility_level: score === null
      ? null
      : score < 40 ? 'INITIAL' : score < 70 ? 'INTERMEDIATE' : 'ADVANCED'
  };
}

export function legacyAccessibilityFlags(assessment) {
  return Object.fromEntries(
    Object.entries(LEGACY_ACCESSIBILITY_FIELDS).map(([field, key]) => [
      field,
      assessment?.[key] === 'yes' ? 1 : 0
    ])
  );
}

export function formatAccessibilityAssessment(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new AppError('Não foi possível ler a avaliação de acessibilidade deste local.', 500);
  }
}
