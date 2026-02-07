import { useState, useCallback } from 'react';
import { CategoryType, UserProgress } from '../types';
import { CATEGORIES } from '../constants';

const STORAGE_KEY_PROGRESS = 'mathquest_progress_v2';
const MAX_SEEN_PROBLEM_IDS = 200;

function createDefaultProgress(): UserProgress {
  return {
    badges: [],
    level: 1,
    completedCategories: CATEGORIES.reduce(
      (acc, cat) => ({ ...acc, [cat.id]: 0 }),
      {} as Record<CategoryType, number>
    ),
    seenProblemIds: [],
  };
}

/** Schema-validate and migrate localStorage data */
function loadProgress(): UserProgress {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (!saved) return createDefaultProgress();

    const parsed = JSON.parse(saved);

    // Validate expected shape
    if (
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.badges) ||
      typeof parsed.level !== 'number' ||
      typeof parsed.completedCategories !== 'object' ||
      !Array.isArray(parsed.seenProblemIds)
    ) {
      console.warn('Invalid progress schema, resetting.');
      return createDefaultProgress();
    }

    // Ensure all categories exist (handles new categories added later)
    const defaults = createDefaultProgress();
    for (const cat of CATEGORIES) {
      if (typeof parsed.completedCategories[cat.id] !== 'number') {
        parsed.completedCategories[cat.id] = 0;
      }
    }

    // Cap seenProblemIds to prevent unbounded growth
    if (parsed.seenProblemIds.length > MAX_SEEN_PROBLEM_IDS) {
      parsed.seenProblemIds = parsed.seenProblemIds.slice(-MAX_SEEN_PROBLEM_IDS);
    }

    return parsed as UserProgress;
  } catch {
    console.warn('Failed to parse progress, resetting.');
    return createDefaultProgress();
  }
}

function saveProgress(progress: UserProgress): void {
  localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
}

export function useProgress() {
  const [progress, setProgress] = useState<UserProgress>(loadProgress);

  const updateProgress = useCallback((updater: (prev: UserProgress) => UserProgress) => {
    setProgress((prev) => {
      const next = updater(prev);
      // Cap seenProblemIds on every update
      if (next.seenProblemIds.length > MAX_SEEN_PROBLEM_IDS) {
        next.seenProblemIds = next.seenProblemIds.slice(-MAX_SEEN_PROBLEM_IDS);
      }
      saveProgress(next);
      return next;
    });
  }, []);

  return { progress, updateProgress } as const;
}
