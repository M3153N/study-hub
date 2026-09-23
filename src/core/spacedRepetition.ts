import type { ReviewState } from './types';

export type RecallGrade = 'again' | 'hard' | 'good' | 'easy';
const day = 86_400_000;

// Variante conservadora de SM-2. Solo se ejecuta al confirmar una respuesta;
// abrir pantallas, recargar o reanudar no cambia fechas ni intervalos.
export function scheduleReview(questionId: string, previous: ReviewState | undefined, grade: RecallGrade, now = Date.now()): ReviewState {
  const current = previous ?? { questionId, intervalDays: 0, ease: 2.3, repetitions: 0, dueAt: now, lastReviewedAt: 0, status: 'learning' as const };
  const factors = { again: .25, hard: .75, good: 1, easy: 1.35 };
  const easeDelta = { again: -.2, hard: -.08, good: 0, easy: .12 };
  const repetitions = grade === 'again' ? 0 : current.repetitions + 1;
  let intervalDays = grade === 'again' ? 1 : repetitions === 1 ? 2 : repetitions === 2 ? 5 : Math.max(1, Math.round(Math.max(current.intervalDays, 5) * current.ease * factors[grade]));
  const ease = Math.max(1.3, Math.min(3, current.ease + easeDelta[grade]));
  const status = repetitions >= 4 && intervalDays >= 21 ? 'mastered' : repetitions >= 1 ? 'review' : 'learning';
  return { questionId, intervalDays, ease, repetitions, dueAt: now + intervalDays * day, lastReviewedAt: now, status };
}

export function reviewBuckets(review: Record<string, ReviewState>, questionIds: string[], now = Date.now()) {
  const states = questionIds.map(id => review[id]);
  return {
    newIds: questionIds.filter(id => !review[id]),
    dueIds: questionIds.filter(id => review[id] && review[id].dueAt <= now),
    masteredIds: questionIds.filter(id => review[id]?.status === 'mastered'),
    reinforcementIds: questionIds.filter(id => review[id]?.status === 'learning'),
    upcoming: states.filter(Boolean).filter(state => state.dueAt > now).sort((a,b)=>a.dueAt-b.dueAt),
  };
}
