
import React, { useState, useEffect } from 'react';
import { AppView, IncidentReport, LocationEntry, CheckInSettings } from '../types';
import MapLayer from './MapLayer';
import { getLocationSafetyTip } from '../services/geminiService';

interface DashboardProps {
  setView: (view: AppView) => void;
  reports: IncidentReport[];
  isDistressed: boolean;
  history: LocationEntry[];
  checkIn: CheckInSettings;
  isOnline: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ setView, reports, isDistressed, history, checkIn, isOnline }) => {
  const lastLocation = history[history.length - 1] || { lat: -1.286389, lng: 36.817223 };
  const [safetyTip, setSafetyTip] = useState<string>("Analyzing your surroundings for safety...");
  const [isLoadingTip, setIsLoadingTip] = useState(true);

  useEffect(() => {
    const fetchTip = async () => {
      if (!isOnline) {
        setSafetyTip("Offline mode active. Keep your phone charged and stay in well-lit populated areas.");
        setIsLoadingTip(false);
        return;
      }
      setIsLoadingTip(true);
      const tip = await getLocationSafetyTip(lastLocation.lat, lastLocation.lng);
      setSafetyTip(tip);
      setIsLoadingTip(false);
    };
    
    fetchTip();
  }, [lastLocation.lat, lastLocation.lng, isOnline]);

  const getNextCheckInText = () => {
    if (!checkIn.enabled) return "Not active";
    const last = new Date(checkIn.lastCheckInTime).getTime();
    const next = last + (checkIn.intervalMinutes * 60 * 1000);
    const diffMins = Math.max(0, Math.round((next - Date.now()) / (1000 * 60)));
    return `In ${diffMins}m`;
  };

  return (
    <div className="p-6 pb-28 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif text-brand-charcoal">Hello, Sister</h1>
          <p className="text-brand-charcoal/80 text-sm font-medium">Your companion is standing by.</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-brand-beige flex items-center justify-center text-brand-rose shadow-sm border-2 border-white">
          <i className="fa-solid fa-user"></i>
        </div>
      </header>

      {/* Check-in Quick Status Card */}
      {checkIn.enabled && (
        <div className="bg-white p-4 rounded-3xl border border-brand-rose/15 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-rose/10 text-brand-rose flex items-center justify-center">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-brand-rose uppercase tracking-widest">Next Check-in</p>
              <p className="text-brand-charcoal font-bold text-sm">{getNextCheckInText()}</p>
            </div>
          </div>
          <button 
            onClick={() => setView(AppView.SETTINGS)}
            className="text-[10px] font-black text-brand-rose bg-brand-beige px-3 py-1.5 rounded-full uppercase tracking-tighter"
          >
            Adjust
          </button>
        </div>
      )}

      {/* Safety Alert Status */}
      <div className={`p-6 rounded-[2.5rem] shadow-xl border transition-all ${
        isDistressed 
          ? 'bg-red-50 border-red-200' 
          : 'bg-brand-rose text-white border-brand-rose/20 shadow-brand-rose/15'
      }`}>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-serif">{isDistressed ? 'Alert Active' : 'Safety Mode'}</h2>
            <p className="text-xs opacity-90 font-medium mt-1">{isDistressed ? 'Help is being coordinated.' : 'Voice monitoring is ready when you are.'}</p>
          </div>
          <div className="p-3 bg-white/20 rounded-2xl text-white">
            <i className={`fa-solid ${isDistressed ? 'fa-triangle-exclamation' : 'fa-shield-heart'} text-lg`}></i>
          </div>
        </div>
        <button 
          onClick={() => setView(AppView.LIVE_COMPANION)}
          className="w-full py-4 bg-white text-brand-rose rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
        >
          {isDistressed ? 'Coordinate Help' : 'Start Monitoring'}
        </button>
      </div>

      {/* Map Snapshot */}
      <section className="bg-white border border-brand-rose/5 rounded-[2.5rem] p-3 shadow-sm relative overflow-hidden group">
        <div className="h-40 w-full rounded-[2rem] overflow-hidden pointer-events-none opacity-90 transition-opacity group-hover:opacity-100">
            <MapLayer 
                center={lastLocation}
                path={history.slice(-5)} 
                points={[{ ...lastLocation, type: 'current' }]}
                zoom={14}
                className="h-full w-full"
            />
        </div>
        <div className="absolute inset-x-6 bottom-6 flex justify-between items-end">
            <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl border border-brand-beige shadow-sm max-w-[75%]">
                <h3 className="text-brand-charcoal font-bold text-xs">Safe Path Logged</h3>
                <p className="text-brand-charcoal/70 text-[10px] truncate mt-1 font-bold">Last activity at {new Date(history[history.length-1]?.timestamp).toLocaleTimeString()}</p>
            </div>
            <button 
                onClick={() => setView(AppView.MAP_HISTORY)}
                className="w-12 h-12 rounded-full bg-brand-rose text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
                <i className="fa-solid fa-expand"></i>
            </button>
        </div>
      </section>

      {/* Dynamic AI Safety Tip */}
      <div className="p-6 bg-white border border-brand-rose/5 rounded-[2.5rem] flex gap-5 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <i className="fa-solid fa-sparkles text-6xl text-brand-rose"></i>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-brand-beige text-brand-rose flex items-center justify-center shrink-0">
          <i className={`fa-solid ${isOnline ? 'fa-wand-magic-sparkles' : 'fa-cloud-slash'} text-xl`}></i>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-[10px] font-black text-brand-rose uppercase tracking-[0.2em]">{isOnline ? 'Live Insights' : 'Offline Guide'}</h4>
            {isLoadingTip && <i className="fa-solid fa-circle-notch animate-spin text-[10px] text-brand-rose/40"></i>}
          </div>
          <p className={`text-sm text-brand-charcoal leading-relaxed transition-opacity duration-500 font-bold ${isLoadingTip ? 'opacity-50' : 'opacity-100'}`}>
            "{safetyTip}"
          </p>
        </div>
      </div>

      {/* Feature Grid */}
      <section>
        <h3 className="text-[10px] font-black text-brand-charcoal/50 uppercase tracking-[0.2em] mb-4 ml-2">Digital Tools</h3>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setView(AppView.WELLBEING_CHAT)}
            className="p-6 bg-white rounded-[2rem] border border-brand-rose/5 flex flex-col items-center gap-4 shadow-sm hover:shadow-md transition-all text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-400 flex items-center justify-center">
              <i className="fa-solid fa-heart text-xl"></i>
            </div>
            <div>
                <span className="text-xs font-bold text-brand-charcoal block">Companion Chat</span>
                <span className="text-[10px] text-brand-charcoal/60 font-bold">{isOnline ? 'Talk & Reflect' : 'Sync Required'}</span>
            </div>
          </button>
          <button 
            onClick={() => setView(AppView.GROUNDING)}
            className="p-6 bg-white rounded-[2rem] border border-brand-rose/5 flex flex-col items-center gap-4 shadow-sm hover:shadow-md transition-all text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-400 flex items-center justify-center">
              <i className="fa-solid fa-wind text-xl"></i>
            </div>
            <div>
                <span className="text-xs font-bold text-brand-charcoal block">Grounding</span>
                <span className="text-[10px] text-brand-charcoal/60 font-bold">Works Offline</span>
            </div>
          </button>
          <button 
            onClick={() => setView(AppView.FAKE_CALL)}
            className="p-6 bg-white rounded-[2rem] border border-brand-rose/5 flex flex-col items-center gap-4 shadow-sm hover:shadow-md transition-all text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-400 flex items-center justify-center">
              <i className="fa-solid fa-phone-volume text-xl"></i>
            </div>
            <div>
                <span className="text-xs font-bold text-brand-charcoal block">Fake Call</span>
                <span className="text-[10px] text-brand-charcoal/60 font-bold">Exit situations</span>
            </div>
          </button>
        </div>
      </section>

      {/* Vault Preview */}
      <section>
        <div className="flex justify-between items-center mb-5 ml-2">
          <h3 className="text-[10px] font-black text-brand-charcoal/50 uppercase tracking-[0.2em]">Incident Vault</h3>
          <button onClick={() => setView(AppView.INCIDENT_VAULT)} className="text-[10px] text-brand-rose font-black uppercase tracking-widest bg-brand-beige px-3 py-1 rounded-full">View Vault</button>
        </div>
        {reports.length > 0 ? (
          <div className="space-y-4">
            {reports.slice(0, 1).map(report => (
              <div key={report.id} className="p-6 bg-white rounded-[2.5rem] border border-brand-rose/5 flex items-center gap-5 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-brand-beige flex items-center justify-center text-brand-charcoal/40">
                  <i className="fa-solid fa-file-shield text-xl"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-brand-charcoal truncate">{report.description}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[10px] text-brand-charcoal/60 font-bold uppercase tracking-widest">{new Date(report.timestamp).toLocaleDateString()}</p>
                    {report.status === 'Draft' && <span className="w-1.5 h-1.5 bg-brand-rose rounded-full animate-pulse"></span>}
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${report.isSynced ? 'bg-emerald-500 shadow-emerald-100' : 'bg-brand-rose shadow-brand-rose/20'} shadow-lg`}></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-brand-charcoal/40 bg-white/50 rounded-[2.5rem] border border-brand-rose/5 border-dashed">
            <p className="text-xs font-bold uppercase tracking-widest">Safe travels, sister.</p>
          </div>
        )}
      </section>
      
      {/* Footer Branding */}
      <div className="pt-4 flex flex-col items-center opacity-40">
         <div className="w-9 h-9 rounded-lg bg-brand-charcoal flex items-center justify-center text-white mb-2 p-1.5">
             <svg viewBox="0 0 100 120" className="w-full h-full stroke-white fill-none stroke-[4] transform scale-110">
                <path d="M48 32 C38 30, 36 22, 42 16 C48 10, 56 12, 60 20 C64 28, 55 35, 48 38 C42 42, 40 55, 45 68 C50 78, 42 90, 38 95" />
                <path d="M42 16 C38 16, 36 19, 38 23 C40 27, 46 25, 42 16 Z" />
                <path d="M50 48 C62 50, 72 60, 72 75" />
                <path d="M45 18 C48 15, 52 16, 54 20" />
            </svg>
         </div>
         <p className="text-[10px] font-black uppercase tracking-[0.3em]">HerVoice AI</p>
      </div>
    </div>
  );
};

export default Dashboard;
