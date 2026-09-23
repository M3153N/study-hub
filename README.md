# Study Hub

Plataforma de estudio web, responsive y reutilizable para certificaciones. Incluye paquetes demostrativos para **CAPM**, **ISO 27001 Lead Implementer** e **ITIL 4 Foundation**. El contenido no representa bancos oficiales ni reemplaza materiales acreditados.

## Funcionalidades de esta versión

- Experiencia mobile-first con navegación inferior, menú compacto de perfil y certificación, swipe animado y alternativas accesibles.
- Interfaz fullscreen basada en `100dvh`, con áreas seguras y scroll interno solamente cuando el contenido lo requiere.
- Progressive Web App instalable en Android e iOS, con manifiesto, iconos propios y funcionamiento offline mediante Service Worker versionado.
- Temas visuales globales desacoplados del curso, incluidas variantes Terminal y neón sobre negro sólido; no se utilizan logos oficiales.
- Temas semánticos claros/oscuros cuando corresponden, densidad configurable y estilos de inicio Minimal, Adventure y Dashboard.
- Perfil exclusivamente local con alias opcional, avatares originales ampliados, XP global derivada y logros verificables.
- Catálogo tipado de iconos conceptuales asignable desde cada certificación.
- Selector de cursos alimentado por un registro modular.
- Centro de estudio con accesos funcionales a práctica, simulacros, biblioteca, consejos y progreso.
- Sesiones aleatorias o lineales configurables de 5, 10, 20 o todas las preguntas disponibles.
- Filtros combinables por dominio, tema, dificultad, preguntas nuevas y errores anteriores.
- Sesiones reanudables con posición y respuestas guardadas.
- Resultados por sesión con revisión de respuestas y desglose por dominio.
- Recorridos lineales independientes por nivel y por certificación.
- Respuestas explicadas, glosarios y dashboards con estadísticas por curso.
- Biblioteca modular con mapas conceptuales interactivos, comparativas, lectura, flashcards, fórmulas y consejos.
- Preferencias locales de texto ampliado y reducción de movimiento.
- Progreso guardado en `localStorage`, aislado por certificación y con migración del historial CAPM v1.
- Cobertura real, historial deduplicado de intentos, XP, rangos, logros y desafíos locales independientes por certificación.
- Campañas declarativas con mapa, desbloqueos verificables y desafíos para las tres certificaciones.
- Entrenamiento con repetición espaciada persistente y fechas independientes por curso.
- Simulacros demostrativos con temporizador continuo, navegación, marcado, entrega y revisión final.
- Biblioteca enriquecida con comparador, preguntas relacionadas y ejercicios de fórmulas cuando corresponden.
- Funcionamiento offline mediante Service Worker versionado y actualización controlada.
- Estructura `src/certifications/<id>` para incorporar nuevos paquetes sin modificar el motor de preguntas.

**Todavía no incluye:** simulacros oficiales completos, bancos masivos validados, sincronización entre dispositivos ni cuentas de usuario.

## Desarrollo local

Requiere Node.js 22 o compatible.

```bash
npm install
npm run dev
```

Para generar el sitio estático:

```bash
npm run build
```

La instalación se ofrece desde Configuración cuando el navegador expone el flujo nativo. En iPhone y iPad se puede usar **Compartir → Agregar a pantalla de inicio**. La aplicación conserva el funcionamiento web convencional cuando no se instala.

## GitHub Pages

Este proyecto usa `base: '/study-hub/'` en Vite y un workflow de GitHub Actions que genera y despliega `dist/` en cada push a `main`. En GitHub, habilitá **Settings → Pages → Build and deployment → Source: GitHub Actions**. La URL prevista, una vez publicado, es `https://m3153n.github.io/study-hub/`. Si el repositorio cambia de nombre, actualizá `base` en `vite.config.ts`.

## Incorporar preguntas

Creá un paquete en `src/certifications/<id>/index.ts` que implemente `CertificationPack` y registralo en `src/certifications/index.ts`. El bloque `theme` conserva icono y motivo semántico del curso, mientras la paleta visible se selecciona globalmente; `resources` incorpora materiales sin modificar la aplicación central. Cada pregunta requiere un ID permanente, dominio, tema, dificultad, enunciado, cuatro opciones, índice de respuesta correcta (0–3) y explicación. Los IDs no deben cambiar una vez publicados porque las sesiones y estadísticas los utilizan para identificar respuestas.

Los nombres de certificaciones se usan únicamente para identificar el área de estudio. Study Hub es independiente, no utiliza logos oficiales y no implica afiliación o aprobación de las entidades certificadoras.

## Progreso y gamificación

El esquema actual (`study-hub:progress:v4`) amplía v3 con campaña, repaso y simulacros, manteniendo cada respuesta con certificación, sesión, pregunta, elección, corrección, fecha y modalidad. La clave `sesión:pregunta` impide duplicar intentos tras recargas o reanudaciones. Las migraciones conservan totales, errores, recorridos y sesiones activas; cuando el almacenamiento anterior no identifica preguntas o fechas, la interfaz lo marca como historial incompleto y no inventa cobertura ni XP.

La XP es independiente por certificación: +10 por el primer acierto de una pregunta nueva, +5 la primera vez que se corrige una pregunta antes fallada, +10 al completar una sesión que produjo al menos uno de esos aprendizajes verificables y +20 por logro desbloqueado. Preguntas conocidas, recargas y reutilización de una sesión no vuelven a otorgar la misma recompensa. La XP, los rangos y los logros ya obtenidos se conservan si crece el banco; la cobertura sí se recalcula sobre el total disponible. Estos rangos pertenecen a Study Hub y no indican preparación oficial para rendir una certificación.
