import { CategoryType, Problem, ProblemPool } from "../types";

// ── Static problem pool loaded from public/problems.json ──

let cachedPool: ProblemPool | null = null;

async function loadPool(): Promise<ProblemPool> {
  if (cachedPool) return cachedPool;

  const resp = await fetch(`${import.meta.env.BASE_URL}problems.json`);
  if (!resp.ok) {
    throw new Error(`Failed to load problems.json: ${resp.status}`);
  }
  cachedPool = (await resp.json()) as ProblemPool;
  return cachedPool;
}

/**
 * Returns problems for a category from the pre-generated static pool.
 * Filters out already-seen IDs and returns up to `count` problems.
 */
export async function getProblems(
  category: CategoryType,
  count: number = 5,
  excludeIds: string[] = []
): Promise<Problem[]> {
  const pool = await loadPool();
  const excludeSet = new Set(excludeIds);
  const available = (pool[category] ?? []).filter(
    (p) => !excludeSet.has(p.id)
  );
  return available.slice(0, count);
}

/**
 * Returns the total number of available problems per category.
 */
export async function getPoolStats(): Promise<Record<CategoryType, number>> {
  const pool = await loadPool();
  return Object.fromEntries(
    Object.entries(pool).map(([cat, problems]) => [cat, problems.length])
  ) as Record<CategoryType, number>;
}

// ── Local Buddy Logic for Instant Response ──

const CHEERS = [
  "You're a math wizard! ✨",
  "Boom! Perfect answer! 🚀",
  "Your brain is growing so fast! 🧠💨",
  "High five! That was clever! ✋",
  "Pixel is impressed! Great job! 🤖",
  "You're unstoppable! 🌟",
];

const ENCOURAGEMENTS = [
  "Nice try! Check out this trick... 💡",
  "So close! Pixel has a hint for you! 🤖",
  "Don't give up! Look at the brain trick! ✨",
  "Math is all about practice! Try again! 🔄",
];

export function getLocalBuddyResponse(isCorrect: boolean): string {
  const list = isCorrect ? CHEERS : ENCOURAGEMENTS;
  return list[Math.floor(Math.random() * list.length)];
}
