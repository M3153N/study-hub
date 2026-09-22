import { useEffect, useState, type SetStateAction } from 'react';
import { blankProgress, type Progress, type StudyProgress } from './types';

const storageKey = 'study-hub:progress:v3';
const previousKey = 'study-hub:progress:v2';
const legacyKey = 'study-hub:progress:v1';

function normalizeProgress(value?: Partial<Progress>): Progress {
  const base = blankProgress();
  return {
    ...base, ...value,
    linear: { ...base.linear, ...value?.linear },
    mistakes: value?.mistakes ?? {},
    attempts: value?.attempts ?? [], sessions: value?.sessions ?? [],
    achievements: value?.achievements ?? {}, rewardedQuestions: value?.rewardedQuestions ?? [],
    improvedQuestions: value?.improvedQuestions ?? [], rewardedSessions: value?.rewardedSessions ?? [],
  };
}

function migrateCourses(courses: Record<string, Partial<Progress>>): StudyProgress {
  return { version: 3, courses: Object.fromEntries(Object.entries(courses).map(([id, value]) => {
    const normalized = normalizeProgress(value);
    return [id, { ...normalized, legacyIncomplete: normalized.legacyIncomplete || (normalized.answered > 0 && normalized.attempts.length === 0) }];
  })) };
}

function loadProgress(): StudyProgress {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as StudyProgress;
      return migrateCourses(parsed.courses ?? {});
    }
    const previous = localStorage.getItem(previousKey);
    if (previous) return migrateCourses((JSON.parse(previous) as { courses?: Record<string, Partial<Progress>> }).courses ?? {});
    const legacy = localStorage.getItem(legacyKey);
    if (legacy) return migrateCourses({ capm: JSON.parse(legacy) as Partial<Progress> });
  } catch {
    // A corrupt local value should never prevent the application from loading.
  }
  return { version: 3, courses: {} };
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
