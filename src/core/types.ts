export type Difficulty = 'basico' | 'intermedio' | 'avanzado';
export type Choice = 0 | 1 | 2 | 3;
export interface Question {
  id: string;
  domain: string;
  topic: string;
  difficulty: Difficulty;
  prompt: string;
  options: [string, string, string, string];
  correct: Choice;
  explanation: string;
}
export interface GlossaryEntry { term: string; definition: string; }
export interface CertificationPack {
  id: string;
  shortTitle: string;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  accentSoft: string;
  questions: Question[];
  glossary: GlossaryEntry[];
}
export type QuizMode = 'random' | 'linear';
export interface SessionState {
  id: string;
  mode: QuizMode;
  difficulty: Difficulty | null;
  questionIds: string[];
  position: number;
  answers: Record<string, Choice>;
  startedAt: number;
}
export interface Progress {
  answered: number;
  correct: number;
  linear: Record<Difficulty, number>;
  mistakes: Record<string, number>;
  activeSession?: SessionState;
}
export interface StudyProgress {
  version: 2;
  courses: Record<string, Progress>;
}
export const levels: Difficulty[] = ['basico', 'intermedio', 'avanzado'];
export const levelNames: Record<Difficulty, string> = { basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado' };
export const blankProgress = (): Progress => ({
  answered: 0, correct: 0,
  linear: { basico: 0, intermedio: 0, avanzado: 0 }, mistakes: {}
});
export function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
