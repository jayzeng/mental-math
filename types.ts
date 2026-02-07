
export enum CategoryType {
  ADDITION = 'ADDITION',
  SUBTRACTION = 'SUBTRACTION',
  MULT_BREAKDOWN = 'MULT_BREAKDOWN',
  MULT_NEAR = 'MULT_NEAR',
  MULT_SQUARE = 'MULT_SQUARE',
  DIVISION = 'DIVISION',
  FRACTIONS = 'FRACTIONS',
  ESTIMATION = 'ESTIMATION'
}

export interface Problem {
  id: string;
  question: string;
  answer: string | number;
  options?: string[];
  trick: string;
  explanation: string;
  category: CategoryType;
  difficulty: 'easy' | 'medium' | 'hard';
}

// ── Badge system types ──
export type BadgeSlot = 'head' | 'face' | 'body' | 'aura';
export type BadgeRarity = 'common' | 'rare' | 'secret';

export type UnlockConditionType =
  | 'sessions_completed'
  | 'time_of_day_sessions'
  | 'session_duration'
  | 'accuracy_range'
  | 'streak'
  | 'speed_threshold'
  | 'skill_mastery'
  | 'improvement'
  | 'compound';

export interface TimeWindow {
  startHour: number; // 0–23
  endHour: number;   // 0–23
}

export interface UnlockCondition {
  type: UnlockConditionType;
  // Keep this flexible so we can evolve conditions without touching all callsites
  params: Record<string, unknown>;
}

export interface StuffyBadge {
  id: string;
  setId: string;
  name: string;
  slot: BadgeSlot;
  rarity: BadgeRarity;
  description: string;
  lore: string;
  emoji: string; // temporary visual – can be replaced by asset keys later
  evolvesTo?: string | null;
  visuals?: {
    icon?: string; // asset key
    animationKey?: string;
  };
}

// What the kid is currently "wearing" on their stuffy
export interface EquippedBadges {
  head?: string;  // StuffyBadge.id with slot === 'head'
  face?: string;  // slot === 'face'
  body1?: string; // slot === 'body'
  body2?: string; // optional second body slot
  aura?: string;  // slot === 'aura'
}

export interface SessionStats {
  id: string; // uuid or timestamp-based
  category: CategoryType;
  startedAt: number; // ms
  endedAt: number;   // ms
  questions: number;
  correct: number;
  incorrect: number;
  avgAnswerTimeSeconds?: number;
}

export interface UserProgress {
  // IDs of collected badges (StuffyBadge.id)
  badges: string[];
  level: number;
  completedCategories: Record<CategoryType, number>;
  seenProblemIds: string[];

  // Current loadout (what's equipped on the stuffy)
  equippedBadges?: EquippedBadges;

  // Lightweight session history / meta for badge unlock logic
  totalSessions?: number;
  lastSessionAt?: number; // timestamp of last completed session
  lastSessionAccuracy?: number; // 0–1
  streakDays?: number; // current daily streak
  lastSessionDate?: string; // "YYYY-MM-DD" for quick streak checks
}

export interface CategoryInfo {
  id: CategoryType;
  title: string;
  icon: string;
  color: string;
  description: string;
  example: string;
}

export type ProblemPool = Record<CategoryType, Problem[]>;
