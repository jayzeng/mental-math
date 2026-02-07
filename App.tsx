
import React, { useState, useEffect } from 'react';
import { CategoryType, Problem, UserProgress, StuffyBadge } from './types';
import { CATEGORIES, STUFFY_BADGES } from './constants';
import { getProblems, getLocalBuddyResponse } from './services/geminiService';
import MathBuddy from './components/MathBuddy';
import ProblemCard from './components/ProblemCard';

const STORAGE_KEY_PROGRESS = 'mathquest_progress_v2';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'arena' | 'collection'>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [buddyMsg, setBuddyMsg] = useState("Hi! I'm Pixel. Ready to collect some cute stuffy animals?");
  const [buddyMood, setBuddyMood] = useState<'happy' | 'neutral' | 'thinking'>('neutral');
  const [showTrick, setShowTrick] = useState(false);
  const [newBadge, setNewBadge] = useState<StuffyBadge | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (saved) return JSON.parse(saved);
    return {
      badges: [],
      level: 1,
      completedCategories: CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: 0 }), {} as Record<CategoryType, number>),
      seenProblemIds: []
    };
  });

  // Save progress to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
  }, [progress]);

  const handleStartCategory = async (category: CategoryType) => {
    setSelectedCategory(category);
    setView('arena');
    setLoading(true);
    setLoadError(null);
    setNewBadge(null);

    try {
      const categoryProblems = await getProblems(category, 5, progress.seenProblemIds);

      if (categoryProblems.length === 0) {
        setLoadError("No more problems available for this category. Run the generator script to add more!");
        setLoading(false);
        return;
      }

      setProblems(categoryProblems);
      setCurrentIndex(0);
      setBuddyMood('neutral');
      setBuddyMsg(`Complete this round to earn a new Stuffy Friend!`);
      setShowTrick(false);
    } catch (err) {
      console.error("Failed to load problems:", err);
      setLoadError("Could not load problems. Make sure problems.json exists in the public/ folder.");
      setBuddyMood('neutral');
      setBuddyMsg("Hmm, I can't find any problems to show you...");
    } finally {
      setLoading(false);
    }
  };

  const handleSolve = (isCorrect: boolean) => {
    if (isCorrect) {
      setBuddyMood('happy');
      setBuddyMsg(getLocalBuddyResponse(true));
      
      const solvedProblem = problems[currentIndex];
      
      setProgress(prev => ({
        ...prev,
        seenProblemIds: [...prev.seenProblemIds, solvedProblem.id],
        completedCategories: selectedCategory ? {
          ...prev.completedCategories,
          [selectedCategory]: prev.completedCategories[selectedCategory] + 1
        } : prev.completedCategories
      }));

      setTimeout(() => {
        if (currentIndex < problems.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setBuddyMood('neutral');
          setShowTrick(false);
        } else {
          // Finished the round! Award a badge.
          const availableBadges = STUFFY_BADGES.filter(b => !progress.badges.includes(b.id));
          if (availableBadges.length > 0) {
            const randomBadge = availableBadges[Math.floor(Math.random() * availableBadges.length)];
            setNewBadge(randomBadge);
            setProgress(prev => ({
              ...prev,
              badges: [...prev.badges, randomBadge.id],
              level: prev.level + (prev.badges.length % 5 === 0 ? 1 : 0) // Level up every 5 stuffies
            }));
            setBuddyMsg(`WHOA! You unlocked ${randomBadge.name}! 🥳`);
          } else {
            setBuddyMsg("You've collected ALL the stuffies! You're a Math Master! 🏆");
          }
          setBuddyMood('happy');
        }
      }, 2000);
    } else {
      setBuddyMood('neutral');
      setBuddyMsg(getLocalBuddyResponse(false));
    }
  };

  const currentProblem = problems[currentIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-12 bg-white p-5 rounded-[32px] shadow-xl border-b-8 border-blue-200">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-3xl shadow-[0_6px_0_0_#1e3a8a] text-white">
            🚀
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">MathQuest</h1>
            <p className="text-sm text-blue-600 font-black uppercase tracking-widest">MASTER LEVEL {progress.level}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('collection')}
            className="flex items-center gap-3 bg-pink-50 px-5 py-3 rounded-2xl border-4 border-pink-200 shadow-sm hover:bg-pink-100 transition-colors"
          >
            <span className="text-3xl">🧸</span>
            <span className="text-2xl font-black text-pink-900">{progress.badges.length}/25</span>
          </button>
        </div>
      </div>

      {view === 'home' ? (
        <div className="animate-fade-in">
          <div className="mb-12 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Choose Your Quest!</h2>
            <p className="text-xl text-indigo-600 font-bold italic">Solve problems to win super cute stuffy animals!</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleStartCategory(cat.id)}
                className="group relative bg-white p-8 rounded-[40px] shadow-lg border-b-[10px] border-gray-100 hover:border-blue-500 hover:shadow-2xl transition-all text-left flex flex-col items-start overflow-hidden active:translate-y-1 active:border-b-4"
              >
                <div className={`w-16 h-16 ${cat.color} rounded-[24px] flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform shadow-xl text-white`}>
                  {cat.icon}
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{cat.title}</h3>
                <p className="text-md text-gray-500 font-medium mb-6 leading-snug">{cat.description}</p>
                <div className="mt-auto w-full pt-6 border-t-2 border-gray-50 flex justify-between items-center">
                  <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                    SOLVED: {progress.completedCategories[cat.id]}
                  </span>
                  <span className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
             <button 
              onClick={() => setView('collection')}
              className="bg-white px-10 py-6 rounded-[32px] border-b-8 border-pink-200 shadow-xl text-2xl font-black text-pink-600 hover:scale-105 active:translate-y-1 active:border-b-0 transition-all flex items-center gap-4"
             >
               <span>🧸 View My Stuffies</span>
             </button>
          </div>
        </div>
      ) : view === 'collection' ? (
        <div className="animate-fade-in space-y-10">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setView('home')}
              className="text-gray-900 bg-white px-6 py-3 rounded-2xl shadow-md border-b-4 border-gray-200 font-black flex items-center gap-2 hover:bg-gray-50 transition-all active:translate-y-1 active:border-b-0"
            >
              <span>🏰 Back to Map</span>
            </button>
            <h2 className="text-3xl font-black text-pink-600">My Stuffy Collection</h2>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-2xl border-b-[12px] border-pink-100">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-6">
              {STUFFY_BADGES.map(badge => {
                const isCollected = progress.badges.includes(badge.id);
                return (
                  <div 
                    key={badge.id} 
                    className={`aspect-square flex flex-col items-center justify-center rounded-[32px] border-4 transition-all ${
                      isCollected 
                        ? 'bg-pink-50 border-pink-200 scale-100' 
                        : 'bg-gray-50 border-gray-100 grayscale opacity-30'
                    }`}
                  >
                    <span className="text-4xl mb-2">{badge.emoji}</span>
                    <span className={`text-xs font-black text-center px-2 ${isCollected ? 'text-pink-900' : 'text-gray-400'}`}>
                      {isCollected ? badge.name : '???'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-slide-up">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setView('home')}
              className="text-gray-900 bg-white px-6 py-3 rounded-2xl shadow-md border-b-4 border-gray-200 font-black flex items-center gap-2 hover:bg-gray-50 transition-all active:translate-y-1 active:border-b-0"
            >
              <span>🏰 Back to Map</span>
            </button>
            <div className="flex gap-3">
              {problems.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-full transition-all shadow-sm ${i < currentIndex ? 'bg-green-500 scale-110' : i === currentIndex ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-gray-200'}`}
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
                onClick={() => setView('home')}
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
                onClick={() => setView('home')}
                className="bg-blue-600 text-white px-10 py-5 rounded-[24px] text-xl font-black shadow-[0_8px_0_0_#1e3a8a] active:translate-y-1 active:shadow-none transition-all"
               >
                 Keep Training! 🚀
               </button>
            </div>
          ) : currentProblem && (
            <div className="relative">
              <ProblemCard 
                problem={currentProblem} 
                onSolve={handleSolve}
                onHelp={() => setShowTrick(!showTrick)}
              />
              {showTrick && (
                <div className="mt-8 bg-amber-400 border-b-8 border-amber-600 p-8 rounded-[32px] animate-fade-in shadow-xl">
                  <h4 className="font-black text-amber-900 text-2xl flex items-center gap-2 mb-3">
                    <span className="text-4xl">⚡</span> Pixel's Brain Trick:
                  </h4>
                  <p className="text-amber-950 text-xl font-bold leading-relaxed">{currentProblem.trick}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer Branding */}
      <div className="mt-20 text-center">
        <p className="text-gray-900 font-black text-lg opacity-40">Made with 💙 by Pixel the Robot &copy; 2025</p>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-15px); }
          75% { transform: translateX(15px); }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slide-up { animation: slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .animate-bounce-in { animation: bounce-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      `}</style>
    </div>
  );
};

export default App;
