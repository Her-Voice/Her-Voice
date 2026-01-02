
import React from 'react';
import { AppView } from '../types';

interface NavigationProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const navItems = [
    { view: AppView.DASHBOARD, icon: 'fa-house', label: 'Home' },
    { view: AppView.LIVE_COMPANION, icon: 'fa-microphone', label: 'Safe' },
    { view: AppView.INCIDENT_VAULT, icon: 'fa-file-shield', label: 'Vault' },
    { view: AppView.WELLBEING_CHAT, icon: 'fa-heart', label: 'Chat' },
    { view: AppView.SETTINGS, icon: 'fa-gear', label: 'More' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-brand-rose/10 flex justify-around items-center px-4 py-4 z-50 bg-white/95 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
      {navItems.map((item) => (
        <button
          key={item.view}
          onClick={() => setView(item.view)}
          className={`flex-1 flex flex-col items-center gap-1.5 transition-all active:scale-90 ${
            currentView === item.view ? 'text-brand-rose' : 'text-brand-charcoal/70'
          }`}
        >
          <div className="relative">
            <i className={`fa-solid ${item.icon} ${currentView === item.view ? 'text-xl' : 'text-lg'}`}></i>
            {item.view === AppView.WELLBEING_CHAT && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-rose rounded-full border-2 border-white"></span>
            )}
          </div>
          <span className={`text-[9px] font-bold uppercase tracking-[0.15em] ${currentView === item.view ? 'opacity-100' : 'opacity-100 text-brand-charcoal'}`}>
            {item.label}
          </span>
          {currentView === item.view && (
            <div className="w-1.5 h-1.5 bg-brand-rose rounded-full mt-0.5"></div>
          )}
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
