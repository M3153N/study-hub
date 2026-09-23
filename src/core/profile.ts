import { useEffect, useState } from 'react';
import type { StudyProgress } from './types';

export type AvatarId = 'anonymous' | 'navigator' | 'scholar' | 'guardian' | 'builder' | 'explorer';
export type AvatarFrame = 'plain' | 'bronze' | 'silver' | 'gold';

export interface LocalProfile {
  version: 1;
  alias: string;
  avatar: AvatarId;
  frame: AvatarFrame;
}

const profileKey = 'study-hub:profile:v1';
const defaultProfile: LocalProfile = { version: 1, alias: '', avatar: 'anonymous', frame: 'plain' };

function loadProfile(): LocalProfile {
  try { return { ...defaultProfile, ...JSON.parse(localStorage.getItem(profileKey) ?? '{}'), version: 1 }; }
  catch { return defaultProfile; }
}

export function useLocalProfile() {
  const [profile, setProfile] = useState<LocalProfile>(loadProfile);
  useEffect(() => { localStorage.setItem(profileKey, JSON.stringify(profile)); }, [profile]);
  const updateProfile = (patch: Partial<LocalProfile>) => setProfile(current => ({ ...current, ...patch, version: 1 }));
  return { profile, updateProfile };
}

export const globalRanks = [
  { name: 'Caminante', xp: 0 }, { name: 'Navegante', xp: 200 },
  { name: 'Cartógrafo', xp: 600 }, { name: 'Mentor', xp: 1200 }, { name: 'Guía', xp: 2400 },
];

export function globalProfileStats(studyProgress: StudyProgress) {
  const courses = Object.values(studyProgress.courses);
  const xp = courses.reduce((sum, item) => sum + item.xp, 0);
  const attempts = courses.flatMap(item => item.attempts);
  const sessions = courses.reduce((sum, item) => sum + item.sessions.length, 0);
  const unlocked = courses.reduce((sum, item) => sum + Object.values(item.achievements).filter(value => value.unlockedAt).length, 0);
  let index = 0;
  globalRanks.forEach((rank, candidate) => { if (xp >= rank.xp) index = candidate; });
  return { xp, attempts: attempts.length, correct: attempts.filter(item => item.correct).length, sessions, unlocked, current: globalRanks[index], next: globalRanks[index + 1] };
}
