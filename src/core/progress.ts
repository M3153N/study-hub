import { useEffect, useState, type SetStateAction } from 'react';
import { blankProgress, type Progress, type StudyProgress } from './types';

const storageKey = 'study-hub:progress:v2';
const legacyKey = 'study-hub:progress:v1';

function normalizeProgress(value?: Partial<Progress>): Progress {
  return {
    ...blankProgress(), ...value,
    linear: { ...blankProgress().linear, ...value?.linear },
    mistakes: value?.mistakes ?? {},
  };
}

function loadProgress(): StudyProgress {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as StudyProgress;
      return { version: 2, courses: Object.fromEntries(Object.entries(parsed.courses ?? {}).map(([id, value]) => [id, normalizeProgress(value)])) };
    }
    const legacy = localStorage.getItem(legacyKey);
    if (legacy) return { version: 2, courses: { capm: normalizeProgress(JSON.parse(legacy) as Partial<Progress>) } };
  } catch {
    // A corrupt local value should never prevent the application from loading.
  }
  return { version: 2, courses: {} };
}

export function useCourseProgress(courseId: string) {
  const [studyProgress, setStudyProgress] = useState<StudyProgress>(loadProgress);
  const progress = studyProgress.courses[courseId] ?? blankProgress();

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(studyProgress));
  }, [studyProgress]);

  function setProgress(action: SetStateAction<Progress>) {
    setStudyProgress(previous => {
      const current = previous.courses[courseId] ?? blankProgress();
      const next = typeof action === 'function' ? action(current) : action;
      return { ...previous, courses: { ...previous.courses, [courseId]: next } };
    });
  }

  const reset = () => setStudyProgress(previous => ({ ...previous, courses: { ...previous.courses, [courseId]: blankProgress() } }));
  return { progress, setProgress, reset };
}
