import { CategoryType, Problem, UserProgress } from '../types';

const DB_NAME = 'mathquest-db';
const DB_VERSION = 1;
const PROGRESS_STORE = 'progress';
const PROBLEM_STORE = 'problemProgress';

// Shape of how progress is stored in IndexedDB (wrapper around UserProgress)
interface ProgressRecord {
  id: string; // singleton key
  value: UserProgress;
}

// Per-problem tracking for "asked" and "answered" status
export interface ProblemProgressRecord {
  id: string; // problem ID
  category: CategoryType;
  askedCount: number;
  correctCount: number;
  incorrectCount: number;
  lastAskedAt?: number;
  lastAnsweredAt?: number;
}

function hasIndexedDB(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDB()) {
      return reject(new Error('IndexedDB not available'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(PROGRESS_STORE)) {
        db.createObjectStore(PROGRESS_STORE, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(PROBLEM_STORE)) {
        const store = db.createObjectStore(PROBLEM_STORE, { keyPath: 'id' });
        store.createIndex('byCategory', 'category', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open error'));
  });
}

// ── User progress persistence ──

export async function getProgressFromDB(): Promise<UserProgress | null> {
  if (!hasIndexedDB()) return null;

  try {
    const db = await openDB();
    return await new Promise<UserProgress | null>((resolve, reject) => {
      const tx = db.transaction(PROGRESS_STORE, 'readonly');
      const store = tx.objectStore(PROGRESS_STORE);
      const req = store.get('singleton');

      req.onsuccess = () => {
        const record = req.result as ProgressRecord | undefined;
        resolve(record ? record.value : null);
      };
      req.onerror = () => reject(req.error ?? new Error('Failed to read progress'));
    });
  } catch (err) {
    console.warn('IndexedDB getProgressFromDB failed:', err);
    return null;
  }
}

export async function saveProgressToDB(progress: UserProgress): Promise<void> {
  if (!hasIndexedDB()) return;

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PROGRESS_STORE, 'readwrite');
      const store = tx.objectStore(PROGRESS_STORE);
      const record: ProgressRecord = { id: 'singleton', value: progress };
      const req = store.put(record);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error ?? new Error('Failed to write progress'));
    });
  } catch (err) {
    console.warn('IndexedDB saveProgressToDB failed:', err);
  }
}

// ── Per-problem tracking: asked / answered ──

export async function markProblemsAsked(problems: Problem[]): Promise<void> {
  if (!hasIndexedDB() || problems.length === 0) return;

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PROBLEM_STORE, 'readwrite');
      const store = tx.objectStore(PROBLEM_STORE);
      const now = Date.now();

      for (const p of problems) {
        const getReq = store.get(p.id);
        getReq.onsuccess = () => {
          const existing = getReq.result as ProblemProgressRecord | undefined;
          const next: ProblemProgressRecord = existing
            ? {
                ...existing,
                askedCount: existing.askedCount + 1,
                lastAskedAt: now,
              }
            : {
                id: p.id,
                category: p.category,
                askedCount: 1,
                correctCount: 0,
                incorrectCount: 0,
                lastAskedAt: now,
              };
          store.put(next);
        };
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to mark problems asked'));
    });
  } catch (err) {
    console.warn('IndexedDB markProblemsAsked failed:', err);
  }
}

export async function markProblemAnswered(problem: Problem, isCorrect: boolean): Promise<void> {
  if (!hasIndexedDB()) return;

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PROBLEM_STORE, 'readwrite');
      const store = tx.objectStore(PROBLEM_STORE);
      const now = Date.now();

      const getReq = store.get(problem.id);
      getReq.onsuccess = () => {
        const existing = getReq.result as ProblemProgressRecord | undefined;
        const base: ProblemProgressRecord = existing ?? {
          id: problem.id,
          category: problem.category,
          askedCount: 0,
          correctCount: 0,
          incorrectCount: 0,
        };

        const next: ProblemProgressRecord = {
          ...base,
          correctCount: base.correctCount + (isCorrect ? 1 : 0),
          incorrectCount: base.incorrectCount + (isCorrect ? 0 : 1),
          lastAnsweredAt: now,
        };

        store.put(next);
      };

      getReq.onerror = () => reject(getReq.error ?? new Error('Failed to read problem for answer'));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to mark problem answered'));
    });
  } catch (err) {
    console.warn('IndexedDB markProblemAnswered failed:', err);
  }
}

export async function getProblemProgress(problemId: string): Promise<ProblemProgressRecord | null> {
  if (!hasIndexedDB()) return null;

  try {
    const db = await openDB();
    return await new Promise<ProblemProgressRecord | null>((resolve, reject) => {
      const tx = db.transaction(PROBLEM_STORE, 'readonly');
      const store = tx.objectStore(PROBLEM_STORE);
      const req = store.get(problemId);

      req.onsuccess = () => resolve((req.result as ProblemProgressRecord | undefined) ?? null);
      req.onerror = () => reject(req.error ?? new Error('Failed to get problem progress'));
    });
  } catch (err) {
    console.warn('IndexedDB getProblemProgress failed:', err);
    return null;
  }
}
