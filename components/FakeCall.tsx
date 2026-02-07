
import React, { useState, useEffect, useRef } from 'react';
import { AppView, VoiceSettings } from '../types';
import { decode, decodeAudioData, generateSpeech } from '../services/geminiService';

interface FakeCallProps {
  onBack: () => void;
  isOnline: boolean;
  voiceSettings: VoiceSettings;
}

const FakeCall: React.FC<FakeCallProps> = ({ onBack, isOnline, voiceSettings }) => {
  const [phase, setPhase] = useState<'setup' | 'waiting' | 'incoming' | 'active' | 'missed'>('setup');
  const [callerName, setCallerName] = useState('Mom');
  const [delay, setDelay] = useState(0); // in seconds
  const [timeLeft, setTimeLeft] = useState(0);
  const [callDuration, setCallDuration] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const incomingTimeoutRef = useRef<number | null>(null);

  // Gemini TTS logic
  const playFakeVoice = async () => {
    try {
      const prompt = `Say: Hey, it's me. I'm just calling to see where you are. We're all here at the restaurant waiting for you. Are you close by? Don't be too long!`;

      const audioData = await import('../services/geminiService').then(m => m.generateSpeech(prompt, voiceSettings.voiceName));

      if (audioData) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = voiceSettings.speakingRate; // Apply custom speaking rate
        source.connect(ctx.destination);
        source.start();
      }
    } catch (err) {
      console.error("TTS failed", err);
    }
  };

  // Timer for delay
  useEffect(() => {
    if (phase === 'waiting' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (phase === 'waiting' && timeLeft === 0) {
      setPhase('incoming');
    }
  }, [phase, timeLeft]);

  // Handle incoming call timeout (missed call)
  useEffect(() => {
    if (phase === 'incoming') {
      incomingTimeoutRef.current = window.setTimeout(() => {
        setPhase('missed');
      }, 20000); // 20 seconds ring time
    }
    return () => {
      if (incomingTimeoutRef.current) clearTimeout(incomingTimeoutRef.current);
    };
  }, [phase]);

  // Timer for active call
  useEffect(() => {
    if (phase === 'active') {
      const timer = setInterval(() => setCallDuration(d => d + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [phase]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startSequence = () => {
    if (delay === 0) {
      setPhase('incoming');
    } else {
      setTimeLeft(delay);
      setPhase('waiting');
    }
  };

  const acceptCall = () => {
    if (incomingTimeoutRef.current) clearTimeout(incomingTimeoutRef.current);
    setPhase('active');
    playFakeVoice();
  };

  const declineCall = () => {
    if (incomingTimeoutRef.current) clearTimeout(incomingTimeoutRef.current);
    onBack();
  };

  if (phase === 'setup') {
    return (
      <div className="p-6 h-full flex flex-col animate-in fade-in">
        <header className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <h2 className="text-2xl font-bold text-slate-800">Fake Call Setup</h2>
        </header>

        <div className="flex-1 space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Caller Identity</label>
            <div className="grid grid-cols-2 gap-3">
              {['Mom', 'Work', 'Home', 'Dad'].map(name => (
                <button
                  key={name}
                  onClick={() => setCallerName(name)}
                  className={`py-4 rounded-2xl border font-bold transition-all ${callerName === name ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-100 text-slate-500'
                    }`}
                >
                  {name}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Custom Caller Name..."
              value={['Mom', 'Work', 'Home', 'Dad'].includes(callerName) ? '' : callerName}
              onChange={(e) => setCallerName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-green-100 outline-none"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Trigger Delay</label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 30, 60, 120].map(s => (
                <button
                  key={s}
                  onClick={() => setDelay(s)}
                  className={`py-3 text-xs font-bold rounded-xl border transition-all ${delay === s ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-100' : 'bg-white border-slate-100 text-slate-500'
                    }`}
                >
                  {s === 0 ? 'Now' : (s < 60 ? `${s}s` : `${s / 60}m`)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl flex gap-3">
            <i className="fa-solid fa-circle-info text-blue-400 mt-1"></i>
            <p className="text-xs text-blue-700 leading-relaxed">
              Use this to gracefully exit a situation. Once triggered, the app will simulate a full-screen incoming call.
            </p>
          </div>
        </div>

        <button
          onClick={startSequence}
          className="w-full py-5 bg-green-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-green-200 active:scale-95 transition-transform"
        >
          ACTIVATE CALL
        </button>
      </div>
    );
  }

  if (phase === 'waiting') {
    return (
      <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col items-center justify-center p-8 text-white">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-slate-700 flex items-center justify-center">
            <i className="fa-solid fa-hourglass-start animate-spin text-xl text-slate-500"></i>
          </div>
          <p className="text-sm font-medium text-slate-400">Triggering call in {timeLeft}s...</p>
          <p className="text-[10px] text-slate-600 uppercase tracking-widest">You can lock your screen now</p>
        </div>
        <button onClick={onBack} className="absolute bottom-12 text-slate-500 text-xs underline underline-offset-4">Cancel Sequence</button>
      </div>
    );
  }

  if (phase === 'incoming') {
    return (
      <div className="fixed inset-0 z-[300] bg-slate-900 animate-in fade-in duration-700 overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-900 to-black opacity-90"></div>

        <div className="relative h-full flex flex-col items-center justify-between py-24 px-8 text-white">
          <div className="text-center space-y-2">
            <p className="text-xs font-medium text-blue-400 uppercase tracking-[0.3em] animate-pulse">Incoming Call</p>
            <h2 className="text-4xl font-bold tracking-tight">{callerName}</h2>
            <p className="text-slate-400 text-sm">Mobile</p>
          </div>

          {/* Placeholder Avatar */}
          <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center text-5xl text-slate-600 border-4 border-slate-700">
            <i className="fa-solid fa-user"></i>
          </div>

          <div className="w-full flex justify-around items-center px-4">
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={declineCall}
                className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-3xl shadow-2xl shadow-red-500/20 active:scale-90 transition-transform"
              >
                <i className="fa-solid fa-phone-flip rotate-[135deg]"></i>
              </button>
              <span className="text-xs font-bold text-slate-400 uppercase">Decline</span>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={acceptCall}
                className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-3xl shadow-2xl shadow-green-500/30 animate-bounce active:scale-90 transition-transform"
              >
                <i className="fa-solid fa-phone"></i>
              </button>
              <span className="text-xs font-bold text-slate-400 uppercase">Accept</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'active') {
    return (
      <div className="fixed inset-0 z-[300] bg-slate-900 flex flex-col items-center justify-between py-20 px-8 text-white animate-in slide-in-from-bottom-20">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{callerName}</h2>
          <p className="text-sm font-mono text-slate-400">{formatTime(callDuration)}</p>
        </div>

        <div className="grid grid-cols-3 gap-y-12 gap-x-8 w-full max-w-xs">
          {[
            { icon: 'fa-microphone-slash', label: 'mute' },
            { icon: 'fa-th', label: 'keypad' },
            { icon: 'fa-volume-high', label: 'speaker' },
            { icon: 'fa-plus', label: 'add call' },
            { icon: 'fa-video', label: 'FaceTime' },
            { icon: 'fa-user-circle', label: 'contacts' },
          ].map((btn, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-xl hover:bg-white/20 transition-colors">
                <i className={`fa-solid ${btn.icon}`}></i>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400">{btn.label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={onBack}
            className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-3xl shadow-2xl shadow-red-500/20 active:scale-90 transition-transform"
          >
            <i className="fa-solid fa-phone-flip rotate-[135deg]"></i>
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'missed') {
    return (
      <div className="fixed inset-0 z-[300] bg-slate-900 flex flex-col items-center justify-center p-8 text-white animate-in fade-in duration-500">
        <div className="w-full max-w-xs bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center gap-6 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 text-3xl">
            <i className="fa-solid fa-phone-slash"></i>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-bold">Missed Call</h3>
            <p className="text-slate-400 text-sm font-medium">{callerName}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest pt-1">Just Now</p>
          </div>
          <button
            onClick={onBack}
            className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-transform"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default FakeCall;
