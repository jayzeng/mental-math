import { useState, useCallback } from 'react';
import { CategoryType, UserProgress } from '../types';
import { CATEGORIES } from '../constants';
import { saveProgressToDB } from '../services/indexedDb';

const STORAGE_KEY_PROGRESS = 'mathquest_progress_v3';
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
    equippedBadges: {},
  };
}

/** Schema-validate and migrate localStorage data */
function loadProgress(): UserProgress {
  try {
    if (typeof localStorage === 'undefined') {
      return createDefaultProgress();
    }

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
    for (const cat of CATEGORIES) {
      if (typeof parsed.completedCategories[cat.id] !== 'number') {
        parsed.completedCategories[cat.id] = 0;
      }
    }

    // Cap seenProblemIds to prevent unbounded growth
    if (parsed.seenProblemIds.length > MAX_SEEN_PROBLEM_IDS) {
      parsed.seenProblemIds = parsed.seenProblemIds.slice(-MAX_SEEN_PROBLEM_IDS);
    }

    // Ensure equippedBadges exists
    if (typeof parsed.equippedBadges !== 'object' || parsed.equippedBadges === null) {
      parsed.equippedBadges = {};
    }

    return parsed as UserProgress;
  } catch {
    console.warn('Failed to parse progress, resetting.');
    return createDefaultProgress();
  }
}

function saveProgress(progress: UserProgress): void {
  // Keep localStorage as a simple, synchronous backup (best-effort: guard for iOS private mode, etc.)
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
    }
  } catch (err) {
    console.warn('Saving to localStorage failed (continuing with IndexedDB only):', err);
  }
  // Persist to IndexedDB in the background
  void saveProgressToDB(progress);
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
