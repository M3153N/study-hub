import type { CourseIcon } from '../core/types';
import type { ReactNode } from 'react';

export type IconName = CourseIcon | 'home' | 'practice' | 'library' | 'progress' | 'settings' | 'exam' | 'book' | 'map' | 'compare' | 'cards' | 'formula' | 'tips' | 'chart' | 'arrow' | 'user' | 'trophy' | 'certificate' | 'play' | 'target';

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  const paths: Record<IconName, ReactNode> = {
    orbit: <><circle cx="12" cy="12" r="3"/><path d="M3.4 9.2c2-4.5 7.2-7 11.7-5.4s6.9 6.6 5.3 11.1-6.5 7-10.9 5.6C5 19 2.5 14.2 3.8 9.8"/><path d="M5 18.5 19 5.5"/></>,
    shield: <><path d="M12 3 20 6v5c0 5.1-3.4 8.4-8 10-4.6-1.6-8-4.9-8-10V6l8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
    prism: <><path d="m12 3 8 15H4L12 3Z"/><path d="m12 3 1.5 15M8 11h9.4"/></>,
    home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
    practice: <><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h5M8 16h3"/><path d="m15 15 1.5 1.5L20 13"/></>,
    library: <><path d="M4 4h5v16H4zM9 4h5v16H9zM15 5l4-1 3 15-4 1z"/></>,
    progress: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
    exam: <><path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h3"/><path d="m14 16 1.5 1.5L19 14"/></>,
    book: <><path d="M4 4h6a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4z"/><path d="M20 4h-4a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h4z"/></>,
    map: <><circle cx="5" cy="12" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 12h4a3 3 0 0 0 3-3 3 3 0 0 1 3-3M14 15a3 3 0 0 0 3 3"/></>,
    compare: <><path d="M8 4 4 8l4 4M4 8h14M16 20l4-4-4-4M20 16H6"/></>,
    cards: <><rect x="3" y="6" width="15" height="13" rx="2"/><path d="m7 6 1-3h13v12h-3M7 11h7M7 15h4"/></>,
    formula: <><path d="M5 5h6l-4 14h6M15 8h5M15 16h5"/></>,
    tips: <><path d="M9 18h6M10 22h4"/><path d="M8.4 15.5A7 7 0 1 1 15.6 15.5C14.6 16.2 14 17 14 18h-4c0-1-.6-1.8-1.6-2.5Z"/></>,
    chart: <><path d="M4 20V9M10 20V4M16 20v-7M22 20H2"/><path d="m4 7 6-4 6 7 5-5"/></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c1-6 4-9 8-9s7 3 8 9"/></>,
    trophy: <><path d="M8 4h8v5c0 4-2 6-4 6s-4-2-4-6V4ZM9 20h6M12 15v5"/><path d="M8 6H4c0 4 1 6 5 6M16 6h4c0 4-1 6-5 6"/></>,
    certificate: <><rect x="4" y="3" width="16" height="14" rx="2"/><path d="M8 7h8M8 11h5M10 17l-1 5 3-2 3 2-1-5"/></>,
    play: <><circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m15 9 6-6M17 3h4v4"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}
