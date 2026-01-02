
import React from 'react';
import { AppView, IncidentReport, LocationEntry, CheckInSettings } from '../types';
import MapLayer from './MapLayer';

interface DashboardProps {
  setView: (view: AppView) => void;
  reports: IncidentReport[];
  isDistressed: boolean;
  history: LocationEntry[];
  checkIn: CheckInSettings;
}

const Dashboard: React.FC<DashboardProps> = ({ setView, reports, isDistressed, history, checkIn }) => {
  const lastLocation = history[history.length - 1] || { lat: -1.286389, lng: 36.817223 };

  const getNextCheckInText = () => {
    if (!checkIn.enabled) return "Not active";
    const last = new Date(checkIn.lastCheckInTime).getTime();
    const next = last + (checkIn.intervalMinutes * 60 * 1000);
    const diffMins = Math.max(0, Math.round((next - Date.now()) / (1000 * 60)));
    return `In ${diffMins}m`;
  };

  return (
    <div className="p-6 pb-24 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Hello, Sister</h1>
          <p className="text-slate-500">How are you feeling today?</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
          <i className="fa-solid fa-user"></i>
        </div>
      </header>

      {/* Check-in Quick Status Card */}
      {checkIn.enabled && (
        <div className="bg-orange-50 border border-orange-100 p-4 rounded-3xl flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div>
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Next Check-in</p>
              <p className="text-orange-900 font-bold text-sm">{getNextCheckInText()}</p>
            </div>
          </div>
          <button 
            onClick={() => setView(AppView.SETTINGS)}
            className="text-[10px] font-black text-orange-600 bg-orange-200/50 px-3 py-1 rounded-full uppercase tracking-tighter"
          >
            Adjust
          </button>
        </div>
      )}

      {/* Safety Alert Status */}
      <div className={`p-6 rounded-3xl shadow-sm border transition-all ${
        isDistressed ? 'bg-red-50 border-red-200' : 'bg-gradient-to-br from-purple-500 to-indigo-600 border-purple-400'
      }`}>
        <div className="flex justify-between items-start mb-4">
          <div className="text-white">
            <h2 className="text-lg font-semibold">{isDistressed ? 'Alert Active' : 'Safety Check-in'}</h2>
            <p className="text-sm opacity-90">{isDistressed ? 'Help is being coordinated.' : 'Your digital companion is standing by.'}</p>
          </div>
          <div className="p-2 bg-white/20 rounded-full text-white">
            <i className={`fa-solid ${isDistressed ? 'fa-triangle-exclamation pulse' : 'fa-check'}`}></i>
          </div>
        </div>
        <button 
          onClick={() => setView(AppView.LIVE_COMPANION)}
          className="w-full py-3 bg-white text-purple-600 rounded-xl font-semibold shadow-lg active:scale-95 transition-transform"
        >
          {isDistressed ? 'Coordinate Help' : 'Start Companion Session'}
        </button>
      </div>

      {/* Map Snapshot */}
      <section className="bg-white border border-slate-100 rounded-3xl p-2 shadow-sm relative overflow-hidden group">
        <div className="h-32 w-full rounded-2xl overflow-hidden pointer-events-none opacity-80 transition-opacity group-hover:opacity-100">
            <MapLayer 
                center={lastLocation}
                path={history.slice(-5)} // Just the last 5 points for snapshot
                points={[{ ...lastLocation, type: 'current' }]}
                zoom={14}
                className="h-full w-full"
            />
        </div>
        <div className="absolute inset-x-4 bottom-4 flex justify-between items-end">
            <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl border border-slate-200 shadow-sm max-w-[70%]">
                <h3 className="text-slate-800 font-bold text-xs">Recent Path</h3>
                <p className="text-slate-500 text-[10px] truncate">Tracking safely since {new Date(history[0]?.timestamp).toLocaleTimeString()}</p>
            </div>
            <button 
                onClick={() => setView(AppView.MAP_HISTORY)}
                className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
            >
                <i className="fa-solid fa-expand"></i>
            </button>
        </div>
      </section>

      {/* Grounding Exercise Feature Card */}
      <section className="bg-teal-50 border border-teal-100 rounded-3xl p-5 flex items-center gap-4 cursor-pointer hover:bg-teal-100 transition-colors" onClick={() => setView(AppView.GROUNDING)}>
        <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-200 shrink-0">
          <i className="fa-solid fa-wind text-xl"></i>
        </div>
        <div className="flex-1">
          <h3 className="text-teal-900 font-bold text-sm">Need a moment to breathe?</h3>
          <p className="text-teal-700 text-xs">Try a guided grounding exercise to feel safe and present.</p>
        </div>
        <i className="fa-solid fa-chevron-right text-teal-300"></i>
      </section>

      {/* Quick Tools */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => setView(AppView.WELLBEING_CHAT)}
            className="p-3 bg-white rounded-2xl border border-slate-100 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <i className="fa-solid fa-heart-pulse"></i>
            </div>
            <span className="text-[10px] font-bold text-slate-700 uppercase">Chat</span>
          </button>
          <button 
            onClick={() => setView(AppView.INCIDENT_VAULT)}
            className="p-3 bg-white rounded-2xl border border-slate-100 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
              <i className="fa-solid fa-file-invoice"></i>
            </div>
            <span className="text-[10px] font-bold text-slate-700 uppercase">Vault</span>
          </button>
          <button 
            onClick={() => setView(AppView.FAKE_CALL)}
            className="p-3 bg-white rounded-2xl border border-slate-100 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
              <i className="fa-solid fa-phone"></i>
            </div>
            <span className="text-[10px] font-bold text-slate-700 uppercase">Fake Call</span>
          </button>
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Recent Activity</h3>
          <button onClick={() => setView(AppView.INCIDENT_VAULT)} className="text-xs text-purple-600 font-medium">View All</button>
        </div>
        {reports.length > 0 ? (
          <div className="space-y-3">
            {reports.slice(0, 2).map(report => (
              <div key={report.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-800 truncate">{report.description}</h4>
                  <p className="text-xs text-slate-400">{new Date(report.timestamp).toLocaleDateString()}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                  report.status === 'Finalized' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                }`}>
                  {report.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
            <p className="text-sm">No incidents reported yet. Safe travels!</p>
          </div>
        )}
      </section>

      {/* Nairobi Safety Tip */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-4">
        <i className="fa-solid fa-lightbulb text-blue-400 mt-1"></i>
        <div>
          <h4 className="text-sm font-bold text-blue-800">Safety Tip: Nairobi CBD</h4>
          <p className="text-xs text-blue-600 mt-1">Keep your phone discreet while walking near the Archive area. Stay focused on your surroundings.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
