
import React, { useState, useEffect } from 'react';

interface CheckInReminderProps {
  onConfirmSafe: () => void;
  onStartCompanion: () => void;
  onPanic: () => void;
}

const CheckInReminder: React.FC<CheckInReminderProps> = ({ onConfirmSafe, onStartCompanion, onPanic }) => {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timer);
          onPanic(); // Trigger distress if no response
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onPanic]);

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 text-white animate-in fade-in duration-500">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-orange-500 flex items-center justify-center animate-pulse">
            <span className="text-4xl font-black">{countdown}</span>
          </div>
          <div className="absolute -top-2 -right-2 bg-orange-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg">
            <i className="fa-solid fa-shield-heart text-lg"></i>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight uppercase">Safety Check-in</h2>
          <p className="text-slate-300">Are you feeling safe? Please confirm your status before the timer runs out.</p>
        </div>

        <div className="w-full space-y-4 pt-4">
          <button 
            onClick={onConfirmSafe}
            className="w-full py-5 bg-white text-slate-900 rounded-3xl font-black text-lg shadow-2xl active:scale-95 transition-transform"
          >
            I AM SAFE
          </button>
          
          <button 
            onClick={onStartCompanion}
            className="w-full py-4 bg-purple-600/20 border-2 border-purple-500/50 text-purple-200 rounded-3xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <i className="fa-solid fa-microphone"></i>
            START COMPANION
          </button>

          <button 
            onClick={onPanic}
            className="w-full py-4 bg-red-600/20 border-2 border-red-500/50 text-red-400 rounded-3xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            <i className="fa-solid fa-triangle-exclamation"></i>
            HELP NEEDED
          </button>
        </div>

        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
          Failure to respond will trigger emergency protocols
        </p>
      </div>
    </div>
  );
};

export default CheckInReminder;
