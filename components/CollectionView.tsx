import React, { useMemo } from 'react';
import { STUFFY_BADGES } from '../constants';

interface CollectionViewProps {
  badgeIds: string[];
  onGoHome: () => void;
}

const CollectionView: React.FC<CollectionViewProps> = ({ badgeIds, onGoHome }) => {
  // Fix #3: Use Set for O(1) lookups instead of array.includes
  const collectedSet = useMemo(() => new Set(badgeIds), [badgeIds]);

  return (
    <div className="animate-fade-in space-y-10">
      <div className="flex items-center justify-between">
        <button
          onClick={onGoHome}
          className="text-gray-900 bg-white px-6 py-3 rounded-2xl shadow-md border-b-4 border-gray-200 font-black flex items-center gap-2 hover:bg-gray-50 transition-all active:translate-y-1 active:border-b-0"
        >
          <span>🏰 Back to Map</span>
        </button>
        <h2 className="text-3xl font-black text-pink-600">My Stuffy Collection</h2>
      </div>

      <div className="bg-white p-8 rounded-[40px] shadow-2xl border-b-[12px] border-pink-100">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-6">
          {STUFFY_BADGES.map((badge) => {
            const isCollected = collectedSet.has(badge.id);
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
  );
};

export default React.memo(CollectionView);
