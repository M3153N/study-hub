import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import type { CertificationPack, Choice, ExamState } from '../core/types';

export function ExamView({course,state,onChange,onSubmit,onExit}:{course:CertificationPack;state:ExamState;onChange:(next:ExamState)=>void;onSubmit:(force?:boolean|MouseEvent<HTMLButtonElement>)=>void;onExit:()=>void}){
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer)},[]);
  const remaining=Math.max(0,state.durationSeconds-Math.floor((now-state.startedAt)/1000));
  useEffect(()=>{if(remaining===0)onSubmit(true)},[remaining]);
  const question=course.questions.find(item=>item.id===state.questionIds[state.position]);
  const answered=Object.keys(state.answers).length; const review=state.marked.length;
  const minutes=Math.floor(remaining/60),seconds=remaining%60;
  const palette=useMemo(()=>state.questionIds.map(id=>course.questions.find(q=>q.id===id)),[state.questionIds,course]);
  if(!question)return null;
  return <section className="exam-view"><header><button className="back-link" onClick={onExit}>← Guardar y salir</button><div><small>Simulacro demostrativo · el reloj continúa al cerrar</small><strong>{minutes}:{String(seconds).padStart(2,'0')}</strong></div><button className="secondary" onClick={onSubmit}>Entregar</button></header><div className="exam-overview"><span>{answered}/{state.questionIds.length} respondidas</span><span>{review} marcadas</span><button onClick={()=>onChange({...state,marked:state.marked.includes(question.id)?state.marked.filter(id=>id!==question.id):[...state.marked,question.id]})}>{state.marked.includes(question.id)?'★ Marcada':'☆ Marcar'}</button></div><article className="question-card exam-question"><p className="question-number">Pregunta {state.position+1}</p><h2>{question.prompt}</h2><div className="options">{question.options.map((option,index)=><button className={state.answers[question.id]===index?'selected':''} key={option} onClick={()=>onChange({...state,answers:{...state.answers,[question.id]:index as Choice}})}><b>{String.fromCharCode(65+index)}</b><span>{option}</span></button>)}</div></article><div className="exam-palette" aria-label="Navegación de preguntas">{palette.map((item,index)=><button key={item?.id??index} className={`${index===state.position?'active':''} ${item&&state.answers[item.id]!==undefined?'answered':''} ${item&&state.marked.includes(item.id)?'marked':''}`} onClick={()=>onChange({...state,position:index})}>{index+1}</button>)}</div><div className="exam-actions"><button className="secondary" disabled={state.position===0} onClick={()=>onChange({...state,position:state.position-1})}>← Anterior</button><button className="primary" disabled={state.position===state.questionIds.length-1} onClick={()=>onChange({...state,position:state.position+1})}>Siguiente →</button></div></section>;
}
