import type { AvatarFrame, AvatarId } from '../core/profile';
import type * as React from 'react';

const avatarPaths: Record<AvatarId, React.ReactNode> = {
  anonymous: <><circle cx="32" cy="25" r="9"/><path d="M14 55c2-13 10-19 18-19s16 6 18 19"/></>,
  navigator: <><path d="m32 9 8 18-8 28-8-28 8-18Z"/><circle cx="32" cy="29" r="5"/><path d="M12 50 25 39M52 50 39 39"/></>,
  scholar: <><path d="m8 24 24-12 24 12-24 12L8 24Z"/><path d="M18 31v12c8 7 20 7 28 0V31M52 27v15"/></>,
  guardian: <><path d="M32 7 52 15v14c0 14-9 23-20 28-11-5-20-14-20-28V15l20-8Z"/><path d="m23 31 6 6 13-15"/></>,
  builder: <><path d="M13 48 45 16M22 13l8 8-9 9-8-8 9-9ZM43 35l8 8-9 9-8-8 9-9Z"/><circle cx="32" cy="32" r="6"/></>,
  explorer: <><circle cx="32" cy="32" r="23"/><path d="m42 20-7 15-15 7 7-15 15-7Z"/><circle cx="32" cy="32" r="3"/></>,
};

export function Avatar({ id, frame = 'plain', size = 54 }: { id: AvatarId; frame?: AvatarFrame; size?: number }) {
  return <span className={`avatar avatar-${frame}`} style={{ width: size, height: size }} aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">{avatarPaths[id]}</svg></span>;
}
