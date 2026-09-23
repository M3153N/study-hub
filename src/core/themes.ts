import type { CourseTheme } from './types';

export type ThemeId = 'course' | 'academy' | 'cyber' | 'minimal' | 'amber' | 'adventure' | 'arcane' | 'neon';
export type Appearance = 'light' | 'dark' | 'auto';
export type Density = 'compact' | 'normal' | 'comfortable';

export interface SemanticTokens {
  background: string; surface: string; surfaceRaised: string; text: string;
  textMuted: string; border: string; interactive: string; interactiveText: string;
  success: string; successSurface: string; danger: string; dangerSurface: string;
  warning: string; shadow: string;
}

export interface ThemeDefinition {
  id: Exclude<ThemeId, 'course'>;
  name: string;
  description: string;
  accent: string;
  accentSoft: string;
  light: SemanticTokens;
  dark: SemanticTokens;
}

const darkBase = (surface: string, raised: string): Omit<SemanticTokens, 'interactive' | 'interactiveText'> => ({
  background: '#070a12', surface, surfaceRaised: raised, text: '#f4f6ff', textMuted: '#9aa5b7',
  border: '#2b3447', success: '#43d9ad', successSurface: '#103229', danger: '#f08091',
  dangerSurface: '#351a23', warning: '#efc36d', shadow: 'rgba(0,0,0,.34)',
});
const lightBase = (background: string, surface: string): Omit<SemanticTokens, 'interactive' | 'interactiveText'> => ({
  background, surface, surfaceRaised: '#ffffff', text: '#172033', textMuted: '#59657a', border: '#cbd3df',
  success: '#087e61', successSurface: '#dff8ef', danger: '#b52e48', dangerSurface: '#ffe6eb',
  warning: '#946000', shadow: 'rgba(32,45,68,.15)',
});

export const themes: ThemeDefinition[] = [
  { id: 'academy', name: 'Academy', description: 'Clásico, sereno y académico.', accent: '#6957e8', accentSoft: '#168aa6', dark: { ...darkBase('#101522','#171d2b'), interactive:'#7868f2', interactiveText:'#ffffff' }, light: { ...lightBase('#f3f5fb','#e9edf7'), interactive:'#5846cc', interactiveText:'#ffffff' } },
  { id: 'cyber', name: 'Cyber', description: 'Contraste técnico en verde y cian.', accent: '#20d7a7', accentSoft: '#23a9cb', dark: { ...darkBase('#071a1c','#0d2528'), interactive:'#16b98e', interactiveText:'#04120e' }, light: { ...lightBase('#effbf8','#dcf3ee'), interactive:'#087c68', interactiveText:'#ffffff' } },
  { id: 'minimal', name: 'Minimal', description: 'Neutral y concentrado.', accent: '#8792a7', accentSoft: '#b5bdca', dark: { ...darkBase('#12151b','#1b2029'), interactive:'#aab2c0', interactiveText:'#101319' }, light: { ...lightBase('#f6f7f9','#eceff3'), interactive:'#475267', interactiveText:'#ffffff' } },
  { id: 'amber', name: 'Amber', description: 'Cálido, enérgico y legible.', accent: '#f0a629', accentSoft: '#f2c45e', dark: { ...darkBase('#1b1409','#271d0d'), interactive:'#e59a1f', interactiveText:'#1b1103' }, light: { ...lightBase('#fff8e8','#f9edcf'), interactive:'#a86400', interactiveText:'#ffffff' } },
  { id: 'adventure', name: 'Adventure', description: 'Bosque, cobre y espíritu explorador.', accent: '#d58a3a', accentSoft: '#55b98b', dark: { ...darkBase('#17150f','#242117'), interactive:'#d58a3a', interactiveText:'#1b1005' }, light: { ...lightBase('#fbf5e9','#f1e8d5'), interactive:'#8a4e14', interactiveText:'#ffffff' } },
  { id: 'arcane', name: 'Arcane', description: 'Tinta violeta y conocimiento místico.', accent: '#a875ff', accentSoft: '#4bc8c1', dark: { ...darkBase('#151020','#21182e'), interactive:'#9d6aef', interactiveText:'#ffffff' }, light: { ...lightBase('#f8f1ff','#eee3fa'), interactive:'#7040b2', interactiveText:'#ffffff' } },
  { id: 'neon', name: 'Neon', description: 'Cian eléctrico y contraste nocturno.', accent: '#19e6da', accentSoft: '#d8ff46', dark: { ...darkBase('#07191d','#0d272d'), interactive:'#16c9c0', interactiveText:'#031313' }, light: { ...lightBase('#edfbfc','#d8f3f4'), interactive:'#087b82', interactiveText:'#ffffff' } },
];

export function resolveTheme(id: ThemeId, mode: 'light' | 'dark', course: CourseTheme) {
  if (id !== 'course') {
    const theme = themes.find(item => item.id === id) ?? themes[0];
    return { ...theme[mode], accent: theme.accent, accentSoft: theme.accentSoft, glow: theme.accent };
  }
  const semantic = mode === 'dark'
    ? { ...darkBase('#0e1420','#151c29'), interactive: course.primary, interactiveText: '#ffffff' }
    : { ...lightBase('#f4f6fb','#e7ebf4'), interactive: course.primary, interactiveText: '#ffffff' };
  return { ...semantic, accent: course.primary, accentSoft: course.secondary, glow: course.glow };
}
