import { useMemo, useState, type CSSProperties } from 'react';
import { certifications, getCertification } from './certifications';
import { Icon, type IconName } from './components/Icons';
import { ResourceView, type ResourceKind } from './components/StudyResources';
import { useCourseProgress } from './core/progress';
import { levelNames, levels, shuffle, type Choice, type Difficulty, type QuizMode, type SessionState } from './core/types';

type View = 'home' | 'practice' | 'quiz' | 'library' | 'resource' | 'simulations' | 'progress' | 'settings';
type SessionSize = 5 | 10 | 20 | 'all';
type HomeCategory = 'training' | 'library' | 'tracking';
interface Preferences { reducedMotion: boolean; largeText: boolean; }

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
  const course = getCertification(courseId);
  const { progress, setProgress, reset } = useCourseProgress(courseId);
  const session = progress.activeSession;
  const current = session ? course.questions.find(question => question.id === session.questionIds[session.position]) : undefined;
  const selected = current && session ? session.answers[current.id] : undefined;
  const accuracy = progress.answered ? Math.round((progress.correct / progress.answered) * 100) : 0;
  const counts = useMemo(() => Object.fromEntries(levels.map(level => [level, course.questions.filter(question => question.difficulty === level).length])) as Record<Difficulty, number>, [course]);
  const mistakes = useMemo(() => Object.entries(progress.mistakes).sort((a, b) => b[1] - a[1]).map(([id, count]) => ({ question: course.questions.find(item => item.id === id), count })).filter(item => item.question), [progress.mistakes, course]);

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
    const questions = course.questions.filter(question => nextMode === 'random' || question.difficulty === level);
    if (!questions.length) return;
    const amount = requestedSize === 'all' ? questions.length : Math.min(requestedSize, questions.length);
    const start = nextMode === 'linear' ? progress.linear[level] % questions.length : 0;
    const ordered = nextMode === 'random' ? shuffle(questions) : [...questions.slice(start), ...questions.slice(0, start)];
    const nextSession: SessionState = { id: `${course.id}-${Date.now()}`, mode: nextMode, difficulty: nextMode === 'linear' ? level : null, questionIds: ordered.slice(0, amount).map(question => question.id), position: 0, answers: {}, startedAt: Date.now(), source };
    setProgress(previous => ({ ...previous, activeSession: nextSession }));
    navigate('quiz');
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

  return <div className={`app-shell motif-${course.theme.motif} ${preferences.reducedMotion ? 'reduce-motion' : ''} ${preferences.largeText ? 'large-text' : ''}`} style={style}>
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

      {view === 'library' && <section><div className="page-heading"><p className="eyebrow">{course.shortTitle} · recursos demostrativos</p><h1>Biblioteca</h1><p>Elegí una herramienta. Cada sección obtiene su contenido directamente del paquete de esta certificación.</p></div><div className="library-grid">{studyCards.filter(card => ['Glosario','Mapas conceptuales','Cuadros comparativos','Material de lectura','Flashcards','Fórmulas','Consejos de examen'].includes(card.title)).map(card => <button key={card.title} onClick={card.action}><span><Icon name={card.icon} size={29}/></span><strong>{card.title}</strong><small>{card.description}</small><em>Abrir recurso <Icon name="arrow" size={15}/></em></button>)}</div></section>}

      {view === 'resource' && <ResourceView kind={resource} course={course} onBack={() => navigate('library')}/>}

      {view === 'practice' && <section className="practice-view"><div className="page-heading"><p className="eyebrow">Práctica · {course.shortTitle}</p><h1>Armá tu sesión</h1><p>Elegí modalidad, extensión y dificultad. El tamaño siempre respeta el banco disponible.</p></div>{session && <div className="resume-banner"><div><strong>Sesión guardada</strong><p>Pregunta {session.position + 1} de {session.questionIds.length}. Podés retomarla sin perder respuestas.</p></div><button className="primary" onClick={() => navigate('quiz')}>Reanudar</button></div>}<div className="config-grid"><article className="config-card"><span className="step">1</span><h2>Modalidad</h2><div className="segmented"><button className={mode === 'random' ? 'selected' : ''} onClick={() => setMode('random')}>Aleatoria<small>Todos los niveles</small></button><button className={mode === 'linear' ? 'selected' : ''} onClick={() => setMode('linear')}>Lineal<small>Por dificultad</small></button></div></article><article className="config-card"><span className="step">2</span><h2>Cantidad</h2><div className="size-options">{sizeOptions.map(size => { const available = mode === 'random' ? course.questions.length : counts[difficulty]; const effective = size === 'all' ? available : Math.min(size, available); return <button className={sessionSize === size ? 'selected' : ''} key={size} onClick={() => setSessionSize(size)}><b>{size === 'all' ? 'Todas' : size}</b><small>{effective} disponibles</small></button>; })}</div></article><article className={`config-card ${mode === 'random' ? 'disabled-card' : ''}`}><span className="step">3</span><h2>Dificultad</h2>{mode === 'random' ? <p>El modo aleatorio combina todos los niveles.</p> : <div className="difficulty-options">{levels.map(level => <button className={difficulty === level ? 'selected' : ''} key={level} onClick={() => setDifficulty(level)}><span>{levelNames[level]}<small>{counts[level]} preguntas</small></span><b>{progress.linear[level]}/{counts[level]}</b></button>)}</div>}</article></div><button className="primary launch" onClick={() => startSession()}>Iniciar sesión</button></section>}

      {view === 'simulations' && <section className="simulation-view"><button className="back-link" onClick={() => navigate('home')}>← Volver al inicio</button><div className="simulation-card"><span className="simulation-icon"><Icon name="exam" size={42}/></span><p className="eyebrow">Simulacro demostrativo</p><h1>Recorré todo el banco</h1><p>Una sesión aleatoria con las {course.questions.length} preguntas disponibles de {course.shortTitle}. Podés salir y reanudar en cualquier momento. No representa un examen oficial.</p><div className="simulation-facts"><span><b>{course.questions.length}</b> preguntas</span><span><b>Sin límite</b> de tiempo</span><span><b>Con</b> explicaciones</span></div><button className="primary" onClick={() => startSession('random', difficulty, 'all', 'simulation')}>Iniciar simulacro</button></div></section>}

      {view === 'quiz' && session && current && <section className="quiz-wrap"><button className="back-link" onClick={() => navigate('home')}>← Guardar y salir</button><div className="quiz-meta"><span>{course.shortTitle} · {session.source === 'simulation' ? 'Simulacro' : session.mode === 'random' ? 'Aleatoria' : levelNames[session.difficulty!]}</span><span>{session.position + 1} / {session.questionIds.length}</span></div><div className="progress-bar"><span style={{ width: `${((session.position + Number(selected !== undefined)) / session.questionIds.length) * 100}%` }}/></div><article className="question-card"><div className="tags"><span>Demostrativa</span><span>{current.domain}</span><span>{levelNames[current.difficulty]}</span></div><p className="question-number">Pregunta {session.position + 1}</p><h2>{current.prompt}</h2><div className="options">{current.options.map((option, index) => { const choice = index as Choice; const state = selected === undefined ? '' : choice === current.correct ? 'correct' : choice === selected ? 'wrong' : 'muted'; return <button className={state} key={option} onClick={() => answer(choice)} disabled={selected !== undefined}><b>{String.fromCharCode(65 + index)}</b><span>{option}</span></button>; })}</div>{selected !== undefined && <div className={`feedback ${selected === current.correct ? 'success' : 'error'}`}><div><strong>{selected === current.correct ? 'Respuesta correcta' : 'Revisá este concepto'}</strong><p>{current.explanation}</p></div><button className="primary" onClick={advance}>{session.position + 1 === session.questionIds.length ? 'Ver progreso' : 'Siguiente →'}</button></div>}</article></section>}

      {view === 'quiz' && (!session || !current) && <div className="resource-empty"><h1>No hay una sesión activa</h1><p>Configurá una práctica para comenzar.</p><button className="primary" onClick={() => navigate('practice')}>Configurar sesión</button></div>}

      {view === 'progress' && <section><div className="page-heading"><p className="eyebrow">Mi progreso · {course.shortTitle}</p><h1>Tu avance</h1><p>Las estadísticas pertenecen solamente a esta certificación.</p></div><div className="progress-layout"><article className="progress-score"><ProgressRing value={accuracy}/><div><span>Precisión global</span><h2>{progress.answered ? `${progress.correct} de ${progress.answered}` : 'Sin respuestas'}</h2><p>{progress.answered ? 'Cada sesión actualiza este indicador.' : 'Completá tu primera práctica para ver resultados.'}</p></div></article><article className="panel"><p className="eyebrow">Recorridos lineales</p><div className="level-summary">{levels.map(level => <div key={level}><span><b>{levelNames[level]}</b><small>{counts[level]} preguntas</small></span><strong>{progress.linear[level]}/{counts[level]}</strong></div>)}</div></article></div><section className="review-section"><h2>Oportunidades de repaso</h2>{mistakes.length ? <div className="mistake-list">{mistakes.slice(0, 5).map(item => <article key={item.question!.id}><span>{item.count} {item.count === 1 ? 'error' : 'errores'}</span><strong>{item.question!.topic}</strong><p>{item.question!.prompt}</p></article>)}</div> : <div className="inline-empty">Todavía no hay errores registrados en este curso.</div>}</section><button className="reset" onClick={() => { if (window.confirm(`¿Reiniciar solamente el progreso de ${course.title}?`)) reset(); }}>Reiniciar este curso</button></section>}

      {view === 'settings' && <section className="settings-view"><div className="page-heading"><p className="eyebrow">Preferencias locales</p><h1>Configuración</h1><p>Ajustes de visualización guardados únicamente en este navegador.</p></div><div className="settings-list"><label><span><strong>Texto ampliado</strong><small>Aumenta el tamaño base para facilitar la lectura.</small></span><input type="checkbox" checked={preferences.largeText} onChange={event => updatePreference('largeText', event.target.checked)}/></label><label><span><strong>Reducir movimiento</strong><small>Desactiva transiciones y desplazamientos animados.</small></span><input type="checkbox" checked={preferences.reducedMotion} onChange={event => updatePreference('reducedMotion', event.target.checked)}/></label></div><article className="legal-note"><Icon name={course.theme.icon} size={30}/><div><h2>Identidad independiente</h2><p>Los iconos de Study Hub son ilustraciones originales y genéricas. La plataforma no usa logos oficiales ni afirma afiliación o aprobación de organismos certificadores. La arquitectura permite incorporar activos autorizados en el futuro desde la configuración del curso.</p></div></article></section>}
    </main>

    <footer><span>Study Hub · Centro multicertificación</span><span>Contenido demostrativo · progreso local e independiente</span></footer>
    <nav className="bottom-nav" aria-label="Navegación móvil"><button className={navSection === 'home' ? 'active' : ''} onClick={() => navigate('home')}><Icon name="home" size={21}/><span>Inicio</span></button><button className={navSection === 'practice' ? 'active' : ''} onClick={() => navigate('practice')}><Icon name="practice" size={21}/><span>Practicar</span></button><button className={navSection === 'library' ? 'active' : ''} onClick={() => navigate('library')}><Icon name="library" size={21}/><span>Biblioteca</span></button><button className={navSection === 'progress' ? 'active' : ''} onClick={() => navigate('progress')}><Icon name="progress" size={21}/><span>Progreso</span></button></nav>
  </div>;
}

export default App;
