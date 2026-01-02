
import React, { useState, useEffect } from 'react';
import { AppView } from '../types';

interface GroundingExercisesProps {
  onBack: () => void;
}

const GroundingExercises: React.FC<GroundingExercisesProps> = ({ onBack }) => {
  const [activeExercise, setActiveExercise] = useState<'menu' | 'breathing' | 'sensory'>('menu');
  const [breathingStep, setBreathingStep] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [sensoryStep, setSensoryStep] = useState(0);

  // Breathing Logic (4-7-8 simulated simple)
  useEffect(() => {
    if (activeExercise !== 'breathing') return;
    
    let timer: any;
    const cycle = () => {
      setBreathingStep('Inhale');
      timer = setTimeout(() => {
        setBreathingStep('Hold');
        timer = setTimeout(() => {
          setBreathingStep('Exhale');
          timer = setTimeout(cycle, 6000);
        }, 4000);
      }, 4000);
    };
    cycle();
    return () => clearTimeout(timer);
  }, [activeExercise]);

  const sensoryPrompts = [
    { title: "5 Things You See", description: "Look around and name five things you can see right now.", icon: "fa-eye" },
    { title: "4 Things You Can Feel", description: "Notice the sensation of your feet on the floor or the fabric of your clothes.", icon: "fa-hand-pointer" },
    { title: "3 Things You Can Hear", description: "Listen closely for distant sounds, birds, or even your own breath.", icon: "fa-ear-listen" },
    { title: "2 Things You Can Smell", description: "If you can't smell anything, name your two favorite scents.", icon: "fa-nose-hook" },
    { title: "1 Thing You Can Taste", description: "Notice any lingering taste, or imagine a refreshing drink of water.", icon: "fa-mouth" },
  ];

  const renderContent = () => {
    if (activeExercise === 'menu') {
      return (
        <div className="space-y-6 animate-in slide-in-from-bottom-10">
          <header className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-800">Grounding</h2>
            <p className="text-slate-500">Quick ways to feel safe and calm in the moment.</p>
          </header>

          <div className="grid gap-4">
            <button 
              onClick={() => setActiveExercise('breathing')}
              className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center gap-5 text-left group"
            >
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <i className="fa-solid fa-wind text-2xl"></i>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-lg">Guided Breathing</h3>
                <p className="text-sm text-slate-500">Slow your heart rate and calm your mind.</p>
              </div>
            </button>

            <button 
              onClick={() => setActiveExercise('sensory')}
              className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-all flex items-center gap-5 text-left group"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <i className="fa-solid fa-magnifying-glass-location text-2xl"></i>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-lg">5-4-3-2-1 Sensory</h3>
                <p className="text-sm text-slate-500">Reconnect with your physical surroundings.</p>
              </div>
            </button>
          </div>
        </div>
      );
    }

    if (activeExercise === 'breathing') {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-12 py-10 animate-in zoom-in-95 duration-500">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold text-slate-800">{breathingStep}</h3>
            <p className="text-slate-500 text-sm">Focus on the movement of the circle.</p>
          </div>
          
          <div className="relative flex items-center justify-center w-64 h-64">
             <div 
              className={`absolute rounded-full border-4 border-teal-100 transition-all duration-[4000ms] ease-in-out ${
                breathingStep === 'Inhale' ? 'w-64 h-64 opacity-100' : 
                breathingStep === 'Exhale' ? 'w-24 h-24 opacity-40' : 
                'w-64 h-64 opacity-100 scale-105'
              }`}
             ></div>
             <div 
              className={`rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-xl shadow-teal-100 transition-all duration-[4000ms] ease-in-out ${
                breathingStep === 'Inhale' ? 'w-56 h-56' : 
                breathingStep === 'Exhale' ? 'w-20 h-20' : 
                'w-56 h-56'
              }`}
             ></div>
          </div>

          <button 
            onClick={() => setActiveExercise('menu')}
            className="px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
          >
            End Exercise
          </button>
        </div>
      );
    }

    if (activeExercise === 'sensory') {
      const step = sensoryPrompts[sensoryStep];
      return (
        <div className="flex flex-col h-full space-y-8 animate-in slide-in-from-right-10 duration-300">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Exercise {sensoryStep + 1} of 5</span>
            <button onClick={() => setActiveExercise('menu')} className="text-slate-400 hover:text-slate-600"><i className="fa-solid fa-xmark"></i></button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8">
            <div className="w-24 h-24 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-4xl shadow-lg shadow-indigo-50">
              <i className={`fa-solid ${step.icon}`}></i>
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-slate-800">{step.title}</h3>
              <p className="text-slate-500 text-lg max-w-xs mx-auto leading-relaxed">{step.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              disabled={sensoryStep === 0}
              onClick={() => setSensoryStep(s => s - 1)}
              className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-bold disabled:opacity-0 transition-all"
            >
              Previous
            </button>
            <button 
              onClick={() => {
                if (sensoryStep === 4) setActiveExercise('menu');
                else setSensoryStep(s => s + 1);
              }}
              className="py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95"
            >
              {sensoryStep === 4 ? 'Complete' : 'Next Step'}
            </button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="p-6 pb-24 h-full relative overflow-hidden flex flex-col">
      {activeExercise === 'menu' && (
        <button 
          onClick={onBack}
          className="mb-6 w-10 h-10 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>
      )}
      <div className="flex-1">
        {renderContent()}
      </div>
    </div>
  );
};

export default GroundingExercises;
