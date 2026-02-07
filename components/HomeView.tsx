import React from 'react';
import { CategoryType, UserProgress } from '../types';
import { CATEGORIES } from '../constants';

interface HomeViewProps {
  progress: UserProgress;
  onStartCategory: (category: CategoryType) => void;
  onViewCollection: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ progress, onStartCategory, onViewCollection }) => {
  return (
    <div className="animate-fade-in">
      <div className="mb-12 text-center">
        <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">Choose Your Quest!</h2>
        <p className="text-xl text-indigo-600 font-bold italic">Solve problems to win super cute stuffy animals!</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onStartCategory(cat.id)}
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
          onClick={onViewCollection}
          className="bg-white px-10 py-6 rounded-[32px] border-b-8 border-pink-200 shadow-xl text-2xl font-black text-pink-600 hover:scale-105 active:translate-y-1 active:border-b-0 transition-all flex items-center gap-4"
        >
          <span>🧸 View My Stuffies</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(HomeView);
