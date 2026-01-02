
import React, { useState, useEffect, useCallback } from 'react';
import { AppView, AppState, IncidentReport, EmergencyContact, LocationEntry, CheckInSettings, User } from './types';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import LiveCompanion from './components/LiveCompanion';
import WellbeingChat from './components/WellbeingChat';
import IncidentVault from './components/IncidentVault';
import GroundingExercises from './components/GroundingExercises';
import Settings from './components/Settings';
import MapLayer from './components/MapLayer';
import CheckInReminder from './components/CheckInReminder';
import FakeCall from './components/FakeCall';
import Auth from './components/Auth';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    view: AppView.DASHBOARD,
    isDistressed: false,
    reports: [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        location: { lat: -1.286389, lng: 36.817223 },
        description: 'Verbal harassment at bus stop',
        context: 'Wait for matatu at Tom Mboya St. Crowded area, early evening.',
        perpetratorInfo: 'Man in grey hoodie, roughly 5\'9", acting aggressive.',
        status: 'Finalized'
      }
    ],
    contacts: [
      { name: 'Sarah Mom', phone: '+254 711 222 333', relationship: 'Mother' }
    ],
    location: null,
    locationHistory: [
        { lat: -1.2850, lng: 36.8160, timestamp: new Date(Date.now() - 3600000).toISOString() },
        { lat: -1.2855, lng: 36.8165, timestamp: new Date(Date.now() - 2400000).toISOString() },
        { lat: -1.2860, lng: 36.8170, timestamp: new Date(Date.now() - 1200000).toISOString() },
        { lat: -1.286389, lng: 36.817223, timestamp: new Date().toISOString() },
    ],
    checkIn: {
      enabled: false,
      intervalMinutes: 30,
      lastCheckInTime: new Date().toISOString()
    },
    isAuthenticated: false,
    user: null
  });

  const [showCheckInOverlay, setShowCheckInOverlay] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setState(prev => ({ 
            ...prev, 
            location: pos,
            locationHistory: [...prev.locationHistory, { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: new Date().toISOString() }]
        }));
      }, (err) => console.warn("Location access denied", err));
    }
  }, []);

  // Check-in timer logic
  useEffect(() => {
    if (!state.isAuthenticated || !state.checkIn.enabled || showCheckInOverlay || state.isDistressed) return;

    const interval = setInterval(() => {
      const last = new Date(state.checkIn.lastCheckInTime).getTime();
      const now = Date.now();
      const diffMinutes = (now - last) / (1000 * 60);

      if (diffMinutes >= state.checkIn.intervalMinutes) {
        setShowCheckInOverlay(true);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [state.checkIn, showCheckInOverlay, state.isDistressed, state.isAuthenticated]);

  const setView = (view: AppView) => setState(prev => ({ ...prev, view }));
  
  const onDistress = (status: boolean) => {
    setState(prev => ({ ...prev, isDistressed: status }));
    setShowCheckInOverlay(false);
    if (status) {
      const contactNames = state.contacts.map(c => c.name).join(", ") || "Emergency Services";
      alert(`Emergency Protocol Initialized!\n\nLocation: ${state.location?.coords.latitude || 'Unknown'}, ${state.location?.coords.longitude || 'Unknown'}\nAlerted: ${contactNames}`);
    }
  };

  const handleUpdateContacts = (newContacts: EmergencyContact[]) => {
    setState(prev => ({ ...prev, contacts: newContacts }));
  };

  const handleUpdateReport = (updatedReport: IncidentReport) => {
    setState(prev => ({
      ...prev,
      reports: prev.reports.map(r => r.id === updatedReport.id ? updatedReport : r)
    }));
  };

  const handleDeleteReport = (id: string) => {
    setState(prev => ({
      ...prev,
      reports: prev.reports.filter(r => r.id !== id)
    }));
  };

  const handleUpdateCheckIn = (newSettings: Partial<CheckInSettings>) => {
    setState(prev => ({
      ...prev,
      checkIn: { ...prev.checkIn, ...newSettings }
    }));
  };

  const handleUpdateUser = (updatedUser: User) => {
    setState(prev => ({ ...prev, user: updatedUser }));
  };

  const handleLogin = (user: User) => {
    setState(prev => ({ ...prev, isAuthenticated: true, user }));
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, isAuthenticated: false, user: null, view: AppView.DASHBOARD }));
  };

  const confirmSafe = () => {
    setShowCheckInOverlay(false);
    setState(prev => ({
      ...prev,
      checkIn: { ...prev.checkIn, lastCheckInTime: new Date().toISOString() }
    }));
  };

  const startCompanionFromCheckIn = () => {
    setShowCheckInOverlay(false);
    setState(prev => ({
      ...prev,
      view: AppView.LIVE_COMPANION,
      checkIn: { ...prev.checkIn, lastCheckInTime: new Date().toISOString() }
    }));
  };

  if (!state.isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (state.view) {
      case AppView.DASHBOARD:
        return <Dashboard 
          setView={setView} 
          reports={state.reports} 
          isDistressed={state.isDistressed} 
          history={state.locationHistory}
          checkIn={state.checkIn}
        />;
      case AppView.LIVE_COMPANION:
        return <LiveCompanion onDistress={onDistress} />;
      case AppView.WELLBEING_CHAT:
        return <WellbeingChat setView={setView} />;
      case AppView.GROUNDING:
        return <GroundingExercises onBack={() => setView(AppView.DASHBOARD)} />;
      case AppView.INCIDENT_VAULT:
        return <IncidentVault reports={state.reports} onUpdateReport={handleUpdateReport} onDeleteReport={handleDeleteReport} />;
      case AppView.SETTINGS:
        return <Settings 
          contacts={state.contacts} 
          onUpdateContacts={handleUpdateContacts}
          checkIn={state.checkIn}
          onUpdateCheckIn={handleUpdateCheckIn}
          user={state.user}
          onUpdateUser={handleUpdateUser}
          onLogout={handleLogout}
        />;
      case AppView.MAP_HISTORY:
        return (
            <div className="p-6 pb-24 space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
                <header className="flex items-center gap-4">
                    <button onClick={() => setView(AppView.DASHBOARD)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><i className="fa-solid fa-arrow-left"></i></button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Your Path</h2>
                        <p className="text-xs text-slate-500">Location history for the last 24h</p>
                    </div>
                </header>
                <div className="flex-1 min-h-[400px]">
                    <MapLayer 
                        center={state.locationHistory[state.locationHistory.length - 1] || { lat: -1.286389, lng: 36.817223 }}
                        path={state.locationHistory}
                        points={state.locationHistory.map((p, i) => ({ 
                            ...p, 
                            type: i === state.locationHistory.length - 1 ? 'current' : 'history',
                            label: new Date(p.timestamp).toLocaleTimeString()
                        }))}
                        zoom={16}
                        className="h-full w-full rounded-3xl border-2 border-slate-100 shadow-inner"
                    />
                </div>
            </div>
        );
      case AppView.FAKE_CALL:
        return <FakeCall onBack={() => setView(AppView.DASHBOARD)} />;
      default:
        return <Dashboard 
          setView={setView} 
          reports={state.reports} 
          isDistressed={state.isDistressed} 
          history={state.locationHistory}
          checkIn={state.checkIn}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 overflow-x-hidden flex flex-col max-w-md mx-auto relative shadow-2xl ring-1 ring-slate-200">
      <main className="flex-1 bg-white flex flex-col h-full overflow-hidden">
        {/* Persistent Global Header */}
        <header className="sticky top-0 z-[70] glass border-b border-slate-100 px-4 py-3 flex justify-between items-center bg-white/90">
          <div 
            className="flex items-center gap-2 cursor-pointer active:opacity-70 transition-opacity"
            onClick={() => setView(AppView.DASHBOARD)}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <i className="fa-solid fa-v text-sm"></i>
            </div>
            <span className="font-bold text-slate-800 tracking-tight">HerVoice</span>
          </div>
          
          <button 
            onClick={() => onDistress(true)}
            className="bg-red-600 text-white px-5 py-2 rounded-full text-xs font-black shadow-lg shadow-red-200 flex items-center gap-2 pulse active:scale-95 transition-transform"
          >
            <i className="fa-solid fa-triangle-exclamation"></i>
            SOS
          </button>
        </header>

        {/* Dynamic View Content */}
        <div className="flex-1 overflow-y-auto">
          {renderView()}
        </div>
      </main>

      <Navigation currentView={state.view} setView={setView} />
      
      {state.isDistressed && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-[10px] font-black py-1 px-4 text-center z-[80] tracking-[0.2em] animate-pulse uppercase">
          Emergency Mode Active • Help Requested
        </div>
      )}

      {showCheckInOverlay && (
        <CheckInReminder 
          onConfirmSafe={confirmSafe}
          onStartCompanion={startCompanionFromCheckIn}
          onPanic={() => onDistress(true)}
        />
      )}
    </div>
  );
};

export default App;
