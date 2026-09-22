import { useMemo, useState } from 'react';
import { capm } from './certifications/capm';
import { useProgress } from './core/progress';
import { levelNames, levels, shuffle, type Choice, type Difficulty, type Question } from './core/types';

type View = 'dashboard' | 'quiz' | 'glossary';
type QuizMode = 'random' | 'linear';

const pack = capm;

function ProgressRing({ value }: { value: number }) {
  return <div className="ring" style={{ '--progress': `${value * 3.6}deg` } as React.CSSProperties}><span>{value}%</span></div>;
}

export default function App() {
  const { progress, setProgress, reset } = useProgress();
  const [view, setView] = useState<View>('dashboard');
  const [mode, setMode] = useState<QuizMode>('random');
  const [difficulty, setDifficulty] = useState<Difficulty>('basico');
  const [queue, setQueue] = useState<Question[]>([]);
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<Choice | null>(null);

  const accuracy = progress.answered ? Math.round((progress.correct / progress.answered) * 100) : 0;
  const current = queue[position];
  const counts = useMemo(() => Object.fromEntries(levels.map(level => [level, pack.questions.filter(q => q.difficulty === level).length])) as Record<Difficulty, number>, []);

  function startQuiz(nextMode: QuizMode, level: Difficulty = difficulty) {
    const source = pack.questions.filter(question => nextMode === 'random' || question.difficulty === level);
    const start = nextMode === 'linear' ? progress.linear[level] % source.length : 0;
    setMode(nextMode);
    setDifficulty(level);
    setQueue(nextMode === 'random' ? shuffle(source) : source);
    setPosition(start);
    setSelected(null);
    setView('quiz');
  }

  function answer(choice: Choice) {
    if (selected !== null || !current) return;
    setSelected(choice);
    setProgress(previous => ({
      ...previous,
      answered: previous.answered + 1,
      correct: previous.correct + Number(choice === current.correct),
      mistakes: choice === current.correct ? previous.mistakes : { ...previous.mistakes, [current.id]: (previous.mistakes[current.id] ?? 0) + 1 },
      linear: mode === 'linear' ? { ...previous.linear, [difficulty]: (position + 1) % queue.length } : previous.linear,
    }));
  }

  function nextQuestion() {
    if (position + 1 >= queue.length) {
      setView('dashboard');
    } else {
      setPosition(value => value + 1);
      setSelected(null);
    }
  }

  return (
    <div className="app-shell">
      <header>
        <button className="brand" onClick={() => setView('dashboard')} aria-label="Ir al inicio"><span>SH</span><div>Study Hub<small>{pack.title}</small></div></button>
        <nav aria-label="Navegación principal">
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={view === 'glossary' ? 'active' : ''} onClick={() => setView('glossary')}>Glosario</button>
        </nav>
      </header>

      <main>
        {view === 'dashboard' && <>
          <section className="hero">
            <div><p className="eyebrow">Tu espacio de preparación</p><h1>Convertí conceptos en <em>confianza.</em></h1><p>{pack.subtitle}. Practicá a tu ritmo con preguntas de demostración y seguimiento local.</p></div>
            <ProgressRing value={accuracy} />
          </section>

          <section className="stats" aria-label="Resumen de progreso">
            <article><span>Preguntas respondidas</span><strong>{progress.answered}</strong></article>
            <article><span>Respuestas correctas</span><strong>{progress.correct}</strong></article>
            <article><span>Precisión global</span><strong>{accuracy}%</strong></article>
          </section>

          <section><div className="section-title"><div><p className="eyebrow">Elegí cómo avanzar</p><h2>Sesiones de práctica</h2></div></div>
            <div className="mode-grid">
              <article className="mode-card featured"><span className="card-icon">↝</span><h3>Modo aleatorio</h3><p>Mezcla las {pack.questions.length} preguntas y combina todos los niveles para una sesión dinámica.</p><button className="primary" onClick={() => startQuiz('random')}>Comenzar práctica</button></article>
              <article className="mode-card"><span className="card-icon">≡</span><h3>Ruta lineal</h3><p>Avanzá nivel por nivel. Tu posición se guarda automáticamente en este navegador.</p>
                <div className="levels">{levels.map(level => <button key={level} onClick={() => startQuiz('linear', level)}><span>{levelNames[level]}<small>{counts[level]} preguntas</small></span><b>{progress.linear[level]}/{counts[level]}</b></button>)}</div>
              </article>
            </div>
          </section>
          <button className="reset" onClick={() => { if (window.confirm('¿Reiniciar todo el progreso guardado?')) reset(); }}>Reiniciar progreso</button>
        </>}

        {view === 'quiz' && current && <section className="quiz-wrap">
          <button className="back" onClick={() => setView('dashboard')}>← Volver al dashboard</button>
          <div className="quiz-meta"><span>{mode === 'random' ? 'Modo aleatorio' : `Ruta ${levelNames[difficulty]}`}</span><span>{position + 1} / {queue.length}</span></div>
          <div className="progress-bar"><span style={{ width: `${((position + 1) / queue.length) * 100}%` }} /></div>
          <article className="question-card">
            <div className="tags"><span>{current.domain}</span><span>{levelNames[current.difficulty]}</span></div>
            <h2>{current.prompt}</h2>
            <div className="options">{current.options.map((option, index) => {
              const choice = index as Choice;
              const state = selected === null ? '' : choice === current.correct ? 'correct' : choice === selected ? 'wrong' : 'muted';
              return <button className={state} key={option} onClick={() => answer(choice)} disabled={selected !== null}><b>{String.fromCharCode(65 + index)}</b><span>{option}</span></button>;
            })}</div>
            {selected !== null && <div className={`feedback ${selected === current.correct ? 'success' : 'error'}`}><strong>{selected === current.correct ? '¡Correcto!' : 'Respuesta incorrecta'}</strong><p>{current.explanation}</p><button className="primary" onClick={nextQuestion}>{position + 1 === queue.length ? 'Finalizar sesión' : 'Siguiente pregunta →'}</button></div>}
          </article>
        </section>}

        {view === 'glossary' && <section><div className="section-title"><div><p className="eyebrow">Referencia rápida</p><h1>Glosario CAPM</h1></div></div><div className="glossary">{pack.glossary.map(item => <article key={item.term}><h3>{item.term}</h3><p>{item.definition}</p></article>)}</div></section>}
      </main>
      <footer><span>Study Hub · MVP</span><span>Contenido de demostración · Progreso almacenado localmente</span></footer>
    </div>
  );
}
