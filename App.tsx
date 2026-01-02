
import React, { useState, useEffect, useCallback } from 'react';
import { AppView, AppState, IncidentReport, EmergencyContact, LocationEntry, CheckInSettings, User, VoiceSettings } from './types';
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

const SESSION_KEY = 'hervoice_user_session';
const THEME_KEY = 'hervoice_theme_pref';
const REPORTS_KEY = 'hervoice_reports';
const CONTACTS_KEY = 'hervoice_contacts';
const BIOMETRIC_KEY = 'hervoice_biometric_enabled';
const VOICE_KEY = 'hervoice_voice_settings';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const savedReports = localStorage.getItem(REPORTS_KEY);
    const savedContacts = localStorage.getItem(CONTACTS_KEY);
    const savedBiometric = localStorage.getItem(BIOMETRIC_KEY) === 'true';
    const savedVoice = localStorage.getItem(VOICE_KEY);
    
    return {
      view: AppView.DASHBOARD,
      isDistressed: false,
      reports: savedReports ? JSON.parse(savedReports) : [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          location: { lat: -1.286389, lng: 36.817223 },
          description: 'Verbal harassment at bus stop',
          context: 'Wait for matatu at Tom Mboya St. Crowded area, early evening.',
          perpetratorInfo: 'Man in grey hoodie, roughly 5\'9", acting aggressive.',
          status: 'Finalized',
          isSynced: true
        }
      ],
      contacts: savedContacts ? JSON.parse(savedContacts) : [
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
      user: null,
      theme: (localStorage.getItem(THEME_KEY) as 'light' | 'dark') || 'light',
      isOnline: navigator.onLine,
      biometricEnabled: savedBiometric,
      voiceSettings: savedVoice ? JSON.parse(savedVoice) : { voiceName: 'Kore', speakingRate: 1.0 }
    };
  });

  const [showCheckInOverlay, setShowCheckInOverlay] = useState(false);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(state.reports));
  }, [state.reports]);

  useEffect(() => {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(state.contacts));
  }, [state.contacts]);

  useEffect(() => {
    localStorage.setItem(BIOMETRIC_KEY, state.biometricEnabled.toString());
  }, [state.biometricEnabled]);

  useEffect(() => {
    localStorage.setItem(VOICE_KEY, JSON.stringify(state.voiceSettings));
  }, [state.voiceSettings]);

  // Connectivity detection
  useEffect(() => {
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-login effect
  useEffect(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const user = JSON.parse(savedSession) as User;
        setState(prev => ({ ...prev, isAuthenticated: true, user }));
      } catch (e) {
        console.error("Failed to restore session", e);
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  // Theme effect
  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, state.theme);
  }, [state.theme]);

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
      const offlineMsg = !state.isOnline ? "\n(App is offline, but SOS is logged locally)" : "";
      alert(`Emergency Protocol Initialized!${offlineMsg}\n\nLocation: ${state.location?.coords.latitude || 'Unknown'}, ${state.location?.coords.longitude || 'Unknown'}\nAlerted: ${contactNames}`);
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

  const handleCreateReport = (newReport: IncidentReport) => {
    setState(prev => ({
      ...prev,
      reports: [newReport, ...prev.reports]
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

  const handleUpdateVoiceSettings = (newSettings: Partial<VoiceSettings>) => {
    setState(prev => ({
      ...prev,
      voiceSettings: { ...prev.voiceSettings, ...newSettings }
    }));
  };

  const handleUpdateUser = (updatedUser: User) => {
    setState(prev => ({ ...prev, user: updatedUser }));
    // Update storage if session is persisted
    if (localStorage.getItem(SESSION_KEY)) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedUser));
    }
  };

  const handleLogin = (user: User, remember: boolean) => {
    setState(prev => ({ ...prev, isAuthenticated: true, user }));
    if (remember) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, isAuthenticated: false, user: null, view: AppView.DASHBOARD }));
    localStorage.removeItem(SESSION_KEY);
  };

  const toggleTheme = () => {
    setState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
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

  const toggleBiometric = () => {
    setState(prev => ({ ...prev, biometricEnabled: !prev.biometricEnabled }));
  };

  if (!state.isAuthenticated) {
    return <Auth onLogin={handleLogin} biometricEnabled={state.biometricEnabled} />;
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
          isOnline={state.isOnline}
        />;
      case AppView.LIVE_COMPANION:
        return <LiveCompanion onDistress={onDistress} isOnline={state.isOnline} voiceSettings={state.voiceSettings} />;
      case AppView.WELLBEING_CHAT:
        return <WellbeingChat setView={setView} isOnline={state.isOnline} />;
      case AppView.GROUNDING:
        return <GroundingExercises onBack={() => setView(AppView.DASHBOARD)} />;
      case AppView.INCIDENT_VAULT:
        return <IncidentVault 
            reports={state.reports} 
            onUpdateReport={handleUpdateReport} 
            onDeleteReport={handleDeleteReport} 
            onCreateReport={handleCreateReport}
            currentLocation={state.location ? { lat: state.location.coords.latitude, lng: state.location.coords.longitude } : { lat: -1.286389, lng: 36.817223 }}
            isOnline={state.isOnline}
        />;
      case AppView.SETTINGS:
        return <Settings 
          contacts={state.contacts} 
          onUpdateContacts={handleUpdateContacts}
          checkIn={state.checkIn}
          onUpdateCheckIn={handleUpdateCheckIn}
          voiceSettings={state.voiceSettings}
          onUpdateVoiceSettings={handleUpdateVoiceSettings}
          user={state.user}
          onUpdateUser={handleUpdateUser}
          onLogout={handleLogout}
          theme={state.theme}
          onToggleTheme={toggleTheme}
          biometricEnabled={state.biometricEnabled}
          onToggleBiometric={toggleBiometric}
        />;
      case AppView.MAP_HISTORY:
        return (
            <div className="p-6 pb-24 space-y-6 animate-in fade-in duration-300 h-full flex flex-col dark:bg-slate-900">
                <header className="flex items-center gap-4">
                    <button onClick={() => setView(AppView.DASHBOARD)} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500"><i className="fa-solid fa-arrow-left"></i></button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Your Path</h2>
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
                        className="h-full w-full rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-inner"
                    />
                </div>
            </div>
        );
      case AppView.FAKE_CALL:
        return <FakeCall onBack={() => setView(AppView.DASHBOARD)} isOnline={state.isOnline} voiceSettings={state.voiceSettings} />;
      default:
        return <Dashboard 
          setView={setView} 
          reports={state.reports} 
          isDistressed={state.isDistressed} 
          history={state.locationHistory}
          checkIn={state.checkIn}
          isOnline={state.isOnline}
        />;
    }
  };

  return (
    <div className={`min-h-screen ${state.theme === 'dark' ? 'bg-slate-950' : 'bg-brand-beige'} overflow-x-hidden flex flex-col max-w-md mx-auto relative shadow-2xl ring-1 ring-slate-200/20 transition-colors duration-300`}>
      <main className="flex-1 bg-white dark:bg-slate-900 flex flex-col h-full overflow-hidden transition-colors duration-300">
        {/* Persistent Global Header */}
        <header className="sticky top-0 z-[70] glass dark:bg-slate-900/90 border-b border-brand-beige/20 dark:border-slate-800 px-4 py-3 flex justify-between items-center transition-colors duration-300">
          <div 
            className="flex items-center gap-2 cursor-pointer active:opacity-70 transition-opacity"
            onClick={() => setView(AppView.DASHBOARD)}
          >
            <div className="w-10 h-10 rounded-full bg-brand-rose flex items-center justify-center text-white shadow-sm overflow-hidden p-1.5">
                 {/* Recreating the provided messy bun silhouette with path data */}
                 <svg viewBox="0 0 100 120" className="w-full h-full stroke-white fill-none stroke-[4] transform scale-110">
                    <path d="M48 32 C38 30, 36 22, 42 16 C48 10, 56 12, 60 20 C64 28, 55 35, 48 38 C42 42, 40 55, 45 68 C50 78, 42 90, 38 95" />
                    <path d="M42 16 C38 16, 36 19, 38 23 C40 27, 46 25, 42 16 Z" />
                    <path d="M50 48 C62 50, 72 60, 72 75" />
                    <path d="M45 18 C48 15, 52 16, 54 20" />
                </svg>
            </div>
            <span className="font-serif text-brand-rose tracking-tight text-xl pt-0.5 ml-1">HerVoice</span>
          </div>
          
          <div className="flex items-center gap-3">
            {!state.isOnline && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg animate-pulse">
                <i className="fa-solid fa-cloud-slash text-[10px] text-slate-400"></i>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Offline</span>
              </div>
            )}
            <button 
              onClick={() => onDistress(true)}
              className="bg-brand-rose text-white px-5 py-2 rounded-full text-[10px] font-black shadow-lg shadow-brand-rose/20 flex items-center gap-2 pulse active:scale-95 transition-transform uppercase tracking-widest"
            >
              <i className="fa-solid fa-triangle-exclamation"></i>
              SOS
            </button>
          </div>
        </header>

        {/* Dynamic View Content */}
        <div className="flex-1 overflow-y-auto bg-brand-beige/50 dark:bg-slate-900">
          {renderView()}
        </div>
      </main>

      <Navigation currentView={state.view} setView={setView} />
      
      {state.isDistressed && (
        <div className="fixed top-0 left-0 right-0 bg-brand-rose text-white text-[10px] font-black py-1 px-4 text-center z-[80] tracking-[0.2em] animate-pulse uppercase">
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
