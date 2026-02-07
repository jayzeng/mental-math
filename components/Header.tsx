import React from 'react';

interface HeaderProps {
  level: number;
  badgeCount: number;
  onGoHome: () => void;
  onViewCollection: () => void;
}

const Header: React.FC<HeaderProps> = ({ level, badgeCount, onGoHome, onViewCollection }) => {
  return (
    <div className="flex justify-between items-center mb-12 bg-white p-5 rounded-[32px] shadow-xl border-b-8 border-blue-200">
      <div className="flex items-center gap-4 cursor-pointer" onClick={onGoHome}>
        <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-3xl shadow-[0_6px_0_0_#1e3a8a] text-white">
          🚀
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">MathQuest</h1>
          <p className="text-sm text-blue-600 font-black uppercase tracking-widest">MASTER LEVEL {level}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onViewCollection}
          className="flex items-center gap-3 bg-pink-50 px-5 py-3 rounded-2xl border-4 border-pink-200 shadow-sm hover:bg-pink-100 transition-colors"
        >
          <span className="text-3xl">🧸</span>
          <span className="text-2xl font-black text-pink-900">{badgeCount}/25</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(Header);
