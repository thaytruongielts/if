import React from 'react';

interface TimerProps {
  secondsLeft: number;
  totalSeconds: number;
}

const Timer: React.FC<TimerProps> = ({ secondsLeft, totalSeconds }) => {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;

  // Color transition based on time left
  let colorClass = 'text-blue-600 dark:text-blue-400';
  if (secondsLeft < 60) colorClass = 'text-red-500 dark:text-red-400 animate-pulse';
  else if (secondsLeft < 180) colorClass = 'text-amber-500 dark:text-amber-400';

  return (
    <div className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-md border border-slate-100 dark:border-slate-700">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="text-slate-200 dark:text-slate-700"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 28}
            strokeDashoffset={2 * Math.PI * 28 * (1 - progress / 100)}
            className={`${colorClass} transition-all duration-1000 linear`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-bold text-lg text-slate-700 dark:text-slate-200">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Time Remaining</span>
        <span className={`text-2xl font-mono font-bold ${colorClass}`}>
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};

export default Timer;
