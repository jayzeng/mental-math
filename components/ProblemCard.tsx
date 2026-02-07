
import React, { useState, useEffect } from 'react';
import { Problem } from '../types';

interface ProblemCardProps {
  problem: Problem;
  onSolve: (isCorrect: boolean) => void;
  onHelp: () => void;
}

const ProblemCard: React.FC<ProblemCardProps> = ({ problem, onSolve, onHelp }) => {
  const [userInput, setUserInput] = useState('');
  const [isSolved, setIsSolved] = useState(false);
  const [isWrong, setIsWrong] = useState(false);

  // Reset local state when a new problem arrives
  useEffect(() => {
    setUserInput('');
    setIsSolved(false);
    setIsWrong(false);
  }, [problem]);

  const checkAnswer = () => {
    if (!userInput.trim()) return;
    
    // Simple local check
    const isCorrect = userInput.trim().toLowerCase() === String(problem.answer).toLowerCase();
    
    if (isCorrect) {
      setIsSolved(true);
      setIsWrong(false);
      onSolve(true);
    } else {
      setIsWrong(true);
      onSolve(false);
      // Shake effect
      setTimeout(() => setIsWrong(false), 500);
    }
  };

  const handleOptionClick = (option: string) => {
    if (isSolved) return;
    setUserInput(option);
    
    const isCorrect = option.trim().toLowerCase() === String(problem.answer).toLowerCase();
    
    if (isCorrect) {
      setIsSolved(true);
      setIsWrong(false);
      onSolve(true);
    } else {
      setIsWrong(true);
      onSolve(false);
      // Brief shake animation reset
      setTimeout(() => setIsWrong(false), 500);
    }
  };

  // Multiple choice logic: check if options array exists and has content
  const isMultipleChoice = problem.options != null && problem.options.length > 0;

  return (
    <div className={`bg-white p-10 rounded-[40px] shadow-2xl border-b-[12px] border-gray-200 transition-all ${isWrong ? 'animate-shake' : ''}`}>
      <div className="text-center mb-10">
        <span className="px-5 py-2 bg-blue-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg">
          {problem.difficulty} CHALLENGE
        </span>
        <h2 className="text-4xl md:text-6xl font-black text-gray-900 mt-8 tracking-tighter leading-tight">
          {problem.question}
        </h2>
      </div>

      {isMultipleChoice ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {problem.options!.map((opt, i) => {
            const isUserSelection = userInput === opt;
            const isCorrectAnswer = opt.toLowerCase() === String(problem.answer).toLowerCase();
            
            let btnClass = 'bg-blue-50 border-blue-200 hover:border-blue-400 text-blue-900 hover:bg-blue-100';
            if (isSolved && isCorrectAnswer) {
              btnClass = 'bg-green-500 border-green-700 text-white';
            } else if (isUserSelection && isWrong) {
              btnClass = 'bg-red-500 border-red-700 text-white';
            }

            return (
              <button
                key={i}
                onClick={() => handleOptionClick(opt)}
                disabled={isSolved}
                className={`p-6 text-2xl font-black rounded-3xl border-b-8 transition-all active:translate-y-1 active:border-b-0 ${btnClass}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <input
            type="text"
            inputMode="numeric"
            value={userInput}
            onChange={(e) => {
              setUserInput(e.target.value);
              if (isWrong) setIsWrong(false); // Reset "wrong" state as soon as they start correcting
            }}
            disabled={isSolved}
            placeholder="Type your answer..."
            className={`w-full text-center text-4xl md:text-5xl p-6 border-4 rounded-3xl focus:ring-4 outline-none transition-all font-black ${
              isSolved 
                ? 'border-green-500 bg-green-50 text-green-700' 
                : isWrong 
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-blue-200 focus:border-blue-500 focus:ring-blue-100 text-blue-600 bg-blue-50/30'
            } placeholder-blue-100`}
            onKeyDown={(e) => e.key === 'Enter' && !isSolved && checkAnswer()}
          />
          <button
            onClick={checkAnswer}
            disabled={!userInput.trim() || isSolved}
            className={`w-full py-6 text-2xl font-black rounded-3xl transition-all ${
              isSolved
                ? 'bg-green-500 text-white shadow-[0_10px_0_0_#15803d] cursor-default'
                : isWrong 
                ? 'bg-red-500 text-white shadow-[0_10px_0_0_#b91c1c] active:shadow-none active:translate-y-[10px]'
                : 'bg-yellow-400 text-yellow-900 shadow-[0_10px_0_0_#ca8a04] hover:shadow-[0_6px_0_0_#ca8a04] hover:translate-y-1 active:shadow-none active:translate-y-[10px]'
            } disabled:opacity-50 disabled:translate-y-0`}
          >
            {isSolved ? 'Nailed it! ✨' : isWrong ? 'Try Again! 🔄' : 'Check My Work! 🚀'}
          </button>
        </div>
      )}

      <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
        <button
          onClick={onHelp}
          className="bg-purple-100 text-purple-700 px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-purple-200 transition-colors border-2 border-purple-200"
        >
          <span>💡 Need a Brain Trick?</span>
        </button>
      </div>
    </div>
  );
};

export default ProblemCard;
