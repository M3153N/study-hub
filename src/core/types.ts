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
export type CourseIcon = 'orbit' | 'shield' | 'prism';
export interface CourseTheme {
  primary: string;
  secondary: string;
  glow: string;
  icon: CourseIcon;
  motif: 'grid' | 'circuit' | 'rays';
}
export interface ConceptNode { id: string; label: string; detail: string; parentId?: string; }
export interface ConceptMap { id: string; title: string; description: string; nodes: ConceptNode[]; }
export interface Comparison { id: string; title: string; columns: string[]; rows: string[][]; }
export interface Lesson { id: string; title: string; summary: string; duration: string; sections: { title: string; body: string }[]; }
export interface Flashcard { id: string; front: string; back: string; }
export interface Formula { id: string; name: string; expression: string; description: string; }
export interface StudyTip { id: string; title: string; body: string; }
export interface StudyResources {
  maps: ConceptMap[];
  comparisons: Comparison[];
  lessons: Lesson[];
  flashcards: Flashcard[];
  formulas: Formula[];
  tips: StudyTip[];
}
export interface CertificationPack {
  id: string;
  shortTitle: string;
  title: string;
  subtitle: string;
  description: string;
  accent: string;
  accentSoft: string;
  theme: CourseTheme;
  questions: Question[];
  glossary: GlossaryEntry[];
  resources: StudyResources;
}
export type QuizMode = 'random' | 'linear';
export type QuestionPool = 'all' | 'new' | 'mistakes';
export interface PracticeFilters {
  pool: QuestionPool;
  domain: string;
  topic: string;
  difficulty: Difficulty | 'all';
}
export interface SessionState {
  id: string;
  mode: QuizMode;
  difficulty: Difficulty | null;
  questionIds: string[];
  position: number;
  answers: Record<string, Choice>;
  startedAt: number;
  source?: 'practice' | 'simulation';
  filters?: PracticeFilters;
}
export interface AnswerRecord {
  id: string;
  courseId: string;
  sessionId: string;
  questionId: string;
  selected: Choice;
  correct: boolean;
  answeredAt: number;
  mode: QuizMode;
  source: 'practice' | 'simulation';
  xp: number;
  wasNew: boolean;
  reviewedError: boolean;
}
export interface SessionResult {
  id: string;
  completedAt: number;
  questionIds: string[];
  answers: Record<string, Choice>;
  correct: number;
  newUnique: number;
  earnedXp: number;
  unlocked: string[];
  completedChallenges: string[];
  rankUnlocked?: string;
  source: 'practice' | 'simulation';
  mode: QuizMode;
}
export interface AchievementState { unlockedAt?: number; progress: number; target: number; }
export interface Progress {
  answered: number;
  correct: number;
  linear: Record<Difficulty, number>;
  mistakes: Record<string, number>;
  activeSession?: SessionState;
  attempts: AnswerRecord[];
  sessions: SessionResult[];
  xp: number;
  achievements: Record<string, AchievementState>;
  rewardedQuestions: string[];
  improvedQuestions: string[];
  rewardedSessions: string[];
  legacyIncomplete: boolean;
  lastResult?: SessionResult;
}
export interface StudyProgress {
  version: 3;
  courses: Record<string, Progress>;
}
export const levels: Difficulty[] = ['basico', 'intermedio', 'avanzado'];
export const levelNames: Record<Difficulty, string> = { basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado' };
export const blankProgress = (): Progress => ({
  answered: 0, correct: 0,
  linear: { basico: 0, intermedio: 0, avanzado: 0 }, mistakes: {},
  attempts: [], sessions: [], xp: 0, achievements: {}, rewardedQuestions: [],
  improvedQuestions: [], rewardedSessions: [], legacyIncomplete: false,
});
export function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
