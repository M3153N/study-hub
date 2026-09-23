import { useEffect, useRef } from 'react';
import type { CertificationPack } from '../core/types';
import type { LocalProfile } from '../core/profile';
import { Avatar } from './Avatar';

interface Props {
  open: boolean;
  profile: LocalProfile;
  globalXp: number;
  globalRank: string;
  courseId: string;
  courses: readonly CertificationPack[];
  onClose: () => void;
  onCourse: (id: string) => void;
  onProfile: () => void;
  onAppearance: () => void;
  onSettings: () => void;
}

export function ProfileMenu(props: Props) {
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (props.open) closeButton.current?.focus(); }, [props.open]);
  if (!props.open) return null;
  const active = props.courses.find(course => course.id === props.courseId);
  return <div className="sheet-backdrop profile-menu-backdrop" onClick={props.onClose} onKeyDown={event=>{if(event.key==='Escape')props.onClose()}}>
    <section className="bottom-sheet profile-menu" role="dialog" aria-modal="true" aria-label="Cuenta local y certificación" onClick={event=>event.stopPropagation()}>
      <div className="sheet-handle"/>
      <header><div className="profile-menu-identity"><Avatar id={props.profile.avatar} frame={props.profile.frame} size={48}/><div><small>Perfil local</small><h2>{props.profile.alias || 'Estudiante anónimo'}</h2><span>{props.globalRank} · {props.globalXp} XP global</span></div></div><button ref={closeButton} onClick={props.onClose} aria-label="Cerrar menú">×</button></header>
      <div className="sheet-scroll profile-menu-content">
        <label className="profile-course-picker"><span>Certificación activa</span><select aria-label="Cambiar certificación" value={props.courseId} onChange={event=>props.onCourse(event.target.value)}>{props.courses.map(course=><option key={course.id} value={course.id}>{course.shortTitle}</option>)}</select><small>{active?.title}</small></label>
        <div className="profile-menu-actions"><button onClick={props.onProfile}>Perfil y avatares</button><button onClick={props.onAppearance}>Apariencia</button><button onClick={props.onSettings}>Configuración</button></div>
        <p>Todo se guarda únicamente en este navegador. No requiere cuenta ni conexión externa.</p>
      </div>
    </section>
  </div>;
}
