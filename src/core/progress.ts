import { useEffect, useState } from 'react';
import { blankProgress, type Progress } from './types';

const storageKey = 'study-hub:progress:v1';

function loadProgress(): Progress {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return blankProgress();
    const parsed = JSON.parse(saved) as Partial<Progress>;
    return {
      ...blankProgress(),
      ...parsed,
      linear: { ...blankProgress().linear, ...parsed.linear },
      mistakes: parsed.mistakes ?? {},
    };
  } catch {
    return blankProgress();
  }
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(loadProgress);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  }, [progress]);

  const reset = () => setProgress(blankProgress());
  return { progress, setProgress, reset };
}
