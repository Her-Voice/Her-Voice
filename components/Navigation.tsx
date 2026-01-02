
import React from 'react';
import { AppView } from '../types';

interface NavigationProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const navItems = [
    { view: AppView.DASHBOARD, icon: 'fa-house', label: 'Home' },
    { view: AppView.LIVE_COMPANION, icon: 'fa-microphone', label: 'Safety' },
    { view: AppView.INCIDENT_VAULT, icon: 'fa-shield-halved', label: 'Vault' },
    { view: AppView.WELLBEING_CHAT, icon: 'fa-heart', label: 'Wellbeing' },
    { view: AppView.SETTINGS, icon: 'fa-gear', label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-purple-100 flex justify-around items-center px-4 py-3 z-50">
      {navItems.map((item) => (
        <button
          key={item.view}
          onClick={() => setView(item.view)}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentView === item.view ? 'text-purple-600' : 'text-slate-400'
          }`}
        >
          <i className={`fa-solid ${item.icon} text-lg`}></i>
          <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
