
import React from 'react';

interface MathBuddyProps {
  message: string;
  mood: 'happy' | 'neutral' | 'thinking';
}

const MathBuddy: React.FC<MathBuddyProps> = ({ message, mood }) => {
  const getAvatar = () => {
    switch (mood) {
      case 'happy': return '🤖✨';
      case 'thinking': return '🤖💭';
      default: return '🤖';
    }
  };

  return (
    <div className="flex items-center gap-4 bg-white p-5 rounded-3xl border-4 border-blue-400 shadow-[0_8px_0_0_rgba(96,165,250,0.3)] transition-all duration-300">
      <div className="text-5xl animate-bounce drop-shadow-md">{getAvatar()}</div>
      <div className="flex-1">
        <p className="text-lg font-bold text-blue-900 leading-tight">
          {message || "Hi! I'm Pixel. Ready to master some math tricks?"}
        </p>
      </div>
    </div>
  );
};

export default MathBuddy;
