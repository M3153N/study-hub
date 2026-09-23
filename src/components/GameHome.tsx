import { useRef, useState, type PointerEvent } from 'react';
import { Avatar } from './Avatar';
import { Icon, type IconName } from './Icons';
import type { AvatarFrame, AvatarId } from '../core/profile';

export type HomeStyle = 'minimal' | 'adventure' | 'dashboard';
export type HomeMetric = 'xp' | 'rank' | 'accuracy' | 'coverage';
export interface HomeTool { id: string; category: 'training' | 'library' | 'tracking'; title: string; description: string; icon: IconName; action: () => void; count?: string; }

interface Props {
  alias: string; avatar: AvatarId; frame: AvatarFrame; style: HomeStyle; courseTitle: string;
  xp: number; rank: string; nextXp?: number; accuracy: number; coverage: number;
  sessionLabel?: string; onPrimary: () => void; onProfile: () => void;
  cards: HomeTool[]; hidden: string[]; metrics: HomeMetric[]; reducedMotion: boolean;
  onMove: (id: string, direction: -1 | 1) => void; onMoveTo: (source: string, target: string) => void;
  onToggle: (id: string) => void; onToggleMetric: (metric: HomeMetric) => void; onRestore: () => void;
}

const categories = ['training','library','tracking'] as const;
const categoryNames = { training: 'Entrenar', library: 'Biblioteca', tracking: 'Seguimiento' };
const metricNames: Record<HomeMetric,string> = { xp:'XP', rank:'Rango', accuracy:'Precisión', coverage:'Cobertura' };

export function GameHome(props: Props) {
  const [category, setCategory] = useState<(typeof categories)[number]>('training');
  const [sheetOpen, setSheetOpen] = useState(false);
  const touchStart = useRef<{x:number;y:number}|null>(null);
  const dragId = useRef<string | null>(null);
  const longPress = useRef<number | undefined>(undefined);
  const visible = props.cards.filter(card => card.category === category && !props.hidden.includes(card.id));
  const limited = props.style === 'minimal' ? visible.slice(0, 2) : visible.slice(0, 4);
  const progress = props.nextXp ? Math.max(0, Math.min(100, props.xp / props.nextXp * 100)) : 100;

  function finishSwipe(event: PointerEvent) {
    const start = touchStart.current; touchStart.current = null;
    if (!start || props.reducedMotion) return;
    const dx = event.clientX - start.x; const dy = event.clientY - start.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    const index = categories.indexOf(category);
    const next = dx < 0 ? Math.min(categories.length - 1, index + 1) : Math.max(0, index - 1);
    setCategory(categories[next]);
  }

  function pointerDown(event: PointerEvent, id: string) {
    if (event.pointerType === 'mouse') return;
    longPress.current = window.setTimeout(() => { dragId.current = id; navigator.vibrate?.(15); }, 380);
  }

  function pointerUp(event: PointerEvent) {
    if (longPress.current) window.clearTimeout(longPress.current);
    if (!dragId.current) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-card-id]')?.dataset.cardId;
    if (target && target !== dragId.current) props.onMoveTo(dragId.current, target);
    dragId.current = null;
  }

  return <section className={`game-home home-style-${props.style}`} onPointerDown={event => { touchStart.current = { x:event.clientX, y:event.clientY }; }} onPointerUp={finishSwipe}>
    <div className="game-profile"><button onClick={props.onProfile} aria-label="Abrir perfil"><Avatar id={props.avatar} frame={props.frame}/></button><div><small>{props.courseTitle}</small><strong>{props.alias || 'Estudiante anónimo'}</strong><span>{props.rank} · {props.xp} XP</span></div>{props.style !== 'minimal' && <div className="rank-progress" aria-label={`${Math.round(progress)}% hacia el próximo rango`}><i style={{width:`${progress}%`}}/></div>}</div>
    <article className="activity-card"><div><small>{props.sessionLabel ? 'Retomá donde quedaste' : 'Partida libre'}</small><h1>{props.sessionLabel ?? 'Entrená a tu manera'}</h1><p>{props.sessionLabel ? 'Tus respuestas y posición están guardadas.' : 'Elegí preguntas, dificultad y modalidad en una sesión configurable.'}</p></div><button className="primary" onClick={props.onPrimary}>{props.sessionLabel ? 'Continuar' : 'Jugar ahora'}</button></article>
    {props.style === 'adventure' && <section className="adventure-strip"><span>✦ Ruta de aprendizaje</span><strong>{props.rank}</strong><small>La Campaña llegará en v0.9. No hay capítulos ni bloqueos activos.</small></section>}
    {props.style === 'dashboard' && <section className="home-metrics">{props.metrics.includes('xp') && <article><span>XP</span><strong>{props.xp}</strong></article>}{props.metrics.includes('rank') && <article><span>Rango</span><strong>{props.rank}</strong></article>}{props.metrics.includes('accuracy') && <article><span>Precisión</span><strong>{props.accuracy || '—'}{props.accuracy ? '%' : ''}</strong></article>}{props.metrics.includes('coverage') && <article><span>Cobertura</span><strong>{props.coverage}%</strong></article>}</section>}
    <div className="tool-zone" onPointerDown={event => { touchStart.current = {x:event.clientX,y:event.clientY}; }} onPointerUp={finishSwipe}><div className="tool-zone-head"><div className="category-tabs" role="tablist">{categories.map(item => <button key={item} role="tab" aria-selected={category===item} className={category===item?'active':''} onClick={()=>setCategory(item)}>{categoryNames[item]}</button>)}</div><button className="tool-edit" onClick={()=>setSheetOpen(true)} aria-label="Personalizar inicio">Editar</button></div><div className="game-tool-grid">{limited.length ? limited.map(card => <button key={card.id} className="game-tool" onClick={card.action}><span><Icon name={card.icon} size={23}/></span><strong>{card.title}</strong><small>{card.count ?? card.description}</small></button>) : <div className="home-empty"><strong>Sin accesos visibles</strong><span>Podés restaurarlos desde Editar.</span></div>}</div></div>
    {sheetOpen && <div className="sheet-backdrop" onClick={()=>setSheetOpen(false)}><section className="bottom-sheet" role="dialog" aria-modal="true" aria-label="Personalizar inicio" onClick={event=>event.stopPropagation()}><div className="sheet-handle"/><header><div><small>Centro de actividad</small><h2>Personalizar inicio</h2></div><button onClick={()=>setSheetOpen(false)} aria-label="Cerrar">×</button></header><div className="sheet-scroll"><fieldset><legend>Métricas visibles</legend><div className="metric-toggles">{(Object.keys(metricNames) as HomeMetric[]).map(metric=><label key={metric}><input type="checkbox" checked={props.metrics.includes(metric)} onChange={()=>props.onToggleMetric(metric)}/>{metricNames[metric]}</label>)}</div></fieldset><div className="sortable-tools">{props.cards.map((card,index)=><div key={card.id} data-card-id={card.id} draggable onDragStart={()=>{dragId.current=card.id;}} onDragOver={event=>event.preventDefault()} onDrop={()=>{if(dragId.current) props.onMoveTo(dragId.current,card.id); dragId.current=null;}} onPointerDown={event=>pointerDown(event,card.id)} onPointerUp={pointerUp}><label><input type="checkbox" checked={!props.hidden.includes(card.id)} onChange={()=>props.onToggle(card.id)}/><Icon name={card.icon} size={19}/><span>{card.title}</span></label><div><button disabled={index===0} onClick={()=>props.onMove(card.id,-1)} aria-label={`Subir ${card.title}`}>↑</button><button disabled={index===props.cards.length-1} onClick={()=>props.onMove(card.id,1)} aria-label={`Bajar ${card.title}`}>↓</button></div></div>)}</div></div><button className="secondary sheet-restore" onClick={props.onRestore}>Restaurar distribución</button></section></div>}
  </section>;
}
