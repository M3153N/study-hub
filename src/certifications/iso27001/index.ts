import type { CertificationPack } from '../../core/types';

// Preguntas originales de DEMOSTRACIÓN. No constituyen material oficial ni
// reemplazan la norma ISO/IEC 27001 o formación acreditada.
export const iso27001: CertificationPack = {
  id: 'iso27001', shortTitle: 'ISO 27001 LI', title: 'ISO 27001 Lead Implementer',
  subtitle: 'Sistema de Gestión de Seguridad de la Información',
  description: 'Contexto, riesgos, controles y mejora continua de un SGSI.',
  accent: '#24c8a5', accentSoft: '#62a8ff',
  questions: [
    { id: 'ISO-DEMO-001', domain: 'SGSI', topic: 'Contexto', difficulty: 'basico', prompt: '¿Cuál es el propósito principal de definir el alcance de un SGSI?', options: ['Delimitar qué partes de la organización cubre el sistema', 'Seleccionar únicamente controles técnicos', 'Eliminar toda incertidumbre de negocio', 'Sustituir la evaluación de riesgos'], correct: 0, explanation: 'El alcance establece límites y aplicabilidad del SGSI considerando contexto, partes interesadas e interfaces.' },
    { id: 'ISO-DEMO-002', domain: 'Riesgos', topic: 'Tratamiento', difficulty: 'basico', prompt: 'Después de evaluar un riesgo de seguridad, ¿qué debería ocurrir?', options: ['Ignorarlo si no hubo incidentes', 'Elegir y documentar una opción de tratamiento coherente con los criterios', 'Aplicar todos los controles disponibles', 'Transferirlo siempre a un proveedor'], correct: 1, explanation: 'El tratamiento debe responder a los criterios de riesgo y quedar documentado, incluyendo responsables y controles seleccionados.' },
    { id: 'ISO-DEMO-003', domain: 'Liderazgo', topic: 'Política', difficulty: 'intermedio', prompt: '¿Qué característica debería tener la política de seguridad de la información?', options: ['Ser secreta para el equipo directivo', 'Ser idéntica en todas las organizaciones', 'Ser apropiada al propósito y apoyar la dirección estratégica', 'Describir cada configuración técnica'], correct: 2, explanation: 'La política establece dirección y compromiso; debe ser adecuada al propósito y contexto de la organización.' },
    { id: 'ISO-DEMO-004', domain: 'Controles', topic: 'Aplicabilidad', difficulty: 'intermedio', prompt: '¿Para qué sirve una declaración de aplicabilidad?', options: ['Registrar controles necesarios, su estado y justificación', 'Enumerar solamente incidentes cerrados', 'Reemplazar el plan de tratamiento', 'Certificar automáticamente el SGSI'], correct: 0, explanation: 'La declaración de aplicabilidad relaciona los controles necesarios con su implementación y las razones para incluirlos o excluirlos.' },
    { id: 'ISO-DEMO-005', domain: 'Evaluación', topic: 'Auditoría', difficulty: 'avanzado', prompt: 'Una auditoría interna detecta que un proceso no produce la evidencia esperada. ¿Cuál es la respuesta más sólida?', options: ['Ocultar el hallazgo hasta la auditoría externa', 'Corregir solo el documento', 'Analizar causa, corregir y verificar la eficacia de las acciones', 'Cambiar el alcance para excluir el proceso'], correct: 2, explanation: 'La mejora sostenible requiere tratar la no conformidad, analizar su causa y comprobar la eficacia de las acciones correctivas.' },
    { id: 'ISO-DEMO-006', domain: 'Mejora', topic: 'Desempeño', difficulty: 'avanzado', prompt: '¿Qué hace útil a un indicador del SGSI?', options: ['Que siempre aumente', 'Que permita evaluar un objetivo o proceso con criterios definidos', 'Que mida únicamente volumen de documentos', 'Que no tenga responsable'], correct: 1, explanation: 'Un indicador útil está vinculado con objetivos, método, frecuencia, criterios y responsables que permiten interpretar el desempeño.' },
  ],
  glossary: [
    { term: 'SGSI', definition: 'Sistema de gestión para establecer, implementar, mantener y mejorar la seguridad de la información.' },
    { term: 'Riesgo', definition: 'Efecto de la incertidumbre sobre los objetivos de seguridad de la información.' },
    { term: 'Declaración de aplicabilidad', definition: 'Documento que identifica controles necesarios, justificaciones y estado de implementación.' },
    { term: 'No conformidad', definition: 'Incumplimiento de un requisito que debe controlarse, corregirse y analizarse.' },
  ],
};
