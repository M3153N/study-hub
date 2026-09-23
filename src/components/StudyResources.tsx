import { useState } from 'react';
import type * as React from 'react';
import type { CertificationPack, Comparison, ConceptMap, Formula } from '../core/types';
import { Icon } from './Icons';
import { ConceptIcon } from './ConceptIcons';

export type ResourceKind = 'glossary' | 'maps' | 'comparisons' | 'reading' | 'flashcards' | 'formulas' | 'tips';

const labels: Record<ResourceKind, { title: string; description: string }> = {
  glossary: { title: 'Glosario', description: 'Conceptos esenciales y definiciones rápidas.' },
  maps: { title: 'Mapas conceptuales', description: 'Explorá relaciones entre ideas y procesos.' },
  comparisons: { title: 'Cuadros comparativos', description: 'Contrastá enfoques, prácticas y conceptos.' },
  reading: { title: 'Material de lectura', description: 'Lecciones breves para consolidar fundamentos.' },
  flashcards: { title: 'Flashcards', description: 'Recuperación activa en tarjetas interactivas.' },
  formulas: { title: 'Fórmulas', description: 'Expresiones clave con interpretación práctica.' },
  tips: { title: 'Consejos de examen', description: 'Estrategias para responder con mayor claridad.' },
};

function EmptyResource({ title }: { title: string }) {
  return <div className="resource-empty"><span>◇</span><h2>Contenido en preparación</h2><p>Este curso todavía no dispone de {title.toLowerCase()}. La sección está lista para incorporar recursos desde su configuración.</p></div>;
}

function ConceptMapView({ map, course }: { map: ConceptMap; course: CertificationPack }) {
  const [selected, setSelected] = useState(map.nodes[0]?.id ?? '');
  const active = map.nodes.find(node => node.id === selected) ?? map.nodes[0];
  const related=active?course.questions.filter(question=>`${question.domain} ${question.topic} ${question.prompt}`.toLowerCase().includes(active.label.toLowerCase())).slice(0,3):[];
  return <article className="concept-shell"><div className="resource-intro"><span>Demostración interactiva</span><h2>{map.title}</h2><p>{map.description}</p></div><div className="concept-canvas" role="group" aria-label={map.title}>{map.nodes.map((node, index) => { const icon = course.conceptIcons?.[node.label]; return <button key={node.id} className={`${selected === node.id ? 'active' : ''} ${node.parentId ? 'child-node' : 'root-node'}`} onClick={() => setSelected(node.id)} style={{ '--node-index': index } as React.CSSProperties}>{icon && <ConceptIcon id={icon} size={20}/>}<span>{node.label}</span><small>{node.parentId ? 'Concepto relacionado' : 'Idea central'}</small></button>; })}</div>{active && <div className="concept-detail" aria-live="polite"><span>Concepto seleccionado</span><h3>{active.label}</h3><p>{active.detail}</p>{related.length>0&&<details><summary>{related.length} preguntas relacionadas</summary>{related.map(question=><p key={question.id}><b>{question.topic}:</b> {question.prompt}</p>)}</details>}</div>}</article>;
}

function ComparisonExplorer({comparison}:{comparison:Comparison}){const choices=comparison.columns.slice(1);const [left,setLeft]=useState(0);const [right,setRight]=useState(Math.min(1,choices.length-1));return <article className="comparison-explorer"><h3>Comparador interactivo</h3><div><label>Concepto A<select value={left} onChange={e=>setLeft(Number(e.target.value))}>{choices.map((value,index)=><option value={index} key={value}>{value}</option>)}</select></label><label>Concepto B<select value={right} onChange={e=>setRight(Number(e.target.value))}>{choices.map((value,index)=><option value={index} key={value}>{value}</option>)}</select></label></div><section>{comparison.rows.map(row=><article key={row[0]}><strong>{row[0]}</strong><span>{row[left+1]}</span><span>{row[right+1]}</span></article>)}</section></article>}

function FormulaExercise({formula}:{formula:Formula}){const [values,setValues]=useState({EV:80,AC:100,PV:90,BAC:200});const result=formula.id.includes('cpi')?values.EV/values.AC:formula.id.includes('spi')?values.EV/values.PV:formula.id.includes('eac')?values.BAC/(values.EV/values.AC):null;return <article className="formula-exercise"><span>{formula.name}</span><strong>{formula.expression}</strong><div>{Object.keys(values).map(key=><label key={key}>{key}<input type="number" value={values[key as keyof typeof values]} onChange={e=>setValues(current=>({...current,[key]:Number(e.target.value)}))}/></label>)}</div><output>{result===null||!Number.isFinite(result)?'Ingresá valores válidos':`Resultado: ${result.toFixed(2)}`}</output><p>{formula.description}</p></article>}

export function ResourceView({ kind, course, onBack }: { kind: ResourceKind; course: CertificationPack; onBack: () => void }) {
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const meta = labels[kind];
  const cards = course.resources.flashcards;
  const card = cards[cardIndex];

  function moveCard(direction: number) {
    setCardIndex(current => (current + direction + cards.length) % cards.length);
    setFlipped(false);
  }

  return <section className="resource-view">
    <button className="back-link" onClick={onBack}>← Volver a la biblioteca</button>
    <div className="page-heading compact-heading"><p className="eyebrow">Biblioteca · {course.shortTitle}</p><h1>{meta.title}</h1><p>{meta.description}</p></div>

    {kind === 'glossary' && (course.glossary.length ? <div className="glossary-grid">{course.glossary.map((item, index) => { const icon = course.conceptIcons?.[item.term]; return <article key={item.term}><span>{icon ? <ConceptIcon id={icon} size={24}/> : String(index + 1).padStart(2, '0')}</span><h2>{item.term}</h2><p>{item.definition}</p></article>; })}</div> : <EmptyResource title={meta.title} />)}
    {kind === 'maps' && (course.resources.maps.length ? <div className="resource-stack">{course.resources.maps.map(map => <ConceptMapView key={map.id} map={map} course={course} />)}</div> : <EmptyResource title={meta.title} />)}
    {kind === 'comparisons' && (course.resources.comparisons.length ? <div className="resource-stack">{course.resources.comparisons.map(comparison => <article className="comparison-card" key={comparison.id}><div className="resource-intro"><span>Demostración</span><h2>{comparison.title}</h2></div><ComparisonExplorer comparison={comparison}/><div className="table-scroll" tabIndex={0}><table><thead><tr>{comparison.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{comparison.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div><small className="swipe-hint">Deslizá horizontalmente para explorar la tabla</small></article>)}</div> : <EmptyResource title={meta.title} />)}
    {kind === 'reading' && (course.resources.lessons.length ? <div className="lesson-grid">{course.resources.lessons.map(lesson => <article className="lesson" key={lesson.id}><div className="lesson-cover"><Icon name="book" size={30}/><span>{lesson.duration}</span></div><div><p className="eyebrow">Lección demostrativa</p><h2>{lesson.title}</h2><p>{lesson.summary}</p>{lesson.sections.map((section, index) => <details key={section.title} open={index === 0}><summary><span>{index + 1}</span>{section.title}</summary><p>{section.body}</p></details>)}</div></article>)}</div> : <EmptyResource title={meta.title} />)}
    {kind === 'flashcards' && (card ? <div className="flashcard-stage"><div className="card-counter">Tarjeta {cardIndex + 1} de {cards.length}</div><button className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(value => !value)} aria-label={flipped ? 'Mostrar pregunta' : 'Mostrar respuesta'}><span>{flipped ? 'Respuesta' : 'Pregunta'}</span><strong>{flipped ? card.back : card.front}</strong><small>Tocá para {flipped ? 'volver' : 'revelar'}</small></button><div className="flash-controls"><button className="secondary" onClick={() => moveCard(-1)} disabled={cards.length < 2}>← Anterior</button><button className="primary" onClick={() => moveCard(1)} disabled={cards.length < 2}>Siguiente →</button></div></div> : <EmptyResource title={meta.title} />)}
    {kind === 'formulas' && (course.resources.formulas.length ? <div className="formula-grid interactive-formulas">{course.resources.formulas.map(formula => <FormulaExercise key={formula.id} formula={formula}/>)}</div> : <EmptyResource title={meta.title} />)}
    {kind === 'tips' && (course.resources.tips.length ? <div className="tips-grid">{course.resources.tips.map((tip, index) => <article key={tip.id}><span><Icon name="tips" size={22}/>{String(index + 1).padStart(2, '0')}</span><h2>{tip.title}</h2><p>{tip.body}</p></article>)}</div> : <EmptyResource title={meta.title} />)}
  </section>;
}
