import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CategoryType, Problem, SessionStats, UserProgress, StuffyBadge } from '../types';
import { STUFFY_BADGES } from '../constants';
import { getProblems, getLocalBuddyResponse } from '../services/geminiService';
import { markProblemsAsked, markProblemAnswered } from '../services/indexedDb';
import { evaluateBadgesAfterSession } from '../services/badgeEngine';
import MathBuddy from './MathBuddy';
import ProblemCard from './ProblemCard';

interface ArenaViewProps {
  category: CategoryType;
  seenProblemIds: string[];
  updateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onGoHome: () => void;
}

const ArenaView: React.FC<ArenaViewProps> = ({ category, seenProblemIds, updateProgress, onGoHome }) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [buddyMsg, setBuddyMsg] = useState('Complete this round to earn a new Stuffy Friend!');
  const [buddyMood, setBuddyMood] = useState<'happy' | 'neutral' | 'thinking'>('neutral');
  const [showTrick, setShowTrick] = useState(false);
  const [newBadge, setNewBadge] = useState<StuffyBadge | null>(null);

  // Use refs to avoid stale closures in setTimeout
  const problemsRef = useRef(problems);
  problemsRef.current = problems;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  // Capture seenProblemIds in a ref so the load effect doesn't re-fire on progress updates
  const seenIdsRef = useRef(seenProblemIds);
  seenIdsRef.current = seenProblemIds;

  // Lightweight session tracking for badge logic
  const sessionStartRef = useRef<number>(Date.now());
  const correctCountRef = useRef(0);
  const incorrectCountRef = useRef(0);
  const answerTimeTotalRef = useRef(0); // ms
  const answeredCountRef = useRef(0);
  const questionStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      setNewBadge(null);

      try {
        const categoryProblems = await getProblems(category, 5, seenIdsRef.current);

        if (cancelled) return;

        if (categoryProblems.length === 0) {
          setLoadError('No more problems available for this category. Run the generator script to add more!');
          setLoading(false);
          return;
        }

        setProblems(categoryProblems);
        setCurrentIndex(0);
        setBuddyMood('neutral');
        setBuddyMsg('Complete this round to earn a new Stuffy Friend!');
        setShowTrick(false);

        // Reset session metrics
        sessionStartRef.current = Date.now();
        correctCountRef.current = 0;
        incorrectCountRef.current = 0;
        answerTimeTotalRef.current = 0;
        answeredCountRef.current = 0;
        questionStartedAtRef.current = Date.now();

        // Mark these problems as "asked" in IndexedDB for long-term tracking
        void markProblemsAsked(categoryProblems);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load problems:', err);
        setLoadError("Could not load problems. Make sure problems.json exists in the public/ folder.");
        setBuddyMood('neutral');
        setBuddyMsg("Hmm, I can't find any problems to show you...");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [category]); // Only reload when category changes

  const handleSolve = useCallback((isCorrect: boolean) => {
    const solvedProblem = problemsRef.current[currentIndexRef.current];

    if (!solvedProblem) return;

    // Record answered state (correct or incorrect) in IndexedDB
    void markProblemAnswered(solvedProblem, isCorrect);

    // Update lightweight session stats
    if (isCorrect) {
      const now = Date.now();
      if (questionStartedAtRef.current != null) {
        const delta = now - questionStartedAtRef.current;
        answerTimeTotalRef.current += delta;
        answeredCountRef.current += 1;
      }
      correctCountRef.current += 1;
    } else {
      incorrectCountRef.current += 1;
    }

    if (isCorrect) {
      setBuddyMood('happy');
      setBuddyMsg(getLocalBuddyResponse(true));

      // Track which problems you’ve seen so we can avoid repeats
      updateProgress((prev) => {
        const nextSeen = prev.seenProblemIds.includes(solvedProblem.id)
          ? prev.seenProblemIds
          : [...prev.seenProblemIds, solvedProblem.id];
        const nextCompleted = {
          ...prev.completedCategories,
          [category]: (prev.completedCategories?.[category] ?? 0) + 1,
        };

        return {
          ...prev,
          seenProblemIds: nextSeen,
          completedCategories: nextCompleted,
        };
      });

      setTimeout(() => {
        const idx = currentIndexRef.current;
        const probs = problemsRef.current;

        if (idx < probs.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setBuddyMood('neutral');
          setShowTrick(false);
          // Start timing next question
          questionStartedAtRef.current = Date.now();
        } else {
          // Finished the round — evaluate badge unlocks based on this session.
          const endedAt = Date.now();
          const questions = probs.length;
          const sessionStats: SessionStats = {
            id: `${category}-${endedAt}`,
            category,
            startedAt: sessionStartRef.current,
            endedAt,
            questions,
            correct: correctCountRef.current,
            incorrect: incorrectCountRef.current,
            avgAnswerTimeSeconds:
              answeredCountRef.current > 0
                ? answerTimeTotalRef.current / answeredCountRef.current / 1000
                : undefined,
          };

          let awardedBadges: StuffyBadge[] = [];
          let collectionComplete = false;

          updateProgress((prev) => {
            const { newBadges, updatedProgress } = evaluateBadgesAfterSession(prev, sessionStats);
            awardedBadges = newBadges;

            // Level up every time we cross a multiple of 5 badges
            const beforeCount = prev.badges.length;
            const afterCount = updatedProgress.badges.length;
            let level = updatedProgress.level;
            if (afterCount > beforeCount) {
              const beforeThreshold = Math.floor(beforeCount / 5);
              const afterThreshold = Math.floor(afterCount / 5);
              if (afterThreshold > beforeThreshold) {
                level += 1;
              }
            }

            // Track whether the collection is actually complete
            collectionComplete = afterCount >= STUFFY_BADGES.length;

            return {
              ...updatedProgress,
              level,
            };
          });

          if (awardedBadges.length > 0) {
            // For now, spotlight the last badge unlocked this session
            const spotlight = awardedBadges[awardedBadges.length - 1];
            setNewBadge(spotlight);
            setBuddyMsg(`WHOA! You unlocked ${spotlight.name}! 🥳`);
          } else if (collectionComplete) {
            setNewBadge(null);
            setBuddyMsg("You've collected ALL the stuffies! You're a Math Master! 🏆");
          } else {
            // No badge this round (e.g., all answers incorrect)
            setNewBadge(null);
            setBuddyMsg("Nice work! This round didn’t unlock a new badge, but you charged up your streak.");
          }
          setBuddyMood('happy');
        }
      }, 2000);
    } else {
      setBuddyMood('neutral');
      setBuddyMsg(getLocalBuddyResponse(false));
    }
  }, [category, updateProgress]);

  // Fix #3: Stable callback ref for help toggle
  const handleHelp = useCallback(() => {
    setShowTrick((prev) => !prev);
  }, []);

  const currentProblem = problems[currentIndex];

  return (
    <div className="space-y-10 animate-slide-up">
      <div className="flex items-center justify-between">
        <button
          onClick={onGoHome}
          className="text-gray-900 bg-white px-6 py-3 rounded-2xl shadow-md border-b-4 border-gray-200 font-black flex items-center gap-2 hover:bg-gray-50 transition-all active:translate-y-1 active:border-b-0"
        >
          <span>🏰 Back to Map</span>
        </button>
        <div className="flex gap-3">
          {problems.map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all shadow-sm ${
                i < currentIndex
                  ? 'bg-green-500 scale-110'
                  : i === currentIndex
                  ? 'bg-blue-600 ring-4 ring-blue-100'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      <MathBuddy message={buddyMsg} mood={buddyMood} />

      {loadError ? (
        <div className="bg-white p-12 rounded-[40px] shadow-2xl border-b-[12px] border-red-100 text-center">
          <div className="text-6xl mb-6">😕</div>
          <h2 className="text-2xl font-black text-red-600 mb-4">Oops!</h2>
          <p className="text-lg text-gray-600 font-medium mb-8">{loadError}</p>
          <button
            onClick={onGoHome}
            className="bg-blue-600 text-white px-8 py-4 rounded-[24px] text-lg font-black shadow-[0_8px_0_0_#1e3a8a] active:translate-y-1 active:shadow-none transition-all"
          >
            Back to Map 🏰
          </button>
        </div>
      ) : loading ? (
        <div className="bg-white p-20 rounded-[40px] shadow-2xl border-b-[12px] border-blue-100 flex flex-col items-center justify-center gap-8">
          <div className="w-24 h-24 border-8 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-3xl font-black text-blue-900">Loading Problems...</p>
        </div>
      ) : newBadge ? (
        <div className="bg-white p-12 rounded-[40px] shadow-2xl border-b-[12px] border-pink-200 text-center animate-bounce-in">
          <h2 className="text-4xl font-black text-pink-600 mb-6 uppercase tracking-tighter">New Friend Unlocked!</h2>
          <div className="text-[120px] mb-6 animate-pulse drop-shadow-2xl">{newBadge.emoji}</div>
          <p className="text-3xl font-black text-gray-900 mb-8">{newBadge.name}</p>
          <button
            onClick={onGoHome}
            className="bg-blue-600 text-white px-10 py-5 rounded-[24px] text-xl font-black shadow-[0_8px_0_0_#1e3a8a] active:translate-y-1 active:shadow-none transition-all"
          >
            Keep Training! 🚀
          </button>
        </div>
      ) : currentProblem ? (
        <div className="relative">
          <ProblemCard key={currentProblem.id} problem={currentProblem} onSolve={handleSolve} onHelp={handleHelp} />
          {showTrick && (
            <div className="mt-8 bg-amber-400 border-b-8 border-amber-600 p-8 rounded-[32px] animate-fade-in shadow-xl">
              <h4 className="font-black text-amber-900 text-2xl flex items-center gap-2 mb-3">
                <span className="text-4xl">⚡</span> Pixel's Brain Trick:
              </h4>
              <p className="text-amber-950 text-xl font-bold leading-relaxed">{currentProblem.trick}</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default ArenaView;
