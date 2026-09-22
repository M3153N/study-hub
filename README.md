# Study Hub

Plataforma de estudio web, responsive y reutilizable para certificaciones. CAPM es el primer paquete de contenido. Este repositorio contiene un **MVP técnico** con **18 preguntas de demostración no validadas como simulacro oficial**. No está afiliado a PMI.

## Funcionalidades de esta versión

- Tema oscuro con interfaz mobile-first.
- Modo aleatorio con filtros por dificultad y dominio.
- Recorridos lineales independientes (básico, intermedio y avanzado), reanudables y reiniciables.
- Respuestas explicadas y resumen de cada sesión.
- Progreso guardado en `localStorage` de este navegador (sin sincronización ni cuenta).
- Glosario inicial y panel básico de estadísticas.
- Estructura `src/certifications/<id>` para incorporar ISO 27001 u otros paquetes después.

**Todavía no incluye:** simulacro CAPM completo, preguntas validadas, repetición espaciada, sincronización entre dispositivos ni material extenso.

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

Agregá preguntas a `src/certifications/capm/index.ts` con un ID permanente, dominio, tema, dificultad, enunciado, cuatro opciones, índice de respuesta correcta (0–3) y explicación. Revisá editorialmente cada pregunta antes de utilizarla para preparar un examen. Los IDs no deben cambiar una vez publicados porque las estadísticas los utilizan para identificar errores.
