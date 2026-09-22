import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { certifications, getCertification } from './certifications';
import { Icon, type IconName } from './components/Icons';
import { ResourceView, type ResourceKind } from './components/StudyResources';
import { useCourseProgress } from './core/progress';
import { levelNames, levels, shuffle, type Choice, type Difficulty, type QuizMode, type SessionState } from './core/types';

type View = 'home' | 'practice' | 'quiz' | 'library' | 'resource' | 'simulations' | 'progress' | 'settings';
type SessionSize = 5 | 10 | 20 | 'all';
type HomeCategory = 'training' | 'library' | 'tracking';
type ProgressTab = 'summary' | 'levels' | 'mistakes';
interface Preferences { reducedMotion: boolean; largeText: boolean; }
interface InstallPromptEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>; }

const courseKey = 'study-hub:selected-course:v1';
const preferencesKey = 'study-hub:preferences:v1';
const sizeOptions: SessionSize[] = [5, 10, 20, 'all'];

function initialCourse() {
  const saved = localStorage.getItem(courseKey);
  return certifications.some(course => course.id === saved) ? saved! : 'capm';
}

function initialPreferences(): Preferences {
  try { return { reducedMotion: false, largeText: false, ...JSON.parse(localStorage.getItem(preferencesKey) ?? '{}') as Partial<Preferences> }; }
  catch { return { reducedMotion: false, largeText: false }; }
}

function ProgressRing({ value }: { value: number }) {
  return <div className="ring" style={{ '--progress': `${value * 3.6}deg` } as CSSProperties}><span>{value}%</span><small>precisión</small></div>;
}

function App() {
  const [courseId, setCourseId] = useState(initialCourse);
  const [view, setView] = useState<View>('home');
  const [resource, setResource] = useState<ResourceKind>('glossary');
  const [mode, setMode] = useState<QuizMode>('random');
  const [difficulty, setDifficulty] = useState<Difficulty>('basico');
  const [sessionSize, setSessionSize] = useState<SessionSize>(5);
  const [preferences, setPreferences] = useState(initialPreferences);
  const [homeCategory, setHomeCategory] = useState<HomeCategory>('training');
  const [homePage, setHomePage] = useState(0);
  const [progressTab, setProgressTab] = useState<ProgressTab>('summary');
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(() => window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
  const course = getCertification(courseId);
  const { progress, setProgress, reset } = useCourseProgress(courseId);
  const session = progress.activeSession;
  const current = session ? course.questions.find(question => question.id === session.questionIds[session.position]) : undefined;
  const selected = current && session ? session.answers[current.id] : undefined;
  const accuracy = progress.answered ? Math.round((progress.correct / progress.answered) * 100) : 0;
  const counts = useMemo(() => Object.fromEntries(levels.map(level => [level, course.questions.filter(question => question.difficulty === level).length])) as Record<Difficulty, number>, [course]);
  const mistakes = useMemo(() => Object.entries(progress.mistakes).sort((a, b) => b[1] - a[1]).map(([id, count]) => ({ question: course.questions.find(item => item.id === id), count })).filter(item => item.question), [progress.mistakes, course]);

  useEffect(() => {
    const displayMode = window.matchMedia('(display-mode: standalone)');
    const syncStandalone = () => setIsStandalone(displayMode.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const capturePrompt = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', syncStandalone);
    displayMode.addEventListener?.('change', syncStandalone);
    return () => { window.removeEventListener('beforeinstallprompt', capturePrompt); window.removeEventListener('appinstalled', syncStandalone); displayMode.removeEventListener?.('change', syncStandalone); };
  }, []);

  const style = {
    '--accent': course.theme.primary,
    '--accent-soft': course.theme.secondary,
    '--course-glow': course.theme.glow,
  } as CSSProperties;

  function changeCourse(id: string) {
    localStorage.setItem(courseKey, id);
    setCourseId(id);
    setView('home');
  }

  function navigate(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: preferences.reducedMotion ? 'auto' : 'smooth' });
  }

  function openResource(kind: ResourceKind) {
    setResource(kind);
    navigate('resource');
  }

  function updatePreference(key: keyof Preferences, value: boolean) {
    const next = { ...preferences, [key]: value };
    localStorage.setItem(preferencesKey, JSON.stringify(next));
    setPreferences(next);
  }

  function startSession(nextMode = mode, level = difficulty, requestedSize = sessionSize, source: 'practice' | 'simulation' = 'practice') {
    if (session && !window.confirm('Hay una sesión activa. ¿Querés reemplazarla por una nueva? Se conservará el progreso general, pero se descartará esta sesión.')) return;
    const questions = course.questions.filter(question => nextMode === 'random' || question.difficulty === level);
    if (!questions.length) return;
    const amount = requestedSize === 'all' ? questions.length : Math.min(requestedSize, questions.length);
    const start = nextMode === 'linear' ? progress.linear[level] % questions.length : 0;
    const ordered = nextMode === 'random' ? shuffle(questions) : [...questions.slice(start), ...questions.slice(0, start)];
    const nextSession: SessionState = { id: `${course.id}-${Date.now()}`, mode: nextMode, difficulty: nextMode === 'linear' ? level : null, questionIds: ordered.slice(0, amount).map(question => question.id), position: 0, answers: {}, startedAt: Date.now(), source };
    setProgress(previous => ({ ...previous, activeSession: nextSession }));
    navigate('quiz');
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
      return { ...previous, answered: previous.answered + 1, correct: previous.correct + Number(choice === current.correct), mistakes: choice === current.correct ? previous.mistakes : { ...previous.mistakes, [current.id]: (previous.mistakes[current.id] ?? 0) + 1 }, activeSession: { ...active, answers: { ...active.answers, [current.id]: choice } } };
    });
  }

  function advance() {
    if (!session || !current || selected === undefined) return;
    const finished = session.position + 1 >= session.questionIds.length;
    setProgress(previous => {
      const active = previous.activeSession;
      if (!active) return previous;
      const linear = active.mode === 'linear' && active.difficulty ? { ...previous.linear, [active.difficulty]: (previous.linear[active.difficulty] + 1) % Math.max(counts[active.difficulty], 1) } : previous.linear;
      return { ...previous, linear, activeSession: finished ? undefined : { ...active, position: active.position + 1 } };
    });
    if (finished) navigate('progress');
  }

  const studyCards: { title: string; description: string; icon: IconName; action: () => void; count?: string }[] = [
    { title: 'Práctica', description: 'Sesiones configurables y recorridos por nivel.', icon: 'practice', action: () => navigate('practice'), count: `${course.questions.length} preguntas` },
    { title: 'Simulacros', description: 'Una vuelta completa al banco demostrativo.', icon: 'exam', action: () => navigate('simulations') },
    { title: 'Glosario', description: 'Definiciones esenciales para repasar rápido.', icon: 'book', action: () => openResource('glossary'), count: `${course.glossary.length} conceptos` },
    { title: 'Mapas conceptuales', description: 'Relaciones explorables entre ideas clave.', icon: 'map', action: () => openResource('maps') },
    { title: 'Cuadros comparativos', description: 'Diferencias importantes en una sola vista.', icon: 'compare', action: () => openResource('comparisons') },
    { title: 'Material de lectura', description: 'Lecciones breves y progresivas.', icon: 'book', action: () => openResource('reading') },
    { title: 'Flashcards', description: 'Practicá recuperación activa de conceptos.', icon: 'cards', action: () => openResource('flashcards'), count: `${course.resources.flashcards.length} tarjetas` },
    { title: 'Fórmulas', description: 'Expresiones, significado e interpretación.', icon: 'formula', action: () => openResource('formulas') },
    { title: 'Consejos de examen', description: 'Estrategias aplicables el día de la prueba.', icon: 'tips', action: () => openResource('tips') },
    { title: 'Mi progreso', description: 'Precisión, recorridos y oportunidades de mejora.', icon: 'chart', action: () => navigate('progress') },
  ];

  const categoryCards = studyCards.filter(card => {
    if (homeCategory === 'training') return ['Práctica', 'Simulacros'].includes(card.title);
    if (homeCategory === 'tracking') return card.title === 'Mi progreso';
    return !['Práctica', 'Simulacros', 'Mi progreso'].includes(card.title);
  });
  const pageCount = Math.ceil(categoryCards.length / 2);
  const visibleCards = categoryCards.slice(homePage * 2, homePage * 2 + 2);

  function selectHomeCategory(category: HomeCategory) {
    setHomeCategory(category);
    setHomePage(0);
  }

  const navSection = view === 'resource' ? 'library' : view === 'quiz' ? 'practice' : view;

  return <div className={`app-shell motif-${course.theme.motif} ${preferences.reducedMotion ? 'reduce-motion' : ''} ${preferences.largeText ? 'large-text' : ''} ${isStandalone ? 'standalone' : ''}`} style={style}>
    <header className="topbar">
      <button className="brand" onClick={() => navigate('home')} aria-label="Ir al centro de estudio"><span><Icon name={course.theme.icon} size={24}/></span><div>Study Hub<small>Centro de estudio</small></div></button>
      <label className="course-picker"><span>Certificación</span><select aria-label="Cambiar certificación" value={courseId} onChange={event => changeCourse(event.target.value)}>{certifications.map(item => <option key={item.id} value={item.id}>{item.shortTitle}</option>)}</select></label>
      <nav className="desktop-nav" aria-label="Navegación principal"><button className={navSection === 'home' ? 'active' : ''} onClick={() => navigate('home')}>Inicio</button><button className={navSection === 'practice' ? 'active' : ''} onClick={() => navigate('practice')}>Practicar</button><button className={navSection === 'library' ? 'active' : ''} onClick={() => navigate('library')}>Biblioteca</button><button className={navSection === 'progress' ? 'active' : ''} onClick={() => navigate('progress')}>Progreso</button></nav>
      <button className={`settings-button ${view === 'settings' ? 'active' : ''}`} onClick={() => navigate('settings')} aria-label="Abrir configuración"><Icon name="settings" size={21}/></button>
    </header>

    <main className="app-main">
      {view === 'home' && <section className="home-view view-panel">
        <section className="study-hero"><div className="course-emblem"><Icon name={course.theme.icon} size={48}/><i/><i/></div><div><p className="eyebrow">Tu centro de estudio · recursos demostrativos</p><h1>{course.title}</h1><p className="subtitle">{course.subtitle}</p><p>{course.description}</p><div className="hero-actions">{session ? <button className="primary" onClick={() => navigate('quiz')}>Continuar sesión · {session.position + 1}/{session.questionIds.length}</button> : <button className="primary" onClick={() => navigate('practice')}>Empezar a practicar</button>}<button className="secondary" onClick={() => navigate('library')}>Explorar biblioteca</button></div></div><ProgressRing value={accuracy}/></section>
        <section className="quick-stats" aria-label={`Resumen de ${course.title}`}><article><span>Respondidas</span><strong>{progress.answered}</strong></article><article><span>Precisión</span><strong>{progress.answered ? `${accuracy}%` : '—'}</strong></article><article><span>Ruta actual</span><strong>{Math.max(...Object.values(progress.linear))}/{Math.max(...Object.values(counts), 0)}</strong></article></section>
        <div className="home-tools"><div className="section-heading"><div><p className="eyebrow">Todo en un lugar</p><h2>¿Qué querés estudiar?</h2></div><span>{studyCards.length} herramientas</span></div><div className="category-tabs" role="tablist" aria-label="Categorías del centro de estudio"><button role="tab" aria-selected={homeCategory === 'training'} className={homeCategory === 'training' ? 'active' : ''} onClick={() => selectHomeCategory('training')}>Entrenar</button><button role="tab" aria-selected={homeCategory === 'library'} className={homeCategory === 'library' ? 'active' : ''} onClick={() => selectHomeCategory('library')}>Biblioteca</button><button role="tab" aria-selected={homeCategory === 'tracking'} className={homeCategory === 'tracking' ? 'active' : ''} onClick={() => selectHomeCategory('tracking')}>Seguimiento</button></div><section className="study-grid">{visibleCards.map(card => <button key={card.title} className="study-card" onClick={card.action}><span className="tool-icon"><Icon name={card.icon} size={25}/></span><span className="tool-copy"><strong>{card.title}</strong><small>{card.description}</small>{card.count && <em>{card.count}</em>}</span><Icon name="arrow" size={18}/></button>)}</section>{pageCount > 1 && <div className="tool-pagination" aria-label="Páginas de herramientas">{Array.from({ length: pageCount }, (_, index) => <button key={index} aria-label={`Página ${index + 1}`} aria-current={homePage === index ? 'page' : undefined} className={homePage === index ? 'active' : ''} onClick={() => setHomePage(index)}/>)}</div>}</div>
      </section>}

      {view === 'library' && <section className="library-view"><div className="page-heading compact-page-heading"><p className="eyebrow">{course.shortTitle} · recursos demostrativos</p><h1>Biblioteca</h1></div><div className="library-grid">{studyCards.filter(card => ['Glosario','Mapas conceptuales','Cuadros comparativos','Material de lectura','Flashcards','Fórmulas','Consejos de examen'].includes(card.title)).map(card => <button key={card.title} onClick={card.action}><span><Icon name={card.icon} size={27}/></span><strong>{card.title}</strong><Icon name="arrow" size={16}/></button>)}</div></section>}

      {view === 'resource' && <ResourceView kind={resource} course={course} onBack={() => navigate('library')}/>}

      {view === 'practice' && <section className="practice-view"><div className="page-heading compact-page-heading"><p className="eyebrow">Práctica · {course.shortTitle}</p><h1>Armá tu sesión</h1></div>{session && <div className="resume-banner compact-resume"><div><strong>Sesión guardada</strong><p>{session.position + 1}/{session.questionIds.length} · respuestas y posición conservadas</p></div><button className="secondary" onClick={() => navigate('quiz')}>Reanudar</button></div>}<form className="practice-form" onSubmit={event => { event.preventDefault(); startSession(); }}><label><span>Modalidad</span><select value={mode} onChange={event => setMode(event.target.value as QuizMode)}><option value="random">Aleatoria · todos los niveles</option><option value="linear">Lineal · por dificultad</option></select></label><label><span>Cantidad</span><select value={sessionSize} onChange={event => setSessionSize(event.target.value === 'all' ? 'all' : Number(event.target.value) as SessionSize)}>{sizeOptions.map(size => { const available = mode === 'random' ? course.questions.length : counts[difficulty]; const effective = size === 'all' ? available : Math.min(size, available); return <option key={size} value={size}>{size === 'all' ? `Todas (${effective})` : `${size} (${effective} disponibles)`}</option>; })}</select></label><label><span>Dificultad</span><select value={difficulty} disabled={mode === 'random'} onChange={event => setDifficulty(event.target.value as Difficulty)}>{levels.map(level => <option key={level} value={level}>{levelNames[level]} · {counts[level]} preguntas · ruta ${progress.linear[level]}/{counts[level]}</option>)}</select></label><button className="primary practice-launch" type="submit">{session ? 'Iniciar y reemplazar sesión' : 'Iniciar sesión'}</button></form><p className="form-note">La cantidad se ajusta automáticamente al banco disponible.</p></section>}

      {view === 'simulations' && <section className="simulation-view"><button className="back-link" onClick={() => navigate('home')}>← Volver al inicio</button><div className="simulation-card"><span className="simulation-icon"><Icon name="exam" size={42}/></span><p className="eyebrow">Simulacro demostrativo</p><h1>Recorré todo el banco</h1><p>Una sesión aleatoria con las {course.questions.length} preguntas disponibles de {course.shortTitle}. Podés salir y reanudar en cualquier momento. No representa un examen oficial.</p><div className="simulation-facts"><span><b>{course.questions.length}</b> preguntas</span><span><b>Sin límite</b> de tiempo</span><span><b>Con</b> explicaciones</span></div><button className="primary" onClick={() => startSession('random', difficulty, 'all', 'simulation')}>Iniciar simulacro</button></div></section>}

      {view === 'quiz' && session && current && <section className="quiz-wrap"><button className="back-link" onClick={() => navigate('home')}>← Guardar y salir</button><div className="quiz-meta"><span>{course.shortTitle} · {session.source === 'simulation' ? 'Simulacro' : session.mode === 'random' ? 'Aleatoria' : levelNames[session.difficulty!]}</span><span>{session.position + 1} / {session.questionIds.length}</span></div><div className="progress-bar"><span style={{ width: `${((session.position + Number(selected !== undefined)) / session.questionIds.length) * 100}%` }}/></div><article className="question-card"><div className="tags"><span>Demostrativa</span><span>{current.domain}</span><span>{levelNames[current.difficulty]}</span></div><p className="question-number">Pregunta {session.position + 1}</p><h2>{current.prompt}</h2><div className="options">{current.options.map((option, index) => { const choice = index as Choice; const state = selected === undefined ? '' : choice === current.correct ? 'correct' : choice === selected ? 'wrong' : 'muted'; return <button className={state} key={option} onClick={() => answer(choice)} disabled={selected !== undefined}><b>{String.fromCharCode(65 + index)}</b><span>{option}</span></button>; })}</div>{selected !== undefined && <div className={`feedback ${selected === current.correct ? 'success' : 'error'}`}><div><strong>{selected === current.correct ? 'Respuesta correcta' : 'Revisá este concepto'}</strong><p>{current.explanation}</p></div><button className="primary" onClick={advance}>{session.position + 1 === session.questionIds.length ? 'Ver progreso' : 'Siguiente →'}</button></div>}</article></section>}

      {view === 'quiz' && (!session || !current) && <div className="resource-empty"><h1>No hay una sesión activa</h1><p>Configurá una práctica para comenzar.</p><button className="primary" onClick={() => navigate('practice')}>Configurar sesión</button></div>}

      {view === 'progress' && <section className="progress-view"><div className="page-heading compact-page-heading"><p className="eyebrow">Mi progreso · {course.shortTitle}</p><h1>Tu avance</h1></div><div className="progress-tabs" role="tablist" aria-label="Secciones de progreso">{([['summary','Resumen'],['levels','Niveles'],['mistakes','Errores']] as [ProgressTab,string][]).map(([key,label]) => <button type="button" role="tab" aria-selected={progressTab === key} className={progressTab === key ? 'active' : ''} key={key} onClick={() => setProgressTab(key)}>{label}{key === 'mistakes' && mistakes.length ? <b>{mistakes.length}</b> : null}</button>)}</div><div className="progress-tab-panel">{progressTab === 'summary' && <article className="progress-score compact-score"><ProgressRing value={accuracy}/><div><span>Precisión global</span><h2>{progress.answered ? `${progress.correct} de ${progress.answered}` : 'Sin respuestas'}</h2><p>{progress.answered ? `${progress.answered} respuestas registradas en ${course.shortTitle}.` : 'Completá tu primera práctica para ver resultados.'}</p></div></article>}{progressTab === 'levels' && <div className="level-summary compact-levels">{levels.map(level => <div key={level}><span><b>{levelNames[level]}</b><small>{counts[level]} preguntas</small></span><strong>{progress.linear[level]}/{counts[level]}</strong></div>)}</div>}{progressTab === 'mistakes' && (mistakes.length ? <div className="mistake-list scroll-list">{mistakes.map(item => <article key={item.question!.id}><span>{item.count} {item.count === 1 ? 'error' : 'errores'}</span><strong>{item.question!.topic}</strong><p>{item.question!.prompt}</p></article>)}</div> : <div className="inline-empty">Todavía no hay errores registrados en este curso.</div>)}</div><button className="reset" onClick={() => { if (window.confirm(`¿Reiniciar solamente el progreso de ${course.title}?`)) reset(); }}>Reiniciar este curso</button></section>}

      {view === 'settings' && <section className="settings-view"><div className="page-heading compact-page-heading"><p className="eyebrow">Preferencias locales</p><h1>Configuración</h1></div><div className="settings-list compact-settings"><label><span><strong>Texto ampliado</strong><small>Mejora la legibilidad.</small></span><input type="checkbox" checked={preferences.largeText} onChange={event => updatePreference('largeText', event.target.checked)}/></label><label><span><strong>Reducir movimiento</strong><small>Desactiva transiciones.</small></span><input type="checkbox" checked={preferences.reducedMotion} onChange={event => updatePreference('reducedMotion', event.target.checked)}/></label></div><section className="install-panel" aria-label="Instalación de la aplicación"><div><strong>{isStandalone ? 'Study Hub está instalada' : 'Usar como aplicación'}</strong><p>{isStandalone ? 'Se está ejecutando en modo independiente.' : installPrompt ? 'Instalala para abrirla sin las barras del navegador.' : 'En iPhone/iPad: Compartir → Agregar a pantalla de inicio. En otros navegadores, buscá Instalar aplicación en el menú.'}</p></div>{installPrompt && !isStandalone && <button className="secondary" onClick={installApp}>Instalar</button>}</section><details className="about-panel"><summary>Acerca de Study Hub</summary><div><h2>Identidad independiente</h2><p>Study Hub guarda preferencias y progreso localmente. Sus iconos son originales y genéricos; no usa logos oficiales ni afirma afiliación o aprobación de organismos certificadores.</p><p>Contenido demostrativo. No se solicitan permisos ni se envían datos a servicios externos.</p></div></details></section>}
    </main>

    <footer><span>Study Hub · Centro multicertificación</span><span>Contenido demostrativo · progreso local e independiente</span></footer>
    <nav className="bottom-nav" aria-label="Navegación móvil"><button className={navSection === 'home' ? 'active' : ''} onClick={() => navigate('home')}><Icon name="home" size={21}/><span>Inicio</span></button><button className={navSection === 'practice' ? 'active' : ''} onClick={() => navigate('practice')}><Icon name="practice" size={21}/><span>Practicar</span></button><button className={navSection === 'library' ? 'active' : ''} onClick={() => navigate('library')}><Icon name="library" size={21}/><span>Biblioteca</span></button><button className={navSection === 'progress' ? 'active' : ''} onClick={() => navigate('progress')}><Icon name="progress" size={21}/><span>Progreso</span></button></nav>
  </div>;
}

export default App;
