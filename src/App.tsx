import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { certifications, getCertification } from './certifications';
import { Icon, type IconName } from './components/Icons';
import { ResourceView, type ResourceKind } from './components/StudyResources';
import { GameHome, type HomeMetric, type HomeStyle } from './components/GameHome';
import { ProfileView } from './components/ProfileView';
import { ConceptIcon } from './components/ConceptIcons';
import { CampaignView } from './components/CampaignView';
import { ExamView } from './components/ExamView';
import { useCourseProgress } from './core/progress';
import { useLocalProfile } from './core/profile';
import { reviewBuckets, scheduleReview, type RecallGrade } from './core/spacedRepetition';
import { achievementCatalog, breakdown, rankFor, refreshAchievements, uniqueSeen } from './core/gamification';
import { resolveTheme, themes, type Appearance, type Density, type ThemeId } from './core/themes';
import { levelNames, levels, shuffle, type AnswerRecord, type CampaignNodeDefinition, type Choice, type Difficulty, type ExamResult, type ExamState, type PracticeFilters, type QuizMode, type SessionResult, type SessionState } from './core/types';

type View = 'home' | 'gamehome' | 'profile' | 'campaign' | 'training' | 'exam' | 'exam-results' | 'practice' | 'quiz' | 'results' | 'library' | 'resource' | 'simulations' | 'progress' | 'settings' | 'personalize';
type SessionSize = 5 | 10 | 20 | 'all';
type HomeCategory = 'training' | 'library' | 'tracking';
type ProgressTab = 'summary' | 'levels' | 'mistakes';
type ProgressSection = 'metrics' | 'ranks' | 'achievements';
type SettingsTab = 'appearance' | 'home' | 'accessibility' | 'about';
interface Preferences { version: 3; reducedMotion: boolean; largeText: boolean; themeId: ThemeId; appearance: Appearance; density: Density; homeOrder: string[]; hiddenHome: string[]; focusMode: boolean; homeStyle: HomeStyle; homeMetrics: HomeMetric[]; }
interface InstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>; }

const courseKey = 'study-hub:selected-course:v1';
const preferencesKey = 'study-hub:preferences:v3';
const previousPreferencesKey = 'study-hub:preferences:v2';
const legacyPreferencesKey = 'study-hub:preferences:v1';
const defaultHomeOrder = ['campaign','training','practice','simulations','glossary','maps','comparisons','reading','flashcards','formulas','tips','progress'];
const sizeOptions: SessionSize[] = [5, 10, 20, 'all'];

function initialCourse() {
  const saved = localStorage.getItem(courseKey);
  return certifications.some(course => course.id === saved) ? saved! : 'capm';
}

function initialPreferences(): Preferences {
  const defaults: Preferences = { version: 3, reducedMotion: false, largeText: false, themeId: 'course', appearance: 'auto', density: 'normal', homeOrder: defaultHomeOrder, hiddenHome: [], focusMode: false, homeStyle: 'minimal', homeMetrics: ['xp','rank','accuracy','coverage'] };
  try {
    const saved = localStorage.getItem(preferencesKey);
    if (saved) return { ...defaults, ...JSON.parse(saved) as Partial<Preferences>, version: 3 };
    const previous = localStorage.getItem(previousPreferencesKey);
    if (previous) return { ...defaults, ...JSON.parse(previous) as Partial<Preferences>, version: 3 };
    const legacy = localStorage.getItem(legacyPreferencesKey);
    return legacy ? { ...defaults, ...JSON.parse(legacy) as Partial<Preferences> } : defaults;
  } catch { return defaults; }
}

function ProgressRing({ value, label = 'avance' }: { value: number; label?: string }) {
  return <div className="ring" style={{ '--progress': `${value * 3.6}deg` } as CSSProperties}><span>{value}%</span><small>{label}</small></div>;
}

function App() {
  const [courseId, setCourseId] = useState(initialCourse);
  const [view, setView] = useState<View>('gamehome');
  const [resource, setResource] = useState<ResourceKind>('glossary');
  const [mode, setMode] = useState<QuizMode>('random');
  const [difficulty, setDifficulty] = useState<Difficulty>('basico');
  const [sessionSize, setSessionSize] = useState<SessionSize>(5);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [homeCategory, setHomeCategory] = useState<HomeCategory>('training');
  const [homePage, setHomePage] = useState(0);
  const [progressTab, setProgressTab] = useState<ProgressTab>('summary');
  const [progressSection, setProgressSection] = useState<ProgressSection>('metrics');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('appearance');
  const [filters, setFilters] = useState<PracticeFilters>({ pool: 'all', domain: 'all', topic: 'all', difficulty: 'all' });
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(() => window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [online, setOnline] = useState(navigator.onLine);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const course = getCertification(courseId);
  const { progress, studyProgress, setProgress, reset } = useCourseProgress(courseId);
  const { profile, updateProfile } = useLocalProfile();
  const session = progress.activeSession;
  const current = session ? course.questions.find(question => question.id === session.questionIds[session.position]) : undefined;
  const selected = current && session ? session.answers[current.id] : undefined;
  const accuracy = progress.answered ? Math.round((progress.correct / progress.answered) * 100) : 0;
  const seen = useMemo(() => uniqueSeen(progress), [progress.attempts]);
  const rank = rankFor(progress.xp);
  const coverage = course.questions.length ? Math.round(seen.size / course.questions.length * 100) : 0;
  const reviews = useMemo(() => reviewBuckets(progress.review, course.questions.map(question => question.id)), [progress.review, course.questions]);
  const counts = useMemo(() => Object.fromEntries(levels.map(level => [level, course.questions.filter(question => question.difficulty === level).length])) as Record<Difficulty, number>, [course]);
  const mistakes = useMemo(() => Object.entries(progress.mistakes).sort((a, b) => b[1] - a[1]).map(([id, count]) => ({ question: course.questions.find(item => item.id === id), count })).filter(item => item.question), [progress.mistakes, course]);
  const domains = useMemo(() => [...new Set(course.questions.map(question => question.domain))].sort(), [course]);
  const topics = useMemo(() => [...new Set(course.questions.filter(question => filters.domain === 'all' || question.domain === filters.domain).map(question => question.topic))].sort(), [course, filters.domain]);
  const filteredQuestions = useMemo(() => course.questions.filter(question => {
    if (filters.domain !== 'all' && question.domain !== filters.domain) return false;
    if (filters.topic !== 'all' && question.topic !== filters.topic) return false;
    if (mode !== 'linear' && filters.difficulty !== 'all' && question.difficulty !== filters.difficulty) return false;
    if (filters.pool === 'new' && seen.has(question.id)) return false;
    if (filters.pool === 'mistakes' && !(progress.mistakes[question.id] > 0)) return false;
    return true;
  }), [course.questions, filters, seen, progress.mistakes, mode]);

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const syncStandalone = () => setIsStandalone(displayMode.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const capturePrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', syncStandalone);
    displayMode.addEventListener?.('change', syncStandalone);
    return () => { window.removeEventListener('beforeinstallprompt', capturePrompt); window.removeEventListener('appinstalled', syncStandalone); displayMode.removeEventListener?.('change', syncStandalone); };
  }, []);

  useEffect(()=>{const sync=()=>setOnline(navigator.onLine);const update=(event:Event)=>setWaitingWorker((event as CustomEvent<ServiceWorkerRegistration>).detail.waiting);window.addEventListener('online',sync);window.addEventListener('offline',sync);window.addEventListener('study-hub-update',update);return()=>{window.removeEventListener('online',sync);window.removeEventListener('offline',sync);window.removeEventListener('study-hub-update',update)}},[]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setSystemDark(query.matches);
    query.addEventListener?.('change', sync);
    return () => query.removeEventListener?.('change', sync);
  }, []);

  const colorMode = preferences.appearance === 'auto' ? (systemDark ? 'dark' : 'light') : preferences.appearance;
  const theme = resolveTheme(preferences.themeId, colorMode, course.theme);

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.background);
    document.documentElement.style.colorScheme = colorMode;
  }, [theme.background, colorMode]);

  const style = {
    '--accent': theme.accent, '--accent-soft': theme.accentSoft, '--course-glow': theme.glow,
    '--color-bg': theme.background, '--color-surface': theme.surface, '--color-raised': theme.surfaceRaised,
    '--color-text': theme.text, '--color-muted': theme.textMuted, '--color-border': theme.border,
    '--color-interactive': theme.interactive, '--color-interactive-text': theme.interactiveText,
    '--color-success': theme.success, '--color-success-surface': theme.successSurface,
    '--color-danger': theme.danger, '--color-danger-surface': theme.dangerSurface,
    '--color-warning': theme.warning, '--color-shadow': theme.shadow,
  } as CSSProperties;

  function changeCourse(id: string) {
    localStorage.setItem(courseKey, id);
    setCourseId(id);
    setView('gamehome');
    setFilters({ pool: 'all', domain: 'all', topic: 'all', difficulty: 'all' });
  }

  function navigate(next: View) {
    setView(next === 'settings' ? 'personalize' : next === 'home' ? 'gamehome' : next);
    window.scrollTo({ top: 0, behavior: preferences.reducedMotion ? 'auto' : 'smooth' });
  }

  function openResource(kind: ResourceKind) {
    setResource(kind);
    navigate('resource');
  }

  function updatePreferences(patch: Partial<Preferences>) {
    const next = { ...preferences, ...patch, version: 3 as const };
    localStorage.setItem(preferencesKey, JSON.stringify(next));
    setPreferences(next);
  }

  function updatePreference(key: 'largeText' | 'reducedMotion', value: boolean) {
    updatePreferences({ [key]: value });
  }

  function startSession(nextMode = mode, level = difficulty, requestedSize = sessionSize, source: 'practice' | 'simulation' = 'practice') {
    if (session && !window.confirm('Hay una sesión activa. ¿Querés reemplazarla por una nueva? Se conservará el progreso general, pero se descartará esta sesión.')) return;
    const questions = source === 'simulation' ? [...course.questions] : filteredQuestions.filter(question => nextMode === 'random' || question.difficulty === level);
    if (!questions.length) return;
    const amount = requestedSize === 'all' ? questions.length : Math.min(requestedSize, questions.length);
    const start = nextMode === 'linear' ? progress.linear[level] % questions.length : 0;
    const ordered = nextMode === 'random' ? shuffle(questions) : [...questions.slice(start), ...questions.slice(0, start)];
    const nextSession: SessionState = { id: `${course.id}-${Date.now()}`, mode: nextMode, difficulty: nextMode === 'linear' ? level : null, questionIds: ordered.slice(0, amount).map(question => question.id), position: 0, answers: {}, startedAt: Date.now(), source, filters: source === 'practice' ? filters : undefined };
    setProgress(previous => ({ ...previous, activeSession: nextSession }));
    navigate('quiz');
  }

  function startQuestionSet(questionIds: string[], source: 'campaign' | 'review', campaignNodeId?: string) {
    if (session && !window.confirm('Hay una sesión activa. ¿Querés reemplazarla?')) return;
    const ids = questionIds.filter(id => course.questions.some(question => question.id === id));
    if (!ids.length) return;
    const nextSession: SessionState = { id:`${course.id}-${source}-${Date.now()}`, mode:'random', difficulty:null, questionIds:ids, position:0, answers:{}, startedAt:Date.now(), source, campaignNodeId };
    setProgress(previous=>({...previous,activeSession:nextSession,campaign:campaignNodeId?{...previous.campaign,currentNodeId:campaignNodeId}:previous.campaign})); navigate('quiz');
  }

  function openCampaignNode(node: CampaignNodeDefinition) {
    if (node.kind === 'review') { startReview(node.id); return; }
    startQuestionSet(node.questionIds ?? [], 'campaign', node.id);
  }

  function completeResourceNode(node: CampaignNodeDefinition) {
    if (!node.resource) return;
    const already = progress.campaign.rewardedNodes.includes(node.id);
    setProgress(previous=>({...previous,xp:previous.xp+(already?0:(node.rewardXp??0)),campaign:{...previous.campaign,currentNodeId:node.id,completedNodes:previous.campaign.completedNodes.includes(node.id)?previous.campaign.completedNodes:[...previous.campaign.completedNodes,node.id],rewardedNodes:already?previous.campaign.rewardedNodes:[...previous.campaign.rewardedNodes,node.id]}}));
    openResource(node.resource.kind);
  }

  function startReview(campaignNodeId?: string) {
    const ids=[...reviews.dueIds,...reviews.reinforcementIds.filter(id=>!reviews.dueIds.includes(id))].slice(0,10);
    const fallback=reviews.newIds.slice(0,Math.max(1,10-ids.length));
    startQuestionSet([...ids,...fallback], 'review', campaignNodeId);
  }

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  function answer(choice: Choice) {
    if (!session || !current || selected !== undefined) return;
    setProgress(previous => {
      const active = previous.activeSession;
      if (!active) return previous;
      const recordId = `${active.id}:${current.id}`;
      if (previous.attempts.some(attempt => attempt.id === recordId)) return { ...previous, activeSession: { ...active, answers: { ...active.answers, [current.id]: choice } } };
      const wasNew = !previous.attempts.some(attempt => attempt.questionId === current.id);
      const reviewedError = previous.attempts.some(attempt => attempt.questionId === current.id && !attempt.correct);
      const isCorrect = choice === current.correct;
      const newReward = isCorrect && wasNew && !previous.rewardedQuestions.includes(current.id);
      const improvementReward = isCorrect && reviewedError && !previous.improvedQuestions.includes(current.id);
      const gainedXp = Number(newReward) * 10 + Number(improvementReward) * 5;
      const attempt: AnswerRecord = { id: recordId, courseId: course.id, sessionId: active.id, questionId: current.id, selected: choice, correct: isCorrect, answeredAt: Date.now(), mode: active.mode, source: active.source ?? 'practice', xp: gainedXp, wasNew, reviewedError };
      return { ...previous, answered: previous.answered + 1, correct: previous.correct + Number(isCorrect), xp: previous.xp + gainedXp, attempts: [...previous.attempts, attempt], rewardedQuestions: newReward ? [...previous.rewardedQuestions, current.id] : previous.rewardedQuestions, improvedQuestions: improvementReward ? [...previous.improvedQuestions, current.id] : previous.improvedQuestions, mistakes: isCorrect ? previous.mistakes : { ...previous.mistakes, [current.id]: (previous.mistakes[current.id] ?? 0) + 1 }, review: { ...previous.review, [current.id]: scheduleReview(current.id, previous.review[current.id], isCorrect ? 'good' : 'again') }, activeSession: { ...active, answers: { ...active.answers, [current.id]: choice } } };
    });
  }

  function gradeRecall(grade: RecallGrade) {
    if (!current) return;
    setProgress(previous=>({...previous,review:{...previous.review,[current.id]:scheduleReview(current.id,previous.review[current.id],grade)}}));
  }

  function advance() {
    if (!session || !current || selected === undefined) return;
    const finished = session.position + 1 >= session.questionIds.length;
    setProgress(previous => {
      const active = previous.activeSession;
      if (!active) return previous;
      const linear = active.mode === 'linear' && active.difficulty ? { ...previous.linear, [active.difficulty]: (previous.linear[active.difficulty] + 1) % Math.max(counts[active.difficulty], 1) } : previous.linear;
      if (!finished) return { ...previous, linear, activeSession: { ...active, position: active.position + 1 } };
      const sessionAttempts = previous.attempts.filter(attempt => attempt.sessionId === active.id);
      const today = new Date().toLocaleDateString();
      const completionXp = previous.rewardedSessions.includes(active.id) || !sessionAttempts.some(attempt => attempt.xp > 0) ? 0 : 10;
      const todayAttempts = previous.attempts.filter(attempt => new Date(attempt.answeredAt).toLocaleDateString() === today);
      const completedChallenges = [todayAttempts.filter(attempt => attempt.wasNew).length >= 5 ? '5 nuevas hoy' : '', todayAttempts.filter(attempt => attempt.reviewedError).length >= 3 ? '3 errores repasados hoy' : ''].filter(Boolean);
      const verifiedCorrect = active.questionIds.filter(id => { const question = course.questions.find(item => item.id === id); return question && active.answers[id] === question.correct; }).length;
      const campaignNode = active.campaignNodeId ? course.campaign?.chapters.flatMap(chapter=>chapter.nodes).find(node=>node.id===active.campaignNodeId) : undefined;
      const campaignPassed = Boolean(campaignNode && verifiedCorrect >= (campaignNode.requiredCorrect ?? 0));
      const nodeReward = campaignPassed && campaignNode && !previous.campaign.rewardedNodes.includes(campaignNode.id) ? campaignNode.rewardXp ?? 0 : 0;
      const preliminary: SessionResult = { id: active.id, completedAt: Date.now(), questionIds: active.questionIds, answers: active.answers, correct: verifiedCorrect, newUnique: sessionAttempts.filter(attempt => attempt.wasNew).length, earnedXp: sessionAttempts.reduce((sum, attempt) => sum + attempt.xp, 0) + completionXp + nodeReward, unlocked: [], completedChallenges, source: active.source ?? 'practice', mode: active.mode };
      const withSession = { ...previous, linear, activeSession: undefined, sessions: [...previous.sessions, preliminary], rewardedSessions: [...previous.rewardedSessions, active.id], xp: previous.xp + completionXp + nodeReward, campaign: campaignPassed && campaignNode ? { ...previous.campaign, currentNodeId: campaignNode.id, completedNodes: previous.campaign.completedNodes.includes(campaignNode.id) ? previous.campaign.completedNodes : [...previous.campaign.completedNodes,campaignNode.id], rewardedNodes: previous.campaign.rewardedNodes.includes(campaignNode.id) ? previous.campaign.rewardedNodes : [...previous.campaign.rewardedNodes,campaignNode.id] } : previous.campaign };
      const achievementUpdate = refreshAchievements(withSession, course.questions, preliminary.completedAt);
      const badgeXp = achievementUpdate.unlocked.length * 20;
      const previousRank = rankFor(Math.max(0, previous.xp - sessionAttempts.reduce((sum, attempt) => sum + attempt.xp, 0))).current.name;
      const nextRank = rankFor(withSession.xp + badgeXp).current.name;
      const result = { ...preliminary, earnedXp: preliminary.earnedXp + badgeXp, unlocked: achievementUpdate.unlocked, rankUnlocked: nextRank !== previousRank ? nextRank : undefined };
      return { ...withSession, xp: withSession.xp + badgeXp, achievements: achievementUpdate.achievements, sessions: [...withSession.sessions.slice(0, -1), result], lastResult: result };
    });
    if (finished) navigate('results');
  }

  function startExam() {
    if (progress.activeExam && !window.confirm('Ya hay un simulacro guardado. ¿Querés reemplazarlo?')) return;
    const definition=course.exam;
    const limit=Math.min(definition.questionCount,course.questions.length);
    const selectedQuestions=definition.domainWeights?Object.entries(definition.domainWeights).reduce<typeof course.questions>((chosen,[domain,weight])=>{
      const available=shuffle(course.questions.filter(question=>question.domain===domain&&!chosen.some(item=>item.id===question.id)));
      const quota=Math.max(0,Math.round(limit*weight));
      return [...chosen,...available.slice(0,Math.min(quota,limit-chosen.length))];
    },[]):[];
    const remaining=shuffle(course.questions.filter(question=>!selectedQuestions.some(item=>item.id===question.id)));
    const questions=shuffle([...selectedQuestions,...remaining.slice(0,limit-selectedQuestions.length)]);
    const exam:ExamState={id:`${course.id}-exam-${Date.now()}`,definitionId:definition.id,questionIds:questions.map(q=>q.id),answers:{},marked:[],position:0,startedAt:Date.now(),durationSeconds:definition.durationMinutes*60,pausedSeconds:0};
    setProgress(previous=>({...previous,activeExam:exam}));navigate('exam');
  }

  function updateExam(exam:ExamState){setProgress(previous=>({...previous,activeExam:exam}));}

  function submitExam(force = false) {
    const exam=progress.activeExam;if(!exam)return;
    if(!force&&Object.keys(exam.answers).length<exam.questionIds.length&&!window.confirm('Quedan preguntas sin responder. ¿Entregar igualmente?'))return;
    setProgress(previous=>{const active=previous.activeExam;if(!active||previous.examHistory.some(result=>result.id===active.id))return previous;let answered=previous.answered,correct=previous.correct,xp=previous.xp;let attempts=[...previous.attempts];let mistakes={...previous.mistakes};let review={...previous.review};let rewarded=[...previous.rewardedQuestions];let improved=[...previous.improvedQuestions];let verified=0;for(const id of active.questionIds){const question=course.questions.find(q=>q.id===id);const selected=active.answers[id];if(!question||selected===undefined)continue;const recordId=`${active.id}:${id}`;if(attempts.some(a=>a.id===recordId))continue;const isCorrect=selected===question.correct;const wasNew=!attempts.some(a=>a.questionId===id);const reviewedError=attempts.some(a=>a.questionId===id&&!a.correct);const newReward=isCorrect&&wasNew&&!rewarded.includes(id);const improvementReward=isCorrect&&reviewedError&&!improved.includes(id);const gained=Number(newReward)*10+Number(improvementReward)*5;attempts.push({id:recordId,courseId:course.id,sessionId:active.id,questionId:id,selected,correct:isCorrect,answeredAt:Date.now(),mode:'random',source:'simulation',xp:gained,wasNew,reviewedError});answered++;correct+=Number(isCorrect);verified+=Number(isCorrect);xp+=gained;if(newReward)rewarded.push(id);if(improvementReward)improved.push(id);if(!isCorrect)mistakes[id]=(mistakes[id]??0)+1;review[id]=scheduleReview(id,review[id],isCorrect?'good':'again');}const result:ExamResult={id:active.id,completedAt:Date.now(),questionIds:active.questionIds,answers:active.answers,marked:active.marked,correct:verified,durationSeconds:Math.min(active.durationSeconds,Math.floor((Date.now()-active.startedAt)/1000))};return{...previous,answered,correct,xp,attempts,mistakes,review,rewardedQuestions:rewarded,improvedQuestions:improved,activeExam:undefined,examHistory:[...previous.examHistory,result]};});navigate('exam-results');
  }

  const studyCards: { id: string; category: HomeCategory; title: string; description: string; icon: IconName; action: () => void; count?: string }[] = [
    { id: 'campaign', category: 'training', title: 'Campaña', description: 'Mapa progresivo con etapas y desafíos reales.', icon: 'map', action: () => navigate('campaign') },
    { id: 'training', category: 'training', title: 'Entrenamiento', description: 'Repaso inteligente según errores y fechas.', icon: 'cards', action: () => navigate('training'), count: `${reviews.dueIds.length} para hoy` },
    { id: 'practice', category: 'training', title: 'Partida libre', description: 'Sesión configurable por banco, modalidad, dificultad y cantidad.', icon: 'practice', action: () => navigate('practice'), count: `${course.questions.length} preguntas` },
    { id: 'simulations', category: 'training', title: 'Simulacros', description: 'Examen demostrativo con tiempo y revisión.', icon: 'exam', action: () => navigate('simulations') },
    { id: 'glossary', category: 'library', title: 'Glosario', description: 'Definiciones esenciales para repasar rápido.', icon: 'book', action: () => openResource('glossary'), count: `${course.glossary.length} conceptos` },
    { id: 'maps', category: 'library', title: 'Mapas conceptuales', description: 'Relaciones explorables entre ideas clave.', icon: 'map', action: () => openResource('maps') },
    { id: 'comparisons', category: 'library', title: 'Cuadros comparativos', description: 'Diferencias importantes en una sola vista.', icon: 'compare', action: () => openResource('comparisons') },
    { id: 'reading', category: 'library', title: 'Material de lectura', description: 'Lecciones breves y progresivas.', icon: 'book', action: () => openResource('reading') },
    { id: 'flashcards', category: 'library', title: 'Flashcards', description: 'Practicá recuperación activa de conceptos.', icon: 'cards', action: () => openResource('flashcards'), count: `${course.resources.flashcards.length} tarjetas` },
    { id: 'formulas', category: 'library', title: 'Fórmulas', description: 'Expresiones, significado e interpretación.', icon: 'formula', action: () => openResource('formulas') },
    { id: 'tips', category: 'library', title: 'Consejos de examen', description: 'Estrategias aplicables el día de la prueba.', icon: 'tips', action: () => openResource('tips') },
    { id: 'progress', category: 'tracking', title: 'Mi progreso', description: 'Precisión, recorridos y oportunidades de mejora.', icon: 'chart', action: () => navigate('progress') },
  ];

  const effectiveOrder = [...preferences.homeOrder.filter(id => studyCards.some(card => card.id === id)), ...studyCards.map(card => card.id).filter(id => !preferences.homeOrder.includes(id))];
  const orderedCards = effectiveOrder.map(id => studyCards.find(card => card.id === id)!).filter(Boolean);
  const categoryCards = orderedCards.filter(card => card.category === homeCategory && !preferences.hiddenHome.includes(card.id));
  const pageCount = Math.ceil(categoryCards.length / 2);
  const visibleCards = categoryCards.slice(homePage * 2, homePage * 2 + 2);
  const availableQuestions = filteredQuestions.filter(question => mode === 'random' || question.difficulty === difficulty);
  const domainStats = useMemo(() => breakdown(progress, course.questions, 'domain'), [progress, course]);
  const topicStats = useMemo(() => breakdown(progress, course.questions, 'topic'), [progress, course]);
  const difficultyStats = useMemo(() => breakdown(progress, course.questions, 'difficulty'), [progress, course]);
  const lastResult = progress.lastResult;
  const resultDomains = useMemo(() => lastResult ? [...new Set(lastResult.questionIds.map(id => { const question = course.questions.find(item => item.id === id); return question ? `${question.domain} · ${question.topic} · ${levelNames[question.difficulty]}` : ''; }).filter(Boolean))].map(label => { const questions = lastResult.questionIds.map(id => course.questions.find(question => question.id === id)).filter(question => question && `${question.domain} · ${question.topic} · ${levelNames[question.difficulty]}` === label); return { label, correct: questions.filter(question => question && lastResult.answers[question.id] === question.correct).length, total: questions.length }; }) : [], [lastResult, course]);

  function selectHomeCategory(category: HomeCategory) {
    setHomeCategory(category);
    setHomePage(0);
  }

  function moveHomeCard(id: string, direction: -1 | 1) {
    const order = [...effectiveOrder];
    const index = order.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= order.length) return;
    [order[index], order[target]] = [order[target], order[index]];
    updatePreferences({ homeOrder: order });
  }

  function moveHomeCardTo(source: string, target: string) {
    const order = [...effectiveOrder];
    const from = order.indexOf(source); const to = order.indexOf(target);
    if (from < 0 || to < 0 || from === to) return;
    order.splice(to, 0, order.splice(from, 1)[0]);
    updatePreferences({ homeOrder: order });
  }

  function toggleHomeCard(id: string) {
    updatePreferences({ hiddenHome: preferences.hiddenHome.includes(id) ? preferences.hiddenHome.filter(item => item !== id) : [...preferences.hiddenHome, id] });
  }

  function toggleHomeMetric(metric: HomeMetric) {
    updatePreferences({ homeMetrics: preferences.homeMetrics.includes(metric) ? preferences.homeMetrics.filter(item => item !== metric) : [...preferences.homeMetrics, metric] });
  }

  const navSection = ['gamehome','profile','campaign'].includes(view) ? 'home' : view === 'resource' ? 'library' : ['quiz','results','training','exam','exam-results','simulations'].includes(view) ? 'practice' : view;

  const focusActive = view === 'quiz' && preferences.focusMode;

  return <div data-theme={preferences.themeId} data-color-mode={colorMode} data-density={preferences.density} className={`app-shell motif-${course.theme.motif} ${preferences.reducedMotion ? 'reduce-motion' : ''} ${preferences.largeText ? 'large-text' : ''} ${isStandalone ? 'standalone' : ''} ${focusActive ? 'focus-mode' : ''}`} style={style}>
    <header className="topbar">
      <button className="brand" onClick={() => navigate('home')} aria-label="Ir al centro de estudio"><span><Icon name={course.theme.icon} size={24}/></span><div>Study Hub<small>Centro de estudio</small></div></button>
      <label className="course-picker"><span>Certificación</span><select aria-label="Cambiar certificación" value={courseId} onChange={event => changeCourse(event.target.value)}>{certifications.map(item => <option key={item.id} value={item.id}>{item.shortTitle}</option>)}</select></label>
      <nav className="desktop-nav" aria-label="Navegación principal"><button className={navSection === 'home' ? 'active' : ''} onClick={() => navigate('home')}>Inicio</button><button className={navSection === 'practice' ? 'active' : ''} onClick={() => navigate('practice')}>Practicar</button><button className={navSection === 'library' ? 'active' : ''} onClick={() => navigate('library')}>Biblioteca</button><button className={navSection === 'progress' ? 'active' : ''} onClick={() => navigate('progress')}>Progreso</button></nav>
      <button className={`settings-button ${view === 'personalize' ? 'active' : ''}`} onClick={() => navigate('settings')} aria-label="Abrir configuración"><Icon name="settings" size={21}/></button>
    </header>

    {(!online || waitingWorker) && <aside className="connection-status" role="status"><span>{online?'Nueva versión disponible':'Sin conexión · tus datos siguen guardándose localmente'}</span>{waitingWorker&&<button onClick={()=>waitingWorker.postMessage({type:'SKIP_WAITING'})}>Actualizar cuando estés listo</button>}</aside>}

    <main className="app-main">
      {focusActive && <button className="focus-toggle" onClick={() => updatePreferences({ focusMode: false })} aria-label="Salir del modo concentración">Salir de concentración</button>}

      {view === 'gamehome' && <GameHome alias={profile.alias} avatar={profile.avatar} frame={profile.frame} style={preferences.homeStyle} courseTitle={course.shortTitle} xp={progress.xp} rank={rank.current.name} nextXp={rank.next?.xp} accuracy={accuracy} coverage={coverage} sessionLabel={session ? `Pregunta ${session.position + 1} de ${session.questionIds.length}` : progress.activeExam ? 'Simulacro guardado' : reviews.dueIds.length ? `${reviews.dueIds.length} repasos para hoy` : progress.campaign.currentNodeId ? 'Continuar campaña' : 'Comenzar campaña'} onPrimary={() => navigate(session ? 'quiz' : progress.activeExam ? 'exam' : reviews.dueIds.length ? 'training' : 'campaign')} onProfile={() => navigate('profile')} cards={orderedCards} hidden={preferences.hiddenHome} metrics={preferences.homeMetrics} reducedMotion={preferences.reducedMotion} onMove={moveHomeCard} onMoveTo={moveHomeCardTo} onToggle={toggleHomeCard} onToggleMetric={toggleHomeMetric} onRestore={() => updatePreferences({ homeOrder: defaultHomeOrder, hiddenHome: [], homeMetrics: ['xp','rank','accuracy','coverage'] })}/>}

      {view === 'profile' && <ProfileView profile={profile} progress={studyProgress} courses={certifications} onChange={updateProfile} onBack={() => navigate('home')}/>}

      {view === 'campaign' && <CampaignView course={course} completed={progress.campaign.completedNodes} current={progress.campaign.currentNodeId} onBack={()=>navigate('home')} onStart={openCampaignNode} onReview={node=>startReview(node.id)} onResource={completeResourceNode} onReturn={()=>document.getElementById(`node-${progress.campaign.currentNodeId}`)?.scrollIntoView({block:'center',behavior:preferences.reducedMotion?'auto':'smooth'})}/>}

      {view === 'training' && <section className="training-view"><button className="back-link" onClick={()=>navigate('home')}>← Inicio</button><div className="page-heading compact-page-heading"><p className="eyebrow">Repetición espaciada · {course.shortTitle}</p><h1>Entrenamiento</h1><p>Las fechas cambian únicamente cuando respondés. No perdés XP por posponer un repaso.</p></div><div className="review-summary"><article><span>Para hoy</span><strong>{reviews.dueIds.length}</strong></article><article><span>Refuerzo</span><strong>{reviews.reinforcementIds.length}</strong></article><article><span>Nuevas</span><strong>{reviews.newIds.length}</strong></article><article><span>Dominadas</span><strong>{reviews.masteredIds.length}</strong></article></div><button className="primary review-launch" onClick={()=>startReview()} disabled={!reviews.dueIds.length&&!reviews.reinforcementIds.length&&!reviews.newIds.length}>Iniciar entrenamiento</button><div className="upcoming-reviews"><h2>Próximos repasos</h2>{reviews.upcoming.length?reviews.upcoming.slice(0,10).map(item=>{const question=course.questions.find(q=>q.id===item.questionId);return <article key={item.questionId}><div><strong>{question?.topic}</strong><small>{question?.domain} · intervalo {item.intervalDays} días</small></div><time>{new Date(item.dueAt).toLocaleDateString()}</time></article>}):<p>No hay repasos futuros todavía. Empezá con preguntas nuevas.</p>}</div></section>}

      {view === 'exam' && progress.activeExam && <ExamView course={course} state={progress.activeExam} onChange={updateExam} onSubmit={value=>submitExam(value===true)} onExit={()=>navigate('home')}/>}
      {view === 'exam' && !progress.activeExam && <div className="resource-empty"><h1>No hay simulacro activo</h1><button className="primary" onClick={()=>navigate('simulations')}>Configurar simulacro</button></div>}
      {view === 'exam-results' && progress.examHistory.length>0 && (()=>{const result=progress.examHistory[progress.examHistory.length-1];const percent=Math.round(result.correct/Math.max(1,result.questionIds.length)*100);const domainResults=[...new Set(result.questionIds.map(id=>course.questions.find(q=>q.id===id)?.domain).filter(Boolean))].map(domain=>{const questions=result.questionIds.map(id=>course.questions.find(q=>q.id===id)).filter(q=>q?.domain===domain);return{domain,correct:questions.filter(q=>q&&result.answers[q.id]===q.correct).length,total:questions.length}});return <section className="exam-results"><button className="back-link" onClick={()=>navigate('home')}>← Inicio</button><div className="results-head"><div><p className="eyebrow">Resultado demostrativo · {course.shortTitle}</p><h1>{percent}% · {percent>=course.exam.passingPercent?'Objetivo alcanzado':'Conviene reforzar'}</h1><p>No representa una garantía de aprobación oficial.</p></div><div className="xp-burst"><strong>{result.correct}/{result.questionIds.length}</strong><span>aciertos</span></div></div><div className="result-metrics"><article><span>Tiempo usado</span><strong>{Math.floor(result.durationSeconds/60)} min</strong></article><article><span>Marcadas</span><strong>{result.marked.length}</strong></article><article><span>Umbral demo</span><strong>{course.exam.passingPercent}%</strong></article><article><span>Errores</span><strong>{result.questionIds.length-result.correct}</strong></article></div><div className="exam-domain-results" aria-label="Resultados por dominio">{domainResults.map(item=><article key={item.domain}><span>{item.domain}</span><strong>{item.correct}/{item.total}</strong><small>{item.correct===item.total?'Dominado':item.correct===0?'Prioridad de refuerzo':'Seguir practicando'}</small></article>)}</div><div className="answer-review open-review">{result.questionIds.map((id,index)=>{const question=course.questions.find(q=>q.id===id);if(!question)return null;const chosen=result.answers[id];return <article key={id}><span className={chosen===question.correct?'review-ok':'review-bad'}>{index+1} · {chosen===question.correct?'Correcta':'A reforzar'}</span><h2>{question.prompt}</h2><p>Tu respuesta: <b>{chosen===undefined?'Sin respuesta':question.options[chosen]}</b></p><p>Correcta: <b>{question.options[question.correct]}</b></p><small>{question.explanation}</small></article>})}</div></section>})()}

      {view === 'personalize' && <section className="personalization-view">
        <div className="page-heading compact-page-heading"><p className="eyebrow">Preferencias locales</p><h1>Personalización</h1></div>
        <div className="settings-tabs" role="tablist" aria-label="Secciones de personalización">
          {([['appearance','Apariencia'],['home','Inicio'],['accessibility','Accesibilidad'],['about','Acerca de']] as const).map(([id, label]) => <button key={id} role="tab" aria-selected={settingsTab === id} className={settingsTab === id ? 'active' : ''} onClick={() => setSettingsTab(id)}>{label}</button>)}
        </div>
        <div className="settings-panel">
          {settingsTab === 'appearance' && <div className="appearance-settings">
            <div className="setting-heading"><div><strong>Tema visual</strong><small>Se aplica a todas las certificaciones. “Curso” usa la identidad del curso activo.</small></div></div>
            <div className="theme-grid">
              <button className={preferences.themeId === 'course' ? 'active' : ''} onClick={() => updatePreferences({ themeId: 'course' })}><span className="theme-preview" style={{ '--preview-a': course.theme.primary, '--preview-b': course.theme.secondary } as CSSProperties}/><strong>Curso</strong><small>Identidad de {course.shortTitle}</small></button>
              {themes.map(item => <button key={item.id} className={preferences.themeId === item.id ? 'active' : ''} onClick={() => updatePreferences({ themeId: item.id })}><span className="theme-preview" style={{ '--preview-a': item.accent, '--preview-b': item.accentSoft } as CSSProperties}/><strong>{item.name}</strong><small>{item.description}</small></button>)}
            </div>
            <fieldset className="choice-setting"><legend>Apariencia</legend><div>{(['light','dark','auto'] as Appearance[]).map(value => <button key={value} className={preferences.appearance === value ? 'active' : ''} aria-pressed={preferences.appearance === value} onClick={() => updatePreferences({ appearance: value })}>{value === 'light' ? 'Claro' : value === 'dark' ? 'Oscuro' : 'Automático'}</button>)}</div></fieldset>
            <fieldset className="choice-setting"><legend>Densidad</legend><div>{(['compact','normal','comfortable'] as Density[]).map(value => <button key={value} className={preferences.density === value ? 'active' : ''} aria-pressed={preferences.density === value} onClick={() => updatePreferences({ density: value })}>{value === 'compact' ? 'Compacta' : value === 'normal' ? 'Normal' : 'Cómoda'}</button>)}</div></fieldset>
            <fieldset className="choice-setting"><legend>Estilo del inicio</legend><div>{(['minimal','adventure','dashboard'] as HomeStyle[]).map(value => <button key={value} className={preferences.homeStyle === value ? 'active' : ''} aria-pressed={preferences.homeStyle === value} onClick={() => updatePreferences({ homeStyle: value })}>{value === 'minimal' ? 'Minimal' : value === 'adventure' ? 'Adventure' : 'Dashboard'}</button>)}</div></fieldset>
            <button className="secondary reset-preferences" onClick={() => updatePreferences({ themeId: 'course', appearance: 'auto', density: 'normal' })}>Restaurar apariencia</button>
          </div>}

          {settingsTab === 'home' && <div className="home-settings"><div className="setting-heading"><div><strong>Herramientas de Inicio</strong><small>Elegí cuáles aparecen y ordenalas. Todas siguen disponibles desde Practicar, Biblioteca y Progreso.</small></div><button className="secondary" onClick={() => updatePreferences({ homeOrder: defaultHomeOrder, hiddenHome: [] })}>Restaurar</button></div><div className="home-order-list">{orderedCards.map((card, index) => <div key={card.id}><label><input type="checkbox" checked={!preferences.hiddenHome.includes(card.id)} onChange={() => toggleHomeCard(card.id)}/><Icon name={card.icon} size={20}/><span><strong>{card.title}</strong><small>{card.category === 'training' ? 'Entrenamiento' : card.category === 'library' ? 'Biblioteca' : 'Seguimiento'}</small></span></label><div><button onClick={() => moveHomeCard(card.id, -1)} disabled={index === 0} aria-label={`Subir ${card.title}`}>↑</button><button onClick={() => moveHomeCard(card.id, 1)} disabled={index === orderedCards.length - 1} aria-label={`Bajar ${card.title}`}>↓</button></div></div>)}</div></div>}

          {settingsTab === 'accessibility' && <div className="accessibility-settings settings-list"><label><span><strong>Texto ampliado</strong><small>Aumenta el tamaño base sin ocultar funciones.</small></span><input type="checkbox" checked={preferences.largeText} onChange={event => updatePreferences({ largeText: event.target.checked })}/></label><label><span><strong>Reducir movimiento</strong><small>Desactiva animaciones y transiciones no esenciales.</small></span><input type="checkbox" checked={preferences.reducedMotion} onChange={event => updatePreferences({ reducedMotion: event.target.checked })}/></label><label><span><strong>Modo concentración</strong><small>Durante una práctica oculta la navegación y deja visible una salida.</small></span><input type="checkbox" checked={preferences.focusMode} onChange={event => updatePreferences({ focusMode: event.target.checked })}/></label><section className="install-panel" aria-label="Instalación de la aplicación"><div><strong>{isStandalone ? 'Study Hub está instalada' : 'Usar como aplicación'}</strong><p>{isStandalone ? 'Se está ejecutando en modo independiente.' : installPrompt ? 'Instalala para abrirla sin las barras del navegador.' : 'En iPhone/iPad: Compartir → Agregar a pantalla de inicio. En otros navegadores, buscá Instalar aplicación en el menú.'}</p></div>{installPrompt && !isStandalone && <button className="secondary" onClick={installApp}>Instalar</button>}</section></div>}

          {settingsTab === 'about' && <div className="about-settings"><h2>Acerca de Study Hub</h2><p>Study Hub es un centro de estudio independiente. Guarda las preferencias, sesiones y el progreso únicamente en este navegador.</p><p>Sus iconos son originales y genéricos; no usa logos oficiales ni afirma afiliación o aprobación de organismos certificadores.</p><p>El contenido identificado como demostrativo es original y sirve para probar la experiencia. No se solicitan permisos ni se envían datos a servicios externos.</p></div>}
        </div>
      </section>}

      {view === 'home' && <section className="home-view view-panel">
        <section className="study-hero"><div className="course-emblem"><Icon name={course.theme.icon} size={48}/><i/><i/></div><div><p className="eyebrow">Tu centro de estudio · recursos demostrativos</p><h1>{course.title}</h1><p className="subtitle">{course.subtitle}</p><p>{course.description}</p><div className="hero-actions">{session ? <button className="primary" onClick={() => navigate('quiz')}>Continuar sesión · {session.position + 1}/{session.questionIds.length}</button> : <button className="primary" onClick={() => navigate('practice')}>Empezar a practicar</button>}<button className="secondary" onClick={() => navigate('library')}>Explorar biblioteca</button></div></div><ProgressRing value={accuracy}/></section>
        <section className="quick-stats gamified-stats" aria-label={`Resumen de ${course.title}`}><article><span>Rango</span><strong>{rank.current.name}</strong></article><article><span>XP</span><strong>{progress.xp}{rank.next ? ` / ${rank.next.xp}` : ''}</strong></article><article><span>Próximo objetivo</span><strong>{rank.next ? `${rank.next.xp - progress.xp} XP` : 'Cobertura 100%'}</strong></article></section>
        <div className="home-tools"><div className="section-heading"><div><p className="eyebrow">Todo en un lugar</p><h2>¿Qué querés estudiar?</h2></div><span>{studyCards.length} herramientas</span></div><div className="category-tabs" role="tablist" aria-label="Categorías del centro de estudio"><button role="tab" aria-selected={homeCategory === 'training'} className={homeCategory === 'training' ? 'active' : ''} onClick={() => selectHomeCategory('training')}>Entrenar</button><button role="tab" aria-selected={homeCategory === 'library'} className={homeCategory === 'library' ? 'active' : ''} onClick={() => selectHomeCategory('library')}>Biblioteca</button><button role="tab" aria-selected={homeCategory === 'tracking'} className={homeCategory === 'tracking' ? 'active' : ''} onClick={() => selectHomeCategory('tracking')}>Seguimiento</button></div><section className="study-grid">{visibleCards.map(card => <button key={card.title} className="study-card" onClick={card.action}><span className="tool-icon"><Icon name={card.icon} size={25}/></span><span className="tool-copy"><strong>{card.title}</strong><small>{card.description}</small>{card.count && <em>{card.count}</em>}</span><Icon name="arrow" size={18}/></button>)}</section>{pageCount > 1 && <div className="tool-pagination" aria-label="Páginas de herramientas">{Array.from({ length: pageCount }, (_, index) => <button key={index} aria-label={`Página ${index + 1}`} aria-current={homePage === index ? 'page' : undefined} className={homePage === index ? 'active' : ''} onClick={() => setHomePage(index)}/>)}</div>}</div>
      </section>}

      {view === 'library' && <section className="library-view"><div className="page-heading compact-page-heading"><p className="eyebrow">{course.shortTitle} · recursos demostrativos</p><h1>Biblioteca</h1></div><div className="library-grid">{studyCards.filter(card => ['Glosario','Mapas conceptuales','Cuadros comparativos','Material de lectura','Flashcards','Fórmulas','Consejos de examen'].includes(card.title)).map(card => <button key={card.title} onClick={card.action}><span><Icon name={card.icon} size={27}/></span><strong>{card.title}</strong><Icon name="arrow" size={16}/></button>)}</div></section>}

      {view === 'resource' && <ResourceView kind={resource} course={course} onBack={() => navigate('library')}/>}

      {view === 'practice' && <section className="practice-view filtered-practice"><div className="page-heading compact-page-heading"><p className="eyebrow">Práctica · {course.shortTitle}</p><h1>Elegí qué practicar</h1></div>{session && <div className="resume-banner compact-resume"><div><strong>Sesión guardada</strong><p>{session.position + 1}/{session.questionIds.length} · respuestas y posición conservadas</p></div><button className="secondary" onClick={() => navigate('quiz')}>Reanudar</button></div>}<form className="practice-form filter-form" onSubmit={event => { event.preventDefault(); startSession(); }}><label><span>Preguntas</span><select value={filters.pool} onChange={event => setFilters(previous => ({ ...previous, pool: event.target.value as PracticeFilters['pool'] }))}><option value="all">Todas</option><option value="new">Solo nuevas</option><option value="mistakes">Repasar errores</option></select></label><label><span>Dominio</span><select value={filters.domain} onChange={event => setFilters(previous => ({ ...previous, domain: event.target.value, topic: 'all' }))}><option value="all">Todos</option>{domains.map(domain => <option key={domain}>{domain}</option>)}</select></label><label><span>Tema</span><select value={filters.topic} onChange={event => setFilters(previous => ({ ...previous, topic: event.target.value }))}><option value="all">Todos</option>{topics.map(topic => <option key={topic}>{topic}</option>)}</select></label><label><span>Modalidad</span><select value={mode} onChange={event => setMode(event.target.value as QuizMode)}><option value="random">Aleatoria</option><option value="linear">Lineal</option></select></label><label><span>Dificultad</span><select value={mode === 'linear' ? difficulty : filters.difficulty} onChange={event => mode === 'linear' ? setDifficulty(event.target.value as Difficulty) : setFilters(previous => ({ ...previous, difficulty: event.target.value as PracticeFilters['difficulty'] }))}>{mode === 'random' && <option value="all">Todas</option>}{levels.map(level => <option key={level} value={level}>{levelNames[level]}</option>)}</select></label><label><span>Cantidad</span><select value={sessionSize} onChange={event => setSessionSize(event.target.value === 'all' ? 'all' : Number(event.target.value) as SessionSize)}>{sizeOptions.map(size => <option key={size} value={size}>{size === 'all' ? `Todas (${availableQuestions.length})` : `${size} (hasta ${Math.min(size, availableQuestions.length)})`}</option>)}</select></label><div className={`availability ${availableQuestions.length ? '' : 'empty'}`}><strong>{availableQuestions.length}</strong><span>disponibles</span></div><button className="primary practice-launch" type="submit" disabled={!availableQuestions.length}>{session ? 'Iniciar y reemplazar' : 'Iniciar sesión'}</button></form>{!availableQuestions.length ? <p className="filter-empty">No hay preguntas que coincidan. Probá cambiar {filters.pool !== 'all' ? 'el tipo de preguntas' : filters.topic !== 'all' ? 'el tema' : filters.domain !== 'all' ? 'el dominio' : 'la dificultad'}.</p> : <p className="form-note">Sin repeticiones dentro de la sesión. En modo lineal, solo avanza la ruta de la dificultad elegida al responder.</p>}</section>}

      {view === 'simulations' && <section className="simulation-view"><button className="back-link" onClick={() => navigate('home')}>← Volver al inicio</button><div className="simulation-card"><span className="simulation-icon"><Icon name="exam" size={42}/></span><p className="eyebrow">Simulacro demostrativo configurable por curso</p><h1>{course.exam.title}</h1><p>Usa el banco demostrativo disponible. El reloj continúa si cerrás o salís; las respuestas y marcas quedan guardadas. Las explicaciones aparecen únicamente después de entregar.</p><div className="simulation-facts"><span><b>{Math.min(course.exam.questionCount,course.questions.length)}</b> preguntas</span><span><b>{course.exam.durationMinutes} min</b> de duración</span><span><b>{course.exam.passingPercent}%</b> umbral demo</span></div>{progress.activeExam?<button className="primary" onClick={()=>navigate('exam')}>Reanudar simulacro</button>:<button className="primary" onClick={startExam}>Iniciar simulacro</button>}</div></section>}

      {view === 'quiz' && session && current && <section className="quiz-wrap"><button className="back-link" onClick={() => navigate('home')}>← Guardar y salir</button><div className="quiz-meta"><span>{course.shortTitle} · {session.source === 'simulation' ? 'Simulacro' : session.mode === 'random' ? 'Aleatoria' : levelNames[session.difficulty!]}</span><span>{session.position + 1} / {session.questionIds.length}</span></div><div className="progress-bar"><span style={{ width: `${((session.position + Number(selected !== undefined)) / session.questionIds.length) * 100}%` }}/></div><article className="question-card"><div className="tags">{(course.conceptIcons?.[current.topic] ?? course.conceptIcons?.[current.domain]) && <span className="concept-tag"><ConceptIcon id={(course.conceptIcons?.[current.topic] ?? course.conceptIcons?.[current.domain])!} size={16}/>{current.topic}</span>}<span>Demostrativa</span><span>{current.domain}</span><span>{levelNames[current.difficulty]}</span></div><p className="question-number">Pregunta {session.position + 1}</p><h2>{current.prompt}</h2><div className="options">{current.options.map((option, index) => { const choice = index as Choice; const state = selected === undefined ? '' : choice === current.correct ? 'correct' : choice === selected ? 'wrong' : 'muted'; return <button className={state} key={option} onClick={() => answer(choice)} disabled={selected !== undefined}><b>{String.fromCharCode(65 + index)}</b><span>{option}</span></button>; })}</div>{selected !== undefined && <div className={`feedback ${selected === current.correct ? 'success' : 'error'}`}><div><strong>{selected === current.correct ? 'Respuesta correcta' : 'Revisá este concepto'}</strong><p>{current.explanation}</p></div><button className="primary" onClick={advance}>{session.position + 1 === session.questionIds.length ? 'Ver progreso' : 'Siguiente →'}</button></div>}</article></section>}
      {view === 'quiz' && session?.source === 'review' && current && selected !== undefined && <div className="recall-rating" aria-label="Dificultad percibida"><span>¿Cómo se sintió recordarla?</span>{([['again','Otra vez'],['hard','Difícil'],['good','Bien'],['easy','Fácil']] as [RecallGrade,string][]).map(([grade,label])=><button key={grade} onClick={()=>gradeRecall(grade)}>{label}</button>)}</div>}

      {view === 'quiz' && (!session || !current) && <div className="resource-empty"><h1>No hay una sesión activa</h1><p>Configurá una práctica para comenzar.</p><button className="primary" onClick={() => navigate('practice')}>Configurar sesión</button></div>}

      {view === 'results' && lastResult && <section className="results-view"><div className="results-head"><div><p className="eyebrow">Sesión completada · {course.shortTitle}</p><h1>{lastResult.correct === lastResult.questionIds.length ? '¡Excelente recorrido!' : 'Cada respuesta suma aprendizaje'}</h1><p>Estas métricas pertenecen a esta sesión; tu historial completo está en Progreso.</p></div><div className="xp-burst"><strong>+{lastResult.earnedXp}</strong><span>XP obtenida</span></div></div><div className="result-metrics"><article><span>Aciertos</span><strong>{lastResult.correct}</strong></article><article><span>Errores</span><strong>{lastResult.questionIds.length - lastResult.correct}</strong></article><article><span>Precisión</span><strong>{Math.round(lastResult.correct / Math.max(lastResult.questionIds.length, 1) * 100)}%</strong></article><article><span>Nuevas vistas</span><strong>{lastResult.newUnique}</strong></article></div>{resultDomains.length > 1 && <div className="result-domains">{resultDomains.map(item => <span key={item.label}><b>{item.label}</b>{item.correct}/{item.total}</span>)}</div>}{(lastResult.unlocked.length > 0 || lastResult.completedChallenges.length > 0 || lastResult.rankUnlocked) && <div className="session-unlocks">{lastResult.rankUnlocked && <span>★ Nuevo rango: {lastResult.rankUnlocked}</span>}{lastResult.unlocked.map(id => <span key={id}>🏅 {achievementCatalog.find(item => item.id === id)?.title}</span>)}{lastResult.completedChallenges.map(challenge => <span key={challenge}>✓ Desafío: {challenge}</span>)}</div>}<details className="answer-review"><summary>Revisar las {lastResult.questionIds.length} preguntas</summary><div>{lastResult.questionIds.map((id, index) => { const question = course.questions.find(item => item.id === id); const chosen = question ? lastResult.answers[id] : undefined; if (!question) return null; return <article key={id}><span className={chosen === question.correct ? 'review-ok' : 'review-bad'}>{index + 1} · {chosen === question.correct ? 'Correcta' : 'A revisar'}</span><h2>{question.prompt}</h2><p>Tu respuesta: <b>{chosen === undefined ? 'Sin respuesta' : question.options[chosen]}</b></p><p>Correcta: <b>{question.options[question.correct]}</b></p><small>{question.explanation}</small></article>; })}</div></details><div className="result-actions"><button className="secondary" onClick={() => navigate('home')}>Volver al inicio</button><button className="secondary" onClick={() => navigate('practice')}>Otra sesión</button><button className="primary" disabled={!lastResult.questionIds.some(id => progress.mistakes[id] > 0)} onClick={() => { setFilters({ pool: 'mistakes', domain: 'all', topic: 'all', difficulty: 'all' }); setMode('random'); navigate('practice'); }}>Repasar errores</button></div></section>}

      {view === 'results' && !lastResult && <div className="resource-empty"><h1>No hay resultados recientes</h1><button className="primary" onClick={() => navigate('practice')}>Iniciar práctica</button></div>}

      {view === 'progress' && <section className="progress-view"><div className="page-heading compact-page-heading"><p className="eyebrow">Mi progreso · {course.shortTitle}</p><h1>{rank.current.name} · {progress.xp} XP</h1></div><div className="progress-tabs" role="tablist" aria-label="Secciones de progreso">{([['summary','Resumen'],['levels','Niveles'],['mistakes','Errores']] as [ProgressTab,string][]).map(([key,label]) => <button type="button" role="tab" aria-selected={progressTab === key} className={progressTab === key ? 'active' : ''} key={key} onClick={() => setProgressTab(key)}>{label}{key === 'mistakes' && mistakes.length ? <b>{mistakes.length}</b> : null}</button>)}</div><div className="progress-tab-panel gamified-progress">{progress.legacyIncomplete && <div className="data-notice">El historial anterior conserva totales y errores, pero no permite reconstruir preguntas únicas, fechas ni XP.</div>}{progressTab === 'summary' && <><div className="progress-subtabs">{([['metrics','Métricas'],['ranks','Rangos'],['achievements','Logros']] as [ProgressSection,string][]).map(([key,label]) => <button key={key} className={progressSection === key ? 'active' : ''} onClick={() => setProgressSection(key)}>{label}</button>)}</div>{progressSection === 'metrics' && <div className="metric-dashboard"><article className="coverage-card"><ProgressRing value={coverage}/><div><span>Cobertura real</span><h2>{seen.size} de {course.questions.length}</h2><p>Preguntas únicas vistas · {progress.attempts.length} intentos verificables</p></div></article><div className="metric-pairs"><article><span>Precisión histórica</span><strong>{progress.attempts.length ? `${Math.round(progress.attempts.filter(attempt => attempt.correct).length / progress.attempts.length * 100)}%` : '—'}</strong></article><article><span>Sesiones completas</span><strong>{progress.sessions.length}</strong></article></div></div>}{progressSection === 'ranks' && <div className="rank-panel"><div className="rank-current"><span>Rango Study Hub</span><h2>{rank.current.name}</h2><strong>{progress.xp} XP</strong>{rank.next ? <><div className="mini-progress"><span style={{ width: `${Math.max(0, Math.min(100, (progress.xp - rank.current.xp) / (rank.next.xp - rank.current.xp) * 100))}%` }}/></div><small>Faltan {rank.next.xp - progress.xp} XP para {rank.next.name}</small></> : <small>Rango máximo alcanzado</small>}</div><ul><li>+10 XP por acertar una pregunta nueva.</li><li>+5 XP la primera vez que corregís un error.</li><li>+10 XP por completar una sesión.</li><li>+20 XP al desbloquear un logro.</li></ul><p>No se pierde XP. Las repeticiones, recargas y sesiones reiniciadas no duplican recompensas.</p></div>}{progressSection === 'achievements' && <div className="achievement-grid">{achievementCatalog.map(item => { const state = progress.achievements[item.id] ?? { progress: 0, target: item.target }; return <article className={state.unlockedAt ? 'unlocked' : state.progress ? 'in-progress' : 'locked'} key={item.id}><span>{state.unlockedAt ? 'Desbloqueado' : state.progress ? 'En progreso' : 'Bloqueado'}</span><h2>{item.title}</h2><p>{item.description}</p><div className="mini-progress"><i style={{ width: `${Math.min(100, state.progress / state.target * 100)}%` }}/></div><small>{state.progress}/{state.target}{state.unlockedAt ? ` · ${new Date(state.unlockedAt).toLocaleDateString()}` : ''}</small></article>; })}</div>}</>}{progressTab === 'levels' && <div className="stats-scroll"><h2>Cobertura y precisión por dominio</h2>{domainStats.map(item => <article className="stat-row" key={item.label}><div><b>{item.label}</b><small>{item.unique}/{item.total} únicas · {item.attempts} intentos · precisión {item.accuracy ?? '—'}{item.accuracy === null ? '' : '%'}</small></div><div className="mini-progress"><span style={{ width: `${item.coverage}%` }}/></div></article>)}<h2>Por dificultad</h2>{difficultyStats.map(item => <article className="stat-row" key={item.label}><div><b>{levelNames[item.label as Difficulty]}</b><small>{item.unique}/{item.total} únicas · precisión {item.accuracy ?? '—'}{item.accuracy === null ? '' : '%'}</small></div><div className="mini-progress"><span style={{ width: `${item.coverage}%` }}/></div></article>)}<details><summary>Ver estadísticas por tema</summary>{topicStats.map(item => <article className="stat-row" key={item.label}><div><b>{item.label}</b><small>{item.unique}/{item.total} · precisión {item.accuracy ?? '—'}{item.accuracy === null ? '' : '%'}</small></div><div className="mini-progress"><span style={{ width: `${item.coverage}%` }}/></div></article>)}</details></div>}{progressTab === 'mistakes' && (mistakes.length ? <div className="mistake-list scroll-list">{mistakes.map(item => <article key={item.question!.id}><span>{item.count} {item.count === 1 ? 'error' : 'errores'}</span><strong>{item.question!.topic}</strong><p>{item.question!.prompt}</p></article>)}</div> : <div className="inline-empty">Todavía no hay errores registrados en este curso.</div>)}</div><button className="reset" onClick={() => { if (window.confirm(`¿Reiniciar solamente el progreso de ${course.title}?`)) reset(); }}>Reiniciar este curso</button></section>}

      {view === 'settings' && <section className="settings-view"><div className="page-heading compact-page-heading"><p className="eyebrow">Preferencias locales</p><h1>Configuración</h1></div><div className="settings-list compact-settings"><label><span><strong>Texto ampliado</strong><small>Mejora la legibilidad.</small></span><input type="checkbox" checked={preferences.largeText} onChange={event => updatePreference('largeText', event.target.checked)}/></label><label><span><strong>Reducir movimiento</strong><small>Desactiva transiciones.</small></span><input type="checkbox" checked={preferences.reducedMotion} onChange={event => updatePreference('reducedMotion', event.target.checked)}/></label></div><section className="install-panel" aria-label="Instalación de la aplicación"><div><strong>{isStandalone ? 'Study Hub está instalada' : 'Usar como aplicación'}</strong><p>{isStandalone ? 'Se está ejecutando en modo independiente.' : installPrompt ? 'Instalala para abrirla sin las barras del navegador.' : 'En iPhone/iPad: Compartir → Agregar a pantalla de inicio. En otros navegadores, buscá Instalar aplicación en el menú.'}</p></div>{installPrompt && !isStandalone && <button className="secondary" onClick={installApp}>Instalar</button>}</section><details className="about-panel"><summary>Acerca de Study Hub</summary><div><h2>Identidad independiente</h2><p>Study Hub guarda preferencias y progreso localmente. Sus iconos son originales y genéricos; no usa logos oficiales ni afirma afiliación o aprobación de organismos certificadores.</p><p>Contenido demostrativo. No se solicitan permisos ni se envían datos a servicios externos.</p></div></details></section>}
    </main>

    <footer><span>Study Hub · Centro multicertificación</span><span>Contenido demostrativo · progreso local e independiente</span></footer>
    <nav className="bottom-nav" aria-label="Navegación móvil"><button className={navSection === 'home' ? 'active' : ''} onClick={() => navigate('home')}><Icon name="home" size={21}/><span>Inicio</span></button><button className={navSection === 'practice' ? 'active' : ''} onClick={() => navigate('practice')}><Icon name="practice" size={21}/><span>Practicar</span></button><button className={navSection === 'library' ? 'active' : ''} onClick={() => navigate('library')}><Icon name="library" size={21}/><span>Biblioteca</span></button><button className={navSection === 'progress' ? 'active' : ''} onClick={() => navigate('progress')}><Icon name="progress" size={21}/><span>Progreso</span></button></nav>
  </div>;
}

export default App;
