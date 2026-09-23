import type { CertificationPack } from '../../core/types';

// Preguntas originales de DEMOSTRACIÓN. No son preguntas oficiales de examen
// ni sustituyen las publicaciones acreditadas de ITIL.
export const itil4: CertificationPack = {
  id: 'itil4', shortTitle: 'ITIL 4', title: 'ITIL 4 Foundation',
  subtitle: 'Gestión de servicios digitales',
  description: 'Principios guía, sistema de valor, prácticas y mejora continua.',
  accent: '#9b6cff', accentSoft: '#ed4fb4',
  theme: { primary: '#9b6cff', secondary: '#ed4fb4', glow: '#b14dca', icon: 'prism', motif: 'rays' },
  conceptIcons: { Servicio:'service', Valor:'value-stream', 'Flujo de valor':'value-stream', Incidente:'incident-service', Incidentes:'incident-service', Cambios:'change', Cambio:'change', Mejora:'continual-improvement', Iteración:'continual-improvement', 'Cadena de valor':'value-stream' },
  questions: [
    { id: 'ITIL-DEMO-001', domain: 'Conceptos', topic: 'Valor', difficulty: 'basico', prompt: 'En gestión de servicios, ¿cómo se crea valor?', options: ['El proveedor lo entrega de forma aislada', 'Se cocrea mediante la colaboración entre proveedor y consumidor', 'Solo mediante reducción de costos', 'Al eliminar toda participación del usuario'], correct: 1, explanation: 'ITIL enfatiza la cocreación de valor a través de relaciones y colaboración entre proveedores, consumidores y otras partes.' },
    { id: 'ITIL-DEMO-002', domain: 'Principios guía', topic: 'Valor', difficulty: 'basico', prompt: '¿Qué pregunta refleja mejor el principio “enfocarse en el valor”?', options: ['¿Cómo impacta esta actividad en quien recibe el servicio?', '¿Cuántos documentos podemos producir?', '¿Cómo evitamos toda retroalimentación?', '¿Qué estructura es más compleja?'], correct: 0, explanation: 'Cada actividad debería vincularse directa o indirectamente con valor para consumidores y otras partes interesadas.' },
    { id: 'ITIL-DEMO-003', domain: 'Prácticas', topic: 'Incidentes', difficulty: 'intermedio', prompt: '¿Cuál es el objetivo principal de la gestión de incidentes?', options: ['Encontrar siempre la causa raíz', 'Restaurar la operación normal del servicio con rapidez', 'Autorizar todos los cambios', 'Diseñar nuevos productos'], correct: 1, explanation: 'La gestión de incidentes busca minimizar el impacto negativo restaurando el servicio tan pronto como sea posible.' },
    { id: 'ITIL-DEMO-004', domain: 'Sistema de valor', topic: 'Cadena de valor', difficulty: 'intermedio', prompt: '¿Cómo se usan las actividades de la cadena de valor del servicio?', options: ['En una única secuencia obligatoria', 'Como componentes combinables de flujos de valor', 'Solo durante incidentes críticos', 'Exclusivamente por proveedores externos'], correct: 1, explanation: 'Las actividades se combinan de distintas formas para formar flujos de valor adecuados a productos y servicios concretos.' },
    { id: 'ITIL-DEMO-005', domain: 'Mejora', topic: 'Iteración', difficulty: 'avanzado', prompt: 'Un equipo quiere reemplazar de una vez un proceso que todavía no comprende. ¿Qué enfoque es más coherente con ITIL?', options: ['Descartar toda la información existente', 'Avanzar iterativamente con retroalimentación y evaluar el estado actual', 'Esperar hasta diseñar una solución perfecta', 'Automatizar antes de simplificar'], correct: 1, explanation: 'Evaluar dónde se está y progresar iterativamente reduce riesgo, genera aprendizaje y permite ajustar con retroalimentación.' },
    { id: 'ITIL-DEMO-006', domain: 'Prácticas', topic: 'Cambios', difficulty: 'avanzado', prompt: '¿Qué busca la habilitación del cambio?', options: ['Maximizar cambios sin evaluación', 'Eliminar cambios de emergencia', 'Aumentar cambios exitosos mediante evaluación de riesgos y autorización', 'Centralizar toda decisión en una sola persona'], correct: 2, explanation: 'La práctica equilibra velocidad y riesgo para maximizar la cantidad de cambios exitosos de productos y servicios.' },
  ],
  glossary: [
    { term: 'Servicio', definition: 'Medio para facilitar la cocreación de valor al permitir resultados deseados sin gestionar costos y riesgos específicos.' },
    { term: 'Flujo de valor', definition: 'Serie de pasos que una organización utiliza para crear y entregar productos y servicios.' },
    { term: 'Incidente', definition: 'Interrupción no planificada o reducción de la calidad de un servicio.' },
    { term: 'Principio guía', definition: 'Recomendación que orienta a una organización en cualquier circunstancia.' },
  ],
  resources: {
    maps: [{ id: 'itil-svs', title: 'Sistema de valor del servicio', description: 'Descubrí cómo sus componentes habilitan valor.', nodes: [
      { id: 'svs', label: 'SVS', detail: 'Convierte oportunidad y demanda en valor.' },
      { id: 'principles', parentId: 'svs', label: 'Principios guía', detail: 'Recomendaciones aplicables en cualquier circunstancia.' },
      { id: 'governance', parentId: 'svs', label: 'Gobernanza', detail: 'Evalúa, dirige y monitorea la organización.' },
      { id: 'chain', parentId: 'svs', label: 'Cadena de valor', detail: 'Actividades combinables para formar flujos de valor.' },
      { id: 'practices', parentId: 'svs', label: 'Prácticas', detail: 'Recursos organizacionales para realizar trabajo.' },
    ] }],
    comparisons: [{ id: 'itil-practices', title: 'Incidente, problema y cambio', columns: ['Práctica', 'Foco', 'Resultado buscado'], rows: [
      ['Incidentes', 'Interrupción o degradación', 'Restaurar el servicio'], ['Problemas', 'Causas y errores conocidos', 'Reducir probabilidad e impacto'], ['Habilitación del cambio', 'Modificaciones con riesgo', 'Maximizar cambios exitosos'],
    ] }],
    lessons: [{ id: 'itil-value', title: 'Cocrear valor con servicios', summary: 'Una mirada breve a resultados, costos, riesgos y relaciones.', duration: '5 min', sections: [
      { title: 'El valor no se entrega solo', body: 'Proveedor y consumidor colaboran. El valor emerge cuando el servicio facilita resultados relevantes.' },
      { title: 'Entender la oferta', body: 'Bienes, acceso a recursos y acciones de servicio pueden combinarse para responder a una necesidad.' },
      { title: 'Mantener la relación', body: 'La gestión de relaciones alinea expectativas y sostiene la cocreación durante todo el ciclo.' },
    ] }],
    flashcards: [
      { id: 'itil-fc-1', front: '¿Qué es un resultado?', back: 'Un efecto habilitado por uno o más productos o servicios.' },
      { id: 'itil-fc-2', front: '¿Objetivo de incidentes?', back: 'Restaurar la operación normal tan pronto como sea posible.' },
      { id: 'itil-fc-3', front: '¿Qué forma un flujo de valor?', back: 'Una combinación específica de actividades y prácticas.' },
      { id: 'itil-fc-4', front: '¿Qué recomienda “empezar donde estás”?', back: 'Evaluar y aprovechar lo que ya existe antes de descartarlo.' },
    ],
    formulas: [],
    tips: [
      { id: 'itil-tip-1', title: 'Ubicá la palabra clave', body: 'Restaurar apunta a incidentes; causa apunta a problemas; riesgo y autorización apuntan a cambios.' },
      { id: 'itil-tip-2', title: 'Volvé al valor', body: 'Ante opciones similares, elegí la que mejor conecte trabajo, resultados y partes interesadas.' },
      { id: 'itil-tip-3', title: 'No memorices en aislamiento', body: 'Relacioná principios, dimensiones, cadena de valor y prácticas en escenarios concretos.' },
    ],
  },
};
