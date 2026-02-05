
import React from 'react';
import { AppView } from '../types';

interface NavigationProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

// This component is deprecated - Navigation is now handled in App.tsx for responsive design
const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  return null;
};

export default Navigation;
