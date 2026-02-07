import React, { useMemo } from 'react';
import { STUFFY_BADGES } from '../constants';
import { EquippedBadges, StuffyBadge, UserProgress } from '../types';

interface CollectionViewProps {
  progress: UserProgress;
  updateProgress: (updater: (prev: UserProgress) => UserProgress) => void;
  onGoHome: () => void;
}

const SET_LABELS: Record<string, string> = {
  spooky_study: 'Spooky Study Set',
  galaxy_lab: 'Galaxy Lab Set',
};

const CollectionView: React.FC<CollectionViewProps> = ({ progress, updateProgress, onGoHome }) => {
  const collectedSet = useMemo(() => new Set(progress.badges), [progress.badges]);
  const equipped: EquippedBadges = progress.equippedBadges ?? {};

  const badgesBySet = useMemo(() => {
    const groups: Record<string, StuffyBadge[]> = {};
    for (const badge of STUFFY_BADGES) {
      if (!groups[badge.setId]) groups[badge.setId] = [];
      groups[badge.setId].push(badge);
    }
    // Keep a stable sort within each set (optional)
    Object.values(groups).forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name)));
    return groups;
  }, []);

  const findBadge = (id?: string): StuffyBadge | undefined =>
    id ? STUFFY_BADGES.find((b) => b.id === id) : undefined;

  const handleEquip = (badge: StuffyBadge) => {
    if (!collectedSet.has(badge.id)) return; // can't equip what you don't own

    updateProgress((prev) => {
      const current = prev.equippedBadges ?? {};
      const next: EquippedBadges = { ...current };
      const id = badge.id;

      if (badge.slot === 'body') {
        // Toggle logic across body1/body2 slots
        if (next.body1 === id) {
          delete next.body1;
        } else if (next.body2 === id) {
          delete next.body2;
        } else if (!next.body1) {
          next.body1 = id;
        } else if (!next.body2) {
          next.body2 = id;
        } else {
          // Both taken: replace body2 by default
          next.body2 = id;
        }
      } else if (badge.slot === 'head') {
        next.head = next.head === id ? undefined : id;
      } else if (badge.slot === 'face') {
        next.face = next.face === id ? undefined : id;
      } else if (badge.slot === 'aura') {
        next.aura = next.aura === id ? undefined : id;
      }

      return { ...prev, equippedBadges: next };
    });
  };

  const renderSlot = (label: string, badgeId?: string) => {
    const badge = findBadge(badgeId);
    const isEmpty = !badge;
    return (
      <div className="flex flex-col items-center justify-center px-4 py-3 rounded-3xl bg-pink-50 border-4 border-pink-100 min-w-[80px]">
        <span className="text-[10px] font-black uppercase tracking-widest text-pink-500 mb-1">{label}</span>
        <div className="text-3xl mb-1">{badge ? badge.emoji : '✨'}</div>
        <span className="text-[10px] font-black text-pink-900 text-center line-clamp-2">
          {isEmpty ? 'Empty' : badge!.name}
        </span>
      </div>
    );
  };

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

      {/* Current loadout */}
      <div className="bg-white p-6 rounded-[32px] shadow-xl border-b-[10px] border-pink-100 flex flex-col gap-4">
        <h3 className="text-xl font-black text-pink-700 flex items-center gap-2">
          <span>✨ Current Look</span>
        </h3>
        <div className="flex flex-wrap gap-3">
          {renderSlot('Head', equipped.head)}
          {renderSlot('Face', equipped.face)}
          {renderSlot('Body 1', equipped.body1)}
          {renderSlot('Body 2', equipped.body2)}
          {renderSlot('Aura', equipped.aura)}
        </div>
        <p className="text-xs text-gray-500 font-semibold">
          Tap any unlocked badge below to equip or unequip it in the matching slot.
        </p>
      </div>

      {/* Collection grouped by set */}
      <div className="space-y-8">
        {Object.entries(badgesBySet).map(([setId, badges]) => {
          const setName = SET_LABELS[setId] ?? setId;

          return (
            <div key={setId} className="bg-white p-6 rounded-[32px] shadow-xl border-b-[10px] border-pink-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-pink-700">{setName}</h3>
                <span className="text-xs font-black text-pink-500">
                  {badges.filter((b) => collectedSet.has(b.id)).length} / {badges.length} collected
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {badges.map((badge) => {
                  const isCollected = collectedSet.has(badge.id);

                  const isEquipped =
                    badge.id === equipped.head ||
                    badge.id === equipped.face ||
                    badge.id === equipped.body1 ||
                    badge.id === equipped.body2 ||
                    badge.id === equipped.aura;

                  return (
                    <button
                      key={badge.id}
                      type="button"
                      onClick={() => handleEquip(badge)}
                      disabled={!isCollected}
                      className={`aspect-square flex flex-col items-center justify-center rounded-[32px] border-4 transition-all px-1 text-center ${
                        isCollected
                          ? isEquipped
                            ? 'bg-pink-500 border-pink-700 text-white scale-105 shadow-lg'
                            : 'bg-pink-50 border-pink-200 hover:border-pink-400 hover:scale-105 text-pink-900'
                          : 'bg-gray-50 border-gray-100 grayscale opacity-30 cursor-default'
                      }`}
                    >
                      <span className="text-3xl mb-1">{badge.emoji}</span>
                      <span className="text-[10px] font-black leading-tight line-clamp-2">
                        {isCollected ? badge.name : '???'}
                      </span>
                      {isCollected && (
                        <span className="mt-1 text-[9px] font-black uppercase tracking-widest text-pink-500">
                          {badge.slot}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(CollectionView);
