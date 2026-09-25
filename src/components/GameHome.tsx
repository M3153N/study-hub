import { useState } from 'react';
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
  quick: { size:string; difficulty:string; topic:string; pool:string; topics:string[] };
  onQuickChange:(key:'size'|'difficulty'|'topic'|'pool',value:string)=>void; onQuickStart:()=>void;
}

export function GameHome(props: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const mainModes=props.cards.filter(card=>['campaign','practice','training'].includes(card.id));
  return <section className={`game-home game-home-simple home-style-${props.style}`}>
    <div className="home-course-chip">{props.courseTitle}<span>{props.rank} · {props.xp} XP</span></div>
    <article className="activity-card continue-card"><span className="continue-icon"><Icon name="play" size={30}/></span><div><small>{props.sessionLabel?'Actividad en curso':'Próxima actividad'}</small><h1>{props.sessionLabel??'Comenzar campaña'}</h1><p>{props.sessionLabel?'Tu posición y respuestas están guardadas.':'Avanzá por el mapa de aprendizaje.'}</p></div><button className="primary" onClick={props.onPrimary}>{props.sessionLabel?'Continuar':'Jugar'}</button></article>
    {props.style==='dashboard'&&<section className="home-metrics">{props.metrics.includes('xp')&&<article><span>XP</span><strong>{props.xp}</strong></article>}{props.metrics.includes('accuracy')&&<article><span>Precisión</span><strong>{props.accuracy||'—'}{props.accuracy?'%':''}</strong></article>}{props.metrics.includes('coverage')&&<article><span>Cobertura</span><strong>{props.coverage}%</strong></article>}</section>}
    <div className="main-mode-grid">{mainModes.map(card=><button key={card.id} className={`main-mode-card mode-${card.id}`} onClick={()=>card.id==='practice'?setSheetOpen(true):card.action()}><span><Icon name={card.icon} size={34}/></span><strong>{card.title}</strong><small>{card.id==='practice'?'Personalizar y jugar':card.count??card.description}</small></button>)}</div>
    {sheetOpen&&<div className="sheet-backdrop" onClick={()=>setSheetOpen(false)}><section className="bottom-sheet quick-practice-sheet" role="dialog" aria-modal="true" aria-label="Configurar partida libre" onClick={event=>event.stopPropagation()}><div className="sheet-handle"/><header><div><small>Partida libre</small><h2>Configuración rápida</h2></div><button onClick={()=>setSheetOpen(false)} aria-label="Cerrar">×</button></header><div className="quick-practice-grid"><label>Cantidad<select value={props.quick.size} onChange={event=>props.onQuickChange('size',event.target.value)}><option value="5">5</option><option value="10">10</option><option value="20">20</option><option value="all">Todas</option></select></label><label>Dificultad<select value={props.quick.difficulty} onChange={event=>props.onQuickChange('difficulty',event.target.value)}><option value="all">Todas</option><option value="basico">Básico</option><option value="intermedio">Intermedio</option><option value="avanzado">Avanzado</option></select></label><label>Tema<select value={props.quick.topic} onChange={event=>props.onQuickChange('topic',event.target.value)}><option value="all">Todos</option>{props.quick.topics.map(topic=><option key={topic}>{topic}</option>)}</select></label><label>Banco<select value={props.quick.pool} onChange={event=>props.onQuickChange('pool',event.target.value)}><option value="all">Mixto</option><option value="new">Nuevas</option><option value="mistakes">Errores</option></select></label></div><button className="primary quick-start" onClick={()=>{setSheetOpen(false);props.onQuickStart()}}>Iniciar partida</button></section></div>}
  </section>;
}
