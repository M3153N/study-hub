# Study Hub

Plataforma de estudio web, responsive y reutilizable para certificaciones. Incluye paquetes demostrativos para **CAPM**, **ISO 27001 Lead Implementer** e **ITIL 4 Foundation**. El contenido no representa bancos oficiales ni reemplaza materiales acreditados.

## Funcionalidades de esta versión

- Tema oscuro mobile-first, navegación inferior y acentos por certificación.
- Selector de cursos alimentado por un registro modular.
- Sesiones aleatorias o lineales configurables de 5, 10, 20 o todas las preguntas disponibles.
- Sesiones reanudables con posición y respuestas guardadas.
- Recorridos lineales independientes por nivel y por certificación.
- Respuestas explicadas, glosarios y dashboards con estadísticas por curso.
- Progreso guardado en `localStorage`, aislado por certificación y con migración del historial CAPM v1.
- Estructura `src/certifications/<id>` para incorporar nuevos paquetes sin modificar el motor de preguntas.

**Todavía no incluye:** simulacros oficiales completos, preguntas validadas, repetición espaciada, sincronización entre dispositivos ni cuentas de usuario.

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

## GitHub Pages

Este proyecto usa `base: '/study-hub/'` en Vite y un workflow de GitHub Actions que genera y despliega `dist/` en cada push a `main`. En GitHub, habilitá **Settings → Pages → Build and deployment → Source: GitHub Actions**. La URL prevista, una vez publicado, es `https://m3153n.github.io/study-hub/`. Si el repositorio cambia de nombre, actualizá `base` en `vite.config.ts`.

## Incorporar preguntas

Creá un paquete en `src/certifications/<id>/index.ts` que implemente `CertificationPack` y registralo en `src/certifications/index.ts`. Cada pregunta requiere un ID permanente, dominio, tema, dificultad, enunciado, cuatro opciones, índice de respuesta correcta (0–3) y explicación. Los IDs no deben cambiar una vez publicados porque las sesiones y estadísticas los utilizan para identificar respuestas.
