import { CategoryType, SessionStats, StuffyBadge, UserProgress } from '../types';
import { STUFFY_BADGES } from '../constants';

// Helper: get today as YYYY-MM-DD in local time
function getTodayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export interface BadgeAwardResult {
  newBadges: StuffyBadge[];
  updatedProgress: UserProgress;
}

export function evaluateBadgesAfterSession(
  prevProgress: UserProgress,
  session: SessionStats
): BadgeAwardResult {
  const owned = new Set(prevProgress.badges);
  const newlyUnlocked: StuffyBadge[] = [];

  // Basic derived stats
  const totalQuestions = session.questions || session.correct + session.incorrect;
  const accuracy = totalQuestions > 0 ? session.correct / totalQuestions : 0;
  const durationMinutes = (session.endedAt - session.startedAt) / 1000 / 60;
  const now = new Date(session.endedAt);
  const todayKey = getTodayKey(now);

  // Streak logic (very lightweight)
  const lastDate = prevProgress.lastSessionDate;
  let streakDays = prevProgress.streakDays ?? 0;
  if (!lastDate) {
    streakDays = 1;
  } else if (lastDate === todayKey) {
    // same day, streak unchanged
  } else {
    const last = new Date(lastDate + 'T00:00:00');
    const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streakDays += 1;
    } else {
      streakDays = 1;
    }
  }

  const totalSessions = (prevProgress.totalSessions ?? 0) + 1;

  // Helper to safely unlock a badge by ID (idempotent, avoids duplicates)
  function unlock(id: string) {
    if (owned.has(id)) return;
    const badge = STUFFY_BADGES.find((b) => b.id === id);
    if (!badge) return;
    owned.add(id);
    newlyUnlocked.push(badge);
  }

  // ── Spooky Study conditions (simplified to what we can track locally) ──

  // Milk Teeth Medal: first few sessions
  if (totalSessions >= 1 && totalSessions <= 5) {
    unlock('milk_teeth_medal');
  }

  // Brain Melt Marshmallow lv1: longer session (scaled down to this app)
  if (durationMinutes >= 5) {
    unlock('brain_melt_marshmallow_lv1');
  }

  // Night Owl Crown: session after 9pm local time
  const hour = now.getHours();
  if (hour >= 21 || hour < 5) {
    unlock('night_owl_crown');
  }

  // Chaos Eyes: several mistakes but still okay accuracy
  if (session.incorrect >= 2 && accuracy >= 0.6) {
    unlock('chaos_eyes');
  }

  // Oopsie Bandage: bad previous session, big improvement this one
  const lastAccuracy = prevProgress.lastSessionAccuracy;
  if (typeof lastAccuracy === 'number' && lastAccuracy <= 0.4 && accuracy >= lastAccuracy + 0.2) {
    unlock('oopsie_bandage');
  }

  // Slice & Dice Halo: strong fractions session
  if (session.category === CategoryType.FRACTIONS && accuracy >= 0.9 && totalQuestions >= 5) {
    unlock('slice_and_dice_halo');
  }

  // Shadow Study Buddy: streak of 7+ days
  if (streakDays >= 7) {
    unlock('shadow_study_buddy');
  }

  // ── Galaxy Lab conditions ──

  // Starlight Goggles: high accuracy on any "hard"-ish run (we approximate by accuracy + enough questions)
  if (accuracy >= 0.9 && totalQuestions >= 5) {
    unlock('starlight_goggles');
  }

  // Orbiting Notebook: a bunch of sessions in any non-trivial category
  if (totalSessions >= 10) {
    unlock('orbiting_notebook');
  }

  // Gravity Boots: long focused session (scaled)
  if (durationMinutes >= 10) {
    unlock('gravity_boots');
  }

  // Quantum Pocket Watch: fast + accurate (needs avgAnswerTimeSeconds)
  if (
    typeof session.avgAnswerTimeSeconds === 'number' &&
    session.avgAnswerTimeSeconds <= 4 &&
    accuracy >= 0.9 &&
    totalQuestions >= 5
  ) {
    unlock('quantum_pocket_watch');
  }

  // Nebula Coat: lots of total questions answered in this category overall
  const totalQuestionsSolved = prevProgress.completedCategories?.[session.category] ?? 0;
  if (totalQuestionsSolved >= 50) {
    unlock('nebula_coat');
  }

  // Black Hole Backpack: long-term improvement (rough heuristic)
  if (lastAccuracy && lastAccuracy <= 0.6 && accuracy >= 0.9 && totalSessions >= 8) {
    unlock('black_hole_backpack');
  }

  // Comet Tail Aura: streak-based
  if (streakDays >= 14) {
    unlock('comet_tail_aura');
  }

  // Alien Theorem Hat: very strong accuracy, treat as "advanced mastery"
  if (accuracy >= 0.95 && totalQuestions >= 8) {
    unlock('alien_theorem_hat');
  }

  // Guarantee: if there are still badges left in the catalog and
  // none of the rule-based ones unlocked, award a random new badge
  // so every completed round feels rewarding.
  if (newlyUnlocked.length === 0) {
    const available = STUFFY_BADGES.filter((b) => !owned.has(b.id));
    if (available.length > 0) {
      const bonus = available[Math.floor(Math.random() * available.length)];
      owned.add(bonus.id);
      newlyUnlocked.push(bonus);
    }
  }

  const updatedProgress: UserProgress = {
    ...prevProgress,
    badges: Array.from(owned),
    totalSessions,
    lastSessionAt: session.endedAt,
    lastSessionAccuracy: accuracy,
    streakDays,
    lastSessionDate: todayKey,
  };

  return { newBadges: newlyUnlocked, updatedProgress };
}
