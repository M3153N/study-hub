import type { ConceptIconId } from '../core/types';
import type * as React from 'react';

export const conceptIconCatalog: Record<ConceptIconId, { label: string; group: 'capm' | 'iso27001' | 'itil4' }> = {
  stakeholder:{label:'Interesados',group:'capm'}, 'project-manager':{label:'Project Manager',group:'capm'}, pmo:{label:'PMO',group:'capm'}, 'product-owner':{label:'Product Owner',group:'capm'}, sponsor:{label:'Project Sponsor',group:'capm'}, team:{label:'Team',group:'capm'}, risk:{label:'Risk',group:'capm'}, planning:{label:'Planificación',group:'capm'}, schedule:{label:'Schedule',group:'capm'}, scope:{label:'Scope',group:'capm'}, cost:{label:'Cost',group:'capm'}, quality:{label:'Quality',group:'capm'}, predictive:{label:'Predictivo',group:'capm'}, agile:{label:'Agile',group:'capm'}, hybrid:{label:'Híbrido',group:'capm'}, scrum:{label:'Scrum',group:'capm'}, kanban:{label:'Kanban',group:'capm'},
  isms:{label:'SGSI',group:'iso27001'}, control:{label:'Control',group:'iso27001'}, audit:{label:'Auditoría',group:'iso27001'}, 'incident-security':{label:'Incidente de seguridad',group:'iso27001'}, asset:{label:'Activo',group:'iso27001'},
  service:{label:'Servicio',group:'itil4'}, 'value-stream':{label:'Flujo de valor',group:'itil4'}, 'incident-service':{label:'Incidente de servicio',group:'itil4'}, change:{label:'Cambio',group:'itil4'}, 'continual-improvement':{label:'Mejora continua',group:'itil4'},
};

const paths: Record<ConceptIconId, React.ReactNode> = {
  stakeholder:<><circle cx="12" cy="8" r="3"/><path d="M5 20c1-5 4-7 7-7s6 2 7 7M4 8h2M18 8h2"/></>,
  'project-manager':<><circle cx="8" cy="7" r="3"/><path d="M3 20c1-5 3-7 5-7s4 2 5 7M15 5h6v11h-6zM17 9h2M17 12h2"/></>,
  pmo:<><path d="M4 21V8l8-5 8 5v13M8 21v-6h8v6M8 10h1M12 10h1M16 10h1"/></>,
  'product-owner':<><circle cx="7" cy="7" r="3"/><path d="M2 20c1-5 3-7 5-7s4 2 5 7M14 5h7v14h-7M16 9h3M16 13h3"/></>,
  sponsor:<><path d="m12 3 3 6 6 .8-4.5 4.3 1.2 6.1L12 17l-5.7 3.2 1.2-6.1L3 9.8 9 9l3-6Z"/></>,
  team:<><circle cx="12" cy="7" r="3"/><circle cx="5" cy="10" r="2"/><circle cx="19" cy="10" r="2"/><path d="M6 21c.7-5 3-8 6-8s5.3 3 6 8M1 20c.4-3 1.8-5 4-5M23 20c-.4-3-1.8-5-4-5"/></>,
  risk:<><path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5M12 18h.01"/></>, planning:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h4M7 17h8"/></>, schedule:<><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></>, scope:<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/></>, cost:<><circle cx="12" cy="12" r="9"/><path d="M15 8.5c-1-1-6-1-6 1.5s6 1.5 6 4-5 2.5-6 .8M12 5v14"/></>, quality:<><path d="m12 3 3 3 4-.5.5 4 3 2.5-3 2.5-.5 4-4-.5-3 3-3-3-4 .5-.5-4-3-2.5 3-2.5.5-4 4 .5 3-3Z"/><path d="m8 12 2.5 2.5L16 9"/></>, predictive:<><path d="M4 5h5v5H4zM15 5h5v5h-5zM15 15h5v5h-5zM9 7.5h6M17.5 10v5"/></>, agile:<><path d="M5 8a8 8 0 0 1 13-2l2 2M19 16a8 8 0 0 1-13 2l-2-2"/><path d="M20 3v5h-5M4 21v-5h5"/></>, hybrid:<><path d="M4 6h7v12H4zM13 6h7v5h-7zM13 13h7v5h-7z"/></>, scrum:<><circle cx="12" cy="12" r="8"/><path d="m8 11 3 3 5-6M12 2v3M12 19v3"/></>, kanban:<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16M5 8h2M11 11h2M17 7h2"/></>,
  isms:<><path d="M12 3 20 6v6c0 5-3 8-8 10-5-2-8-5-8-10V6l8-3Z"/><path d="M9 12h6M12 9v6"/></>, control:<><path d="M4 6h16M7 6v12M4 18h16M17 6v12"/><circle cx="7" cy="10" r="2"/><circle cx="17" cy="14" r="2"/></>, audit:<><path d="M5 3h11v18H5zM8 7h5M8 11h5M8 15h3"/><circle cx="17" cy="16" r="4"/><path d="m20 19 2 2"/></>, 'incident-security':<><path d="M12 3 3 20h18L12 3Z"/><path d="M12 9v5M12 18h.01"/></>, asset:<><path d="M3 8 12 3l9 5-9 5-9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
  service:<><path d="M4 5h16v11H4zM8 20h8M12 16v4"/><path d="m8 10 2 2 5-5"/></>, 'value-stream':<><circle cx="4" cy="12" r="2"/><circle cx="20" cy="12" r="2"/><path d="M6 12h4l2-5 3 10 2-5h1"/></>, 'incident-service':<><path d="M4 5h16v11H4zM8 20h8M12 16v4M12 8v4M12 14h.01"/></>, change:<><path d="M4 8h12l-3-3M20 16H8l3 3"/><path d="m16 8-3 3M8 16l3-3"/></>, 'continual-improvement':<><path d="M5 17 10 12l3 3 6-8"/><path d="M14 7h5v5"/><path d="M4 21h16"/></>,
};

export function ConceptIcon({ id, size = 24, label }: { id: ConceptIconId; size?: number; label?: string }) {
  const accessible = label ?? conceptIconCatalog[id].label;
  return <svg className="concept-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={accessible}>{paths[id]}</svg>;
}
