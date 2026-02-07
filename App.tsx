import React, { useState, useCallback } from 'react';
import { CategoryType } from './types';
import { STUFFY_BADGES } from './constants';
import { useProgress } from './hooks/useProgress';
import Header from './components/Header';
import HomeView from './components/HomeView';
import ArenaView from './components/ArenaView';
import CollectionView from './components/CollectionView';

// Fix #2: Hoist static JSX outside the component so it's not recreated every render
const GLOBAL_STYLES = (
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
);

const FOOTER = (
  <div className="mt-20 text-center">
    <p className="text-gray-900 font-black text-lg opacity-40">Made with 💙 by Jay Z (Daddy power) &copy; 2025</p>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'arena' | 'collection'>('home');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);

  // Fix #5, #6, #7: Custom hook with schema validation, capped IDs, event-driven saves
  const { progress, updateProgress } = useProgress();

  const goHome = useCallback(() => setView('home'), []);
  const goCollection = useCallback(() => setView('collection'), []);

  const handleStartCategory = useCallback((category: CategoryType) => {
    setSelectedCategory(category);
    setView('arena');
  }, []);

  const totalSolved = Object.values(progress.completedCategories).reduce(
    (sum, count) => sum + count,
    0
  );
  const progressCount =
    view === 'arena' && selectedCategory
      ? progress.completedCategories[selectedCategory]
      : totalSolved;
  const progressTotal = STUFFY_BADGES.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
      <Header
        level={progress.level}
        progressCount={progressCount}
        progressTotal={progressTotal}
        onGoHome={goHome}
        onViewCollection={goCollection}
      />

      {view === 'home' ? (
        <HomeView
          progress={progress}
          onStartCategory={handleStartCategory}
          onViewCollection={goCollection}
        />
      ) : view === 'collection' ? (
        <CollectionView
          progress={progress}
          updateProgress={updateProgress}
          onGoHome={goHome}
        />
      ) : selectedCategory ? (
        <ArenaView
          category={selectedCategory}
          seenProblemIds={progress.seenProblemIds}
          updateProgress={updateProgress}
          onGoHome={goHome}
        />
      ) : null}

      {FOOTER}
      {GLOBAL_STYLES}
    </div>
  );
};

export default App;
