import type { CertificationPack } from '../../core/types';

// Preguntas originales de DEMOSTRACIÓN. No son preguntas oficiales de examen
// ni sustituyen las publicaciones acreditadas de ITIL.
export const itil4: CertificationPack = {
  id: 'itil4', shortTitle: 'ITIL 4', title: 'ITIL 4 Foundation',
  subtitle: 'Gestión de servicios digitales',
  description: 'Principios guía, sistema de valor, prácticas y mejora continua.',
  accent: '#ff9f5a', accentSoft: '#f3cf65',
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
};
