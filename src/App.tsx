import { useMemo, useState, type CSSProperties } from 'react';
import { certifications, getCertification } from './certifications';
import { useCourseProgress } from './core/progress';
import { levelNames, levels, shuffle, type Choice, type Difficulty, type QuizMode, type SessionState } from './core/types';

type View = 'dashboard' | 'practice' | 'quiz' | 'glossary';
type SessionSize = 5 | 10 | 20 | 'all';

const courseKey = 'study-hub:selected-course:v1';
const sizeOptions: SessionSize[] = [5, 10, 20, 'all'];

function initialCourse() {
  const saved = localStorage.getItem(courseKey);
  return certifications.some(course => course.id === saved) ? saved! : 'capm';
}

function ProgressRing({ value }: { value: number }) {
  return <div className="ring" style={{ '--progress': `${value * 3.6}deg` } as CSSProperties}><span>{value}%</span><small>precisión</small></div>;
}

function App() {
  const [courseId, setCourseId] = useState(initialCourse);
  const [view, setView] = useState<View>('dashboard');
  const [mode, setMode] = useState<QuizMode>('random');
  const [difficulty, setDifficulty] = useState<Difficulty>('basico');
  const [sessionSize, setSessionSize] = useState<SessionSize>(5);
  const course = getCertification(courseId);
  const { progress, setProgress, reset } = useCourseProgress(courseId);
  const session = progress.activeSession;
  const current = session ? course.questions.find(question => question.id === session.questionIds[session.position]) : undefined;
  const selected = current && session ? session.answers[current.id] : undefined;
  const accuracy = progress.answered ? Math.round((progress.correct / progress.answered) * 100) : 0;
  const counts = useMemo(() => Object.fromEntries(levels.map(level => [level, course.questions.filter(question => question.difficulty === level).length])) as Record<Difficulty, number>, [course]);

  function changeCourse(id: string) {
    localStorage.setItem(courseKey, id);
    setCourseId(id);
    setView('dashboard');
  }

  function navigate(next: Exclude<View, 'quiz'>) {
    setView(next);
  }

  function startSession(nextMode = mode, level = difficulty) {
    const source = course.questions.filter(question => nextMode === 'random' || question.difficulty === level);
    if (!source.length) return;
    const requested = sessionSize === 'all' ? source.length : Math.min(sessionSize, source.length);
    const start = nextMode === 'linear' ? progress.linear[level] % source.length : 0;
    const ordered = nextMode === 'random' ? shuffle(source) : [...source.slice(start), ...source.slice(0, start)];
    const nextSession: SessionState = {
      id: `${course.id}-${Date.now()}`,
      mode: nextMode,
      difficulty: nextMode === 'linear' ? level : null,
      questionIds: ordered.slice(0, requested).map(question => question.id),
      position: 0,
      answers: {},
      startedAt: Date.now(),
    };
    setProgress(previous => ({ ...previous, activeSession: nextSession }));
    setView('quiz');
  }

  function answer(choice: Choice) {
    if (!session || !current || selected !== undefined) return;
    setProgress(previous => {
      const active = previous.activeSession;
      if (!active) return previous;
      return {
        ...previous,
        answered: previous.answered + 1,
        correct: previous.correct + Number(choice === current.correct),
        mistakes: choice === current.correct ? previous.mistakes : { ...previous.mistakes, [current.id]: (previous.mistakes[current.id] ?? 0) + 1 },
        activeSession: { ...active, answers: { ...active.answers, [current.id]: choice } },
      };
    });
  }

  function advance() {
    if (!session || !current || selected === undefined) return;
    const finished = session.position + 1 >= session.questionIds.length;
    setProgress(previous => {
      const active = previous.activeSession;
      if (!active) return previous;
      const linear = active.mode === 'linear' && active.difficulty
        ? { ...previous.linear, [active.difficulty]: (previous.linear[active.difficulty] + 1) % Math.max(counts[active.difficulty], 1) }
        : previous.linear;
      return { ...previous, linear, activeSession: finished ? undefined : { ...active, position: active.position + 1 } };
    });
    if (finished) setView('dashboard');
  }

  const answeredInSession = session ? Object.keys(session.answers).length : 0;
  const style = { '--accent': course.accent, '--accent-soft': course.accentSoft } as CSSProperties;

  return (
    <div className="app-shell" style={style}>
      <header className="topbar">
        <button className="brand" onClick={() => navigate('dashboard')} aria-label="Ir al dashboard"><span>SH</span><div>Study Hub<small>Aprendizaje continuo</small></div></button>
        <label className="course-picker"><span>Certificación</span><select aria-label="Cambiar certificación" value={courseId} onChange={event => changeCourse(event.target.value)}>{certifications.map(item => <option key={item.id} value={item.id}>{item.shortTitle}</option>)}</select></label>
        <nav className="desktop-nav" aria-label="Navegación principal">
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}>Inicio</button>
          <button className={view === 'practice' || view === 'quiz' ? 'active' : ''} onClick={() => navigate('practice')}>Practicar</button>
          <button className={view === 'glossary' ? 'active' : ''} onClick={() => navigate('glossary')}>Glosario</button>
        </nav>
      </header>

      <main>
        {view === 'dashboard' && <>
          <section className="course-hero">
            <div><p className="eyebrow">Curso activo · contenido demostrativo</p><h1>{course.title}</h1><p className="subtitle">{course.subtitle}</p><p>{course.description}</p><div className="hero-actions"><button className="primary" onClick={() => navigate('practice')}>Nueva sesión</button>{session && <button className="secondary" onClick={() => setView('quiz')}>Reanudar · {session.position + 1}/{session.questionIds.length}</button>}</div></div>
            <ProgressRing value={accuracy} />
          </section>

          <section className="stats" aria-label={`Progreso de ${course.title}`}>
            <article><span>Respondidas</span><strong>{progress.answered}</strong><small>historial del curso</small></article>
            <article><span>Correctas</span><strong>{progress.correct}</strong><small>{progress.answered ? `${accuracy}% de precisión` : 'Sin respuestas todavía'}</small></article>
            <article><span>Banco disponible</span><strong>{course.questions.length}</strong><small>preguntas demostrativas</small></article>
          </section>

          {progress.answered === 0 && <div className="empty-state"><span>◎</span><div><strong>Tu recorrido empieza acá</strong><p>Elegí un tamaño de sesión o avanzá por dificultad. El progreso se guarda automáticamente en este dispositivo.</p></div></div>}

          <section className="dashboard-grid">
            <article className="panel"><div className="panel-heading"><div><p className="eyebrow">Continuidad</p><h2>Tu sesión</h2></div><span className="status-dot" /></div>{session ? <><p>Tenés una sesión {session.mode === 'random' ? 'aleatoria' : `lineal · ${levelNames[session.difficulty!]}`} en curso.</p><div className="mini-progress"><span style={{ width: `${(answeredInSession / session.questionIds.length) * 100}%` }} /></div><div className="split"><small>{answeredInSession} respondidas</small><small>{session.questionIds.length} total</small></div><button className="primary wide" onClick={() => setView('quiz')}>Continuar sesión</button></> : <><p>No hay sesiones pendientes. Configurá una práctica que se adapte al tiempo disponible.</p><button className="secondary wide" onClick={() => navigate('practice')}>Configurar práctica</button></>}</article>
            <article className="panel"><p className="eyebrow">Progreso lineal</p><h2>Rutas por dificultad</h2><div className="level-summary">{levels.map(level => <div key={level}><span><b>{levelNames[level]}</b><small>{counts[level]} preguntas</small></span><strong>{progress.linear[level]}/{counts[level] || 0}</strong></div>)}</div></article>
          </section>
          <button className="reset" onClick={() => { if (window.confirm(`¿Reiniciar solamente el progreso de ${course.title}?`)) reset(); }}>Reiniciar este curso</button>
        </>}

        {view === 'practice' && <section className="practice-view">
          <div className="page-heading"><p className="eyebrow">{course.shortTitle}</p><h1>Armá tu sesión</h1><p>Elegí modalidad, extensión y dificultad. Nunca se pedirán más preguntas de las disponibles.</p></div>
          {session && <div className="resume-banner"><div><strong>Sesión en curso</strong><p>Pregunta {session.position + 1} de {session.questionIds.length} · tus respuestas están guardadas.</p></div><button className="primary" onClick={() => setView('quiz')}>Reanudar</button></div>}
          <div className="config-grid">
            <article className="config-card"><span className="step">1</span><h2>Modalidad</h2><div className="segmented"><button className={mode === 'random' ? 'selected' : ''} onClick={() => setMode('random')}>Aleatoria<small>Todos los niveles</small></button><button className={mode === 'linear' ? 'selected' : ''} onClick={() => setMode('linear')}>Lineal<small>Por dificultad</small></button></div></article>
            <article className="config-card"><span className="step">2</span><h2>Cantidad</h2><div className="size-options">{sizeOptions.map(size => { const available = mode === 'random' ? course.questions.length : counts[difficulty]; const effective = size === 'all' ? available : Math.min(size, available); return <button className={sessionSize === size ? 'selected' : ''} key={size} onClick={() => setSessionSize(size)}><b>{size === 'all' ? 'Todas' : size}</b><small>{effective} disponibles</small></button>; })}</div></article>
            <article className={`config-card ${mode === 'random' ? 'disabled-card' : ''}`}><span className="step">3</span><h2>Dificultad</h2>{mode === 'random' ? <p>El modo aleatorio combina automáticamente todos los niveles.</p> : <div className="difficulty-options">{levels.map(level => <button className={difficulty === level ? 'selected' : ''} key={level} onClick={() => setDifficulty(level)}><span>{levelNames[level]}<small>{counts[level]} preguntas</small></span><b>{progress.linear[level]}/{counts[level]}</b></button>)}</div>}</article>
          </div>
          <button className="primary launch" onClick={() => startSession()}>Iniciar {mode === 'random' ? 'sesión aleatoria' : `ruta ${levelNames[difficulty].toLowerCase()}`}</button>
        </section>}

        {view === 'quiz' && session && current && <section className="quiz-wrap">
          <button className="back" onClick={() => navigate('dashboard')}>← Guardar y salir</button>
          <div className="quiz-meta"><span>{course.shortTitle} · {session.mode === 'random' ? 'Aleatoria' : levelNames[session.difficulty!]}</span><span>{session.position + 1} / {session.questionIds.length}</span></div>
          <div className="progress-bar"><span style={{ width: `${((session.position + Number(selected !== undefined)) / session.questionIds.length) * 100}%` }} /></div>
          <article className="question-card">
            <div className="tags"><span>Demostrativa</span><span>{current.domain}</span><span>{levelNames[current.difficulty]}</span></div>
            <p className="question-number">Pregunta {session.position + 1}</p><h2>{current.prompt}</h2>
            <div className="options">{current.options.map((option, index) => { const choice = index as Choice; const state = selected === undefined ? '' : choice === current.correct ? 'correct' : choice === selected ? 'wrong' : 'muted'; return <button className={state} key={option} onClick={() => answer(choice)} disabled={selected !== undefined}><b>{String.fromCharCode(65 + index)}</b><span>{option}</span></button>; })}</div>
            {selected !== undefined && <div className={`feedback ${selected === current.correct ? 'success' : 'error'}`}><div><strong>{selected === current.correct ? 'Respuesta correcta' : 'Revisá este concepto'}</strong><p>{current.explanation}</p></div><button className="primary" onClick={advance}>{session.position + 1 === session.questionIds.length ? 'Completar sesión' : 'Siguiente →'}</button></div>}
          </article>
        </section>}

        {view === 'quiz' && (!session || !current) && <section className="empty-page"><span>◇</span><h1>No hay una sesión activa</h1><p>Configurá una nueva práctica para comenzar.</p><button className="primary" onClick={() => navigate('practice')}>Configurar sesión</button></section>}

        {view === 'glossary' && <section><div className="page-heading"><p className="eyebrow">Referencia rápida · {course.shortTitle}</p><h1>Glosario</h1><p>Conceptos esenciales de esta certificación.</p></div>{course.glossary.length ? <div className="glossary">{course.glossary.map(item => <article key={item.term}><span>Concepto</span><h2>{item.term}</h2><p>{item.definition}</p></article>)}</div> : <div className="empty-page"><h2>Glosario en preparación</h2><p>Próximamente encontrarás conceptos de este curso.</p></div>}</section>}
      </main>

      <footer><span>Study Hub · Plataforma multicertificación</span><span>Contenido demostrativo · progreso local e independiente</span></footer>
      <nav className="bottom-nav" aria-label="Navegación móvil"><button className={view === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}><b>⌂</b><span>Inicio</span></button><button className={view === 'practice' || view === 'quiz' ? 'active' : ''} onClick={() => navigate('practice')}><b>✦</b><span>Practicar</span></button><button className={view === 'glossary' ? 'active' : ''} onClick={() => navigate('glossary')}><b>≡</b><span>Glosario</span></button></nav>
    </div>
  );
}

export default App;
