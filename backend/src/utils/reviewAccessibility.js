import { AppError } from '../middlewares/error.middleware.js';
import { REVIEW_ACCESSIBILITY_QUESTION_KEYS } from './placeAccessibility.js';

const VALID_ANSWERS = ['yes', 'partially', 'no', 'not_applicable'];

export function parseReviewAccessibilityDetails(value) {
  if (value === undefined || value === null || value === '') return null;

  let details = value;
  if (typeof value === 'string') {
    try {
      details = JSON.parse(value);
    } catch {
      throw new AppError('Respostas de acessibilidade da avaliação são inválidas.', 400);
    }
  }

  if (typeof details !== 'object' || Array.isArray(details)) {
    throw new AppError('Respostas de acessibilidade da avaliação são inválidas.', 400);
  }

  for (const [key, answer] of Object.entries(details)) {
    if (!REVIEW_ACCESSIBILITY_QUESTION_KEYS.includes(key) || !VALID_ANSWERS.includes(answer)) {
      throw new AppError(`Resposta inválida na avaliação de acessibilidade: ${key}.`, 400);
    }
  }

  return details;
}

export function formatReviewAccessibilityDetails(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new AppError('Não foi possível ler as respostas de acessibilidade desta avaliação.', 500);
  }
}
