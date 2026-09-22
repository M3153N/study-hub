import type { AchievementState, Progress, Question } from './types';

export const ranks = [
  { name: 'Explorador', xp: 0 }, { name: 'Aprendiz', xp: 100 },
  { name: 'Analista', xp: 250 }, { name: 'Estratega', xp: 500 },
  { name: 'Especialista', xp: 900 }, { name: 'Maestro', xp: 1500 },
];

export const achievementCatalog = [
  { id: 'first-session', title: 'Primer paso', description: 'Completá tu primera sesión.', target: 1 },
  { id: 'ten-unique', title: 'Mente curiosa', description: 'Respondé 10 preguntas únicas.', target: 10 },
  { id: 'error-recovery', title: 'Segunda oportunidad', description: 'Corregí una pregunta que antes respondiste mal.', target: 1 },
  { id: 'coverage-50', title: 'Medio camino', description: 'Alcanzá 50% de cobertura del banco.', target: 50 },
  { id: 'coverage-100', title: 'Mapa completo', description: 'Respondé todo el banco disponible.', target: 100 },
] as const;

export function rankFor(xp: number) {
  let index = 0;
  ranks.forEach((rank, candidate) => { if (xp >= rank.xp) index = candidate; });
  return { current: ranks[index], next: ranks[index + 1], index };
}

export function uniqueSeen(progress: Progress) { return new Set(progress.attempts.map(attempt => attempt.questionId)); }

export function refreshAchievements(progress: Progress, questions: Question[], now: number) {
  const seen = uniqueSeen(progress).size;
  const coverage = questions.length ? Math.round(seen / questions.length * 100) : 0;
  const values: Record<string, number> = {
    'first-session': progress.sessions.length,
    'ten-unique': seen,
    'error-recovery': progress.improvedQuestions.length,
    'coverage-50': coverage,
    'coverage-100': coverage,
  };
  const achievements = { ...progress.achievements };
  const unlocked: string[] = [];
  for (const item of achievementCatalog) {
    const existing = achievements[item.id];
    const achieved = values[item.id] >= item.target;
    if (achieved && !existing?.unlockedAt) unlocked.push(item.id);
    achievements[item.id] = { progress: Math.min(values[item.id], item.target), target: item.target, unlockedAt: existing?.unlockedAt ?? (achieved ? now : undefined) } satisfies AchievementState;
  }
  return { achievements, unlocked };
}

export function breakdown(progress: Progress, questions: Question[], field: 'domain' | 'topic' | 'difficulty') {
  const byId = new Map(questions.map(question => [question.id, question]));
  const result = new Map<string, { attempts: number; correct: number; unique: Set<string>; total: number }>();
  for (const question of questions) {
    const key = question[field];
    const current = result.get(key) ?? { attempts: 0, correct: 0, unique: new Set<string>(), total: 0 };
    current.total += 1; result.set(key, current);
  }
  for (const attempt of progress.attempts) {
    const question = byId.get(attempt.questionId); if (!question) continue;
    const current = result.get(question[field])!;
    current.attempts += 1; current.correct += Number(attempt.correct); current.unique.add(question.id);
  }
  return [...result.entries()].map(([label, value]) => ({ label, attempts: value.attempts, correct: value.correct, unique: value.unique.size, total: value.total, accuracy: value.attempts ? Math.round(value.correct / value.attempts * 100) : null, coverage: value.total ? Math.round(value.unique.size / value.total * 100) : 0 }));
}
