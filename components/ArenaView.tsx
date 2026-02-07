import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CategoryType, Problem, UserProgress, StuffyBadge } from '../types';
import { STUFFY_BADGES } from '../constants';
import { getProblems, getLocalBuddyResponse } from '../services/geminiService';
import MathBuddy from './MathBuddy';
import ProblemCard from './ProblemCard';

interface ArenaViewProps {
  category: CategoryType;
  progress: UserProgress;
  updateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onGoHome: () => void;
}

const ArenaView: React.FC<ArenaViewProps> = ({ category, progress, updateProgress, onGoHome }) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [buddyMsg, setBuddyMsg] = useState('Complete this round to earn a new Stuffy Friend!');
  const [buddyMood, setBuddyMood] = useState<'happy' | 'neutral' | 'thinking'>('neutral');
  const [showTrick, setShowTrick] = useState(false);
  const [newBadge, setNewBadge] = useState<StuffyBadge | null>(null);

  // Fix #4: Use refs to avoid stale closures in setTimeout
  const problemsRef = useRef(problems);
  problemsRef.current = problems;
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      setNewBadge(null);

      try {
        const categoryProblems = await getProblems(category, 5, progress.seenProblemIds);

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
    if (isCorrect) {
      setBuddyMood('happy');
      setBuddyMsg(getLocalBuddyResponse(true));

      // Use functional setState + refs to avoid stale closures
      const solvedProblem = problemsRef.current[currentIndexRef.current];

      updateProgress((prev) => ({
        ...prev,
        seenProblemIds: [...prev.seenProblemIds, solvedProblem.id],
        completedCategories: {
          ...prev.completedCategories,
          [category]: prev.completedCategories[category] + 1,
        },
      }));

      setTimeout(() => {
        const idx = currentIndexRef.current;
        const probs = problemsRef.current;

        if (idx < probs.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setBuddyMood('neutral');
          setShowTrick(false);
        } else {
          // Finished the round — award a badge
          // Read latest progress via updateProgress's functional form
          updateProgress((prev) => {
            const availableBadges = STUFFY_BADGES.filter((b) => !prev.badges.includes(b.id));
            if (availableBadges.length > 0) {
              const randomBadge = availableBadges[Math.floor(Math.random() * availableBadges.length)];
              setNewBadge(randomBadge);
              setBuddyMsg(`WHOA! You unlocked ${randomBadge.name}! 🥳`);
              return {
                ...prev,
                badges: [...prev.badges, randomBadge.id],
                level: prev.level + (prev.badges.length % 5 === 0 ? 1 : 0),
              };
            } else {
              setBuddyMsg("You've collected ALL the stuffies! You're a Math Master! 🏆");
              return prev;
            }
          });
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
          <ProblemCard problem={currentProblem} onSolve={handleSolve} onHelp={handleHelp} />
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
