
import React, { useState, useRef } from 'react';
import { IncidentReport } from '../types';
import MapLayer from './MapLayer';

interface IncidentVaultProps {
  reports: IncidentReport[];
  onUpdateReport?: (report: IncidentReport) => void;
  onDeleteReport: (id: string) => void;
  onCreateReport: (report: IncidentReport) => void;
  currentLocation: { lat: number, lng: number };
  isOnline: boolean;
}

const IncidentVault: React.FC<IncidentVaultProps> = ({ 
  reports, 
  onUpdateReport, 
  onDeleteReport, 
  onCreateReport, 
  currentLocation,
  isOnline 
}) => {
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  
  // New Report Form State
  const [newReportForm, setNewReportForm] = useState({
    description: '',
    context: '',
    perpetratorInfo: ''
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          if (selectedReport && onUpdateReport) {
            const updated = { ...selectedReport, audioData: base64Audio };
            onUpdateReport(updated);
            setSelectedReport(updated);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording failed", err);
      alert("Please allow microphone access to record voice notes.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: IncidentReport = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      location: currentLocation,
      description: newReportForm.description,
      context: newReportForm.context,
      perpetratorInfo: newReportForm.perpetratorInfo,
      status: isOnline ? 'Finalized' : 'Draft',
      isSynced: isOnline
    };
    onCreateReport(newReport);
    setIsCreating(false);
    setNewReportForm({ description: '', context: '', perpetratorInfo: '' });
  };

  const handleDeleteConfirm = () => {
    if (reportToDelete) {
      onDeleteReport(reportToDelete);
      setReportToDelete(null);
      setSelectedReport(null);
    }
  };

  const handleSync = (report: IncidentReport) => {
    if (!isOnline) return;
    const updated = { ...report, status: 'Finalized' as const, isSynced: true };
    onUpdateReport?.(updated);
    if (selectedReport?.id === report.id) setSelectedReport(updated);
  };

  return (
    <div className="p-6 pb-24 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif text-brand-charcoal">Secure Vault</h2>
          <p className="text-brand-charcoal/50 text-sm mt-1">Confidential logs of your experiences.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="w-12 h-12 rounded-full bg-brand-rose text-white flex items-center justify-center shadow-lg shadow-brand-rose/20 active:scale-95 transition-transform"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      </header>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-brand-charcoal/20 space-y-6">
          <div className="w-24 h-24 rounded-full bg-brand-beige flex items-center justify-center opacity-50">
             <i className="fa-solid fa-folder-open text-4xl"></i>
          </div>
          <p className="text-center text-xs font-bold uppercase tracking-widest px-10">Your vault is currently empty.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div 
              key={report.id} 
              onClick={() => {
                setSelectedReport(report);
                setShowMap(false);
              }}
              className="bg-white p-6 rounded-[2.5rem] border border-brand-rose/5 shadow-sm active:scale-[0.98] transition-all cursor-pointer group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-brand-rose uppercase tracking-[0.2em]">
                    {new Date(report.timestamp).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-brand-charcoal line-clamp-1">{report.description}</h3>
                    {!report.isSynced && (
                      <i className="fa-solid fa-cloud-arrow-up text-xs text-brand-rose animate-pulse"></i>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tighter ${
                      report.status === 'Finalized' ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-beige text-brand-rose'
                    }`}>
                      {report.status}
                    </div>
                </div>
              </div>
              <p className="text-xs text-brand-charcoal/50 line-clamp-2 leading-relaxed font-medium">
                {report.context}
              </p>
              <div className="mt-6 pt-5 border-t border-brand-beige flex justify-between items-center text-brand-charcoal/30">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    <i className="fa-solid fa-location-dot"></i>
                    <span>GPS Logged</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    <i className="fa-solid fa-lock"></i>
                    <span>Encrypted</span>
                  </div>
                </div>
                {!report.isSynced && isOnline && (
                   <button 
                    onClick={(e) => { e.stopPropagation(); handleSync(report); }}
                    className="text-[10px] font-black text-brand-rose uppercase tracking-widest bg-brand-beige px-3 py-1 rounded-full"
                   >
                     Sync Now
                   </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-brand-charcoal/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-20 duration-500">
             <form onSubmit={handleCreateSubmit} className="p-8 space-y-6">
               <div className="flex justify-between items-center">
                 <h3 className="text-2xl font-serif text-brand-charcoal">New Log</h3>
                 <button type="button" onClick={() => setIsCreating(false)} className="w-10 h-10 rounded-full bg-brand-beige text-brand-charcoal/40 flex items-center justify-center">
                   <i className="fa-solid fa-xmark text-sm"></i>
                 </button>
               </div>

               <div className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-brand-charcoal/40 uppercase tracking-widest px-2">Headline</label>
                   <input 
                    required
                    type="text"
                    placeholder="Brief summary of the incident"
                    value={newReportForm.description}
                    onChange={e => setNewReportForm({...newReportForm, description: e.target.value})}
                    className="w-full bg-brand-beige/30 border border-brand-rose/5 rounded-2xl py-4 px-4 text-sm outline-none focus:ring-2 focus:ring-brand-rose/10 transition-all"
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-brand-charcoal/40 uppercase tracking-widest px-2">Detailed Context</label>
                   <textarea 
                    required
                    rows={3}
                    placeholder="Where were you? What exactly happened?"
                    value={newReportForm.context}
                    onChange={e => setNewReportForm({...newReportForm, context: e.target.value})}
                    className="w-full bg-brand-beige/30 border border-brand-rose/5 rounded-2xl py-4 px-4 text-sm outline-none focus:ring-2 focus:ring-brand-rose/10 transition-all resize-none"
                   />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-brand-charcoal/40 uppercase tracking-widest px-2">Perpetrator Description</label>
                   <input 
                    type="text"
                    placeholder="Physical traits, clothing, behavior"
                    value={newReportForm.perpetratorInfo}
                    onChange={e => setNewReportForm({...newReportForm, perpetratorInfo: e.target.value})}
                    className="w-full bg-brand-beige/30 border border-brand-rose/5 rounded-2xl py-4 px-4 text-sm outline-none focus:ring-2 focus:ring-brand-rose/10 transition-all"
                   />
                 </div>
               </div>

               <button 
                type="submit"
                className="w-full py-5 bg-brand-rose text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-brand-rose/20 active:scale-95 transition-transform"
               >
                 {isOnline ? 'Save & Sync' : 'Save Offline Draft'}
               </button>
             </form>
           </div>
        </div>
      )}

      {/* Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-brand-charcoal/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.15)] animate-in slide-in-from-bottom-20 duration-500">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-serif text-brand-charcoal">Details</h3>
                <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setReportToDelete(selectedReport.id)} 
                      className="w-10 h-10 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <i className="fa-solid fa-trash-can text-sm"></i>
                    </button>
                    <button onClick={() => setSelectedReport(null)} className="w-10 h-10 rounded-full bg-brand-beige text-brand-charcoal/40 flex items-center justify-center">
                      <i className="fa-solid fa-xmark text-sm"></i>
                    </button>
                </div>
              </div>
              
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex items-center justify-between bg-brand-beige p-1.5 rounded-2xl border border-brand-rose/5">
                    <button 
                        onClick={() => setShowMap(false)}
                        className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${!showMap ? 'bg-white text-brand-rose shadow-sm' : 'text-brand-charcoal/40'}`}
                    >
                        Report
                    </button>
                    <button 
                        onClick={() => setShowMap(true)}
                        className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${showMap ? 'bg-white text-brand-rose shadow-sm' : 'text-brand-charcoal/40'}`}
                    >
                        Location
                    </button>
                </div>

                {!showMap ? (
                    <div className="space-y-8 animate-in fade-in">
                        {/* Audio Evidence Section */}
                        <section className="bg-brand-beige/50 p-6 rounded-[2rem] border border-brand-rose/5">
                            <label className="text-[10px] font-black text-brand-rose/60 uppercase tracking-[0.2em] mb-4 block">Voice Evidence</label>
                            {selectedReport.audioData ? (
                                <div className="space-y-4">
                                    <audio src={selectedReport.audioData} controls className="w-full h-10 custom-audio" />
                                    <p className="text-[10px] text-brand-rose text-center font-black uppercase tracking-widest">Authenticated Audio Log</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 py-2">
                                    <button 
                                        onClick={isRecording ? stopRecording : startRecording}
                                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                                            isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-brand-rose'
                                        }`}
                                    >
                                        <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'} text-lg`}></i>
                                    </button>
                                    <p className="text-[10px] font-black text-brand-rose uppercase tracking-[0.2em]">
                                        {isRecording ? 'Recording... Stop' : 'Add Voice Note'}
                                    </p>
                                </div>
                            )}
                        </section>

                        <section>
                            <label className="text-[10px] font-black text-brand-charcoal/30 uppercase tracking-[0.2em]">Context</label>
                            <p className="text-brand-charcoal font-bold text-xs mt-2">{selectedReport.description}</p>
                            <p className="text-brand-charcoal/60 text-xs leading-relaxed mt-3 bg-brand-beige/30 p-4 rounded-2xl border border-brand-rose/5">{selectedReport.context}</p>
                        </section>

                        <div className="grid grid-cols-2 gap-6">
                            <section>
                                <label className="text-[10px] font-black text-brand-charcoal/30 uppercase tracking-[0.2em]">Logged On</label>
                                <p className="text-brand-charcoal font-bold text-xs mt-2">{new Date(selectedReport.timestamp).toLocaleDateString()}</p>
                                <p className="text-brand-charcoal/40 text-[10px] mt-0.5">{new Date(selectedReport.timestamp).toLocaleTimeString()}</p>
                            </section>
                            <section>
                                <label className="text-[10px] font-black text-brand-charcoal/30 uppercase tracking-[0.2em]">Perpetrator</label>
                                <p className="text-brand-charcoal font-bold text-xs mt-2 truncate">{selectedReport.perpetratorInfo || 'Not Provided'}</p>
                            </section>
                        </div>
                        
                        {!selectedReport.isSynced && isOnline && (
                           <div className="bg-brand-beige p-5 rounded-2xl border border-brand-rose/10 flex flex-col items-center gap-3">
                              <p className="text-[10px] font-black text-brand-rose uppercase tracking-widest text-center">Draft ready for secure cloud synchronization</p>
                              <button 
                                onClick={() => handleSync(selectedReport)}
                                className="px-6 py-2 bg-brand-rose text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm"
                              >
                                Sync Cloud Vault
                              </button>
                           </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in">
                         <div className="h-72 rounded-[2.5rem] overflow-hidden border border-brand-rose/10 shadow-inner">
                            <MapLayer 
                                center={selectedReport.location}
                                points={[{ 
                                  ...selectedReport.location, 
                                  type: 'incident', 
                                  label: `${selectedReport.description}` 
                                }]}
                                zoom={17}
                                className="h-full w-full"
                            />
                         </div>
                         <p className="text-center text-[10px] font-black text-brand-charcoal/30 uppercase tracking-[0.2em] pt-2">Encrypted GPS Metadata Attached</p>
                    </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button className="py-4 px-4 bg-brand-beige rounded-2xl text-brand-charcoal font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  <i className="fa-solid fa-share-nodes"></i> Share
                </button>
                <button className="py-4 px-4 bg-brand-rose rounded-2xl text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-brand-rose/20 active:scale-95 transition-transform">
                  <i className="fa-solid fa-file-pdf"></i> Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {reportToDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-8 bg-brand-charcoal/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 space-y-8 shadow-2xl animate-in zoom-in-95 duration-300 text-center">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 text-4xl mx-auto shadow-inner">
              <i className="fa-solid fa-trash-can animate-bounce"></i>
            </div>
            <div className="space-y-3">
              <h4 className="text-2xl font-serif text-brand-charcoal">Wipe Evidence?</h4>
              <p className="text-xs text-brand-charcoal/40 font-medium leading-relaxed uppercase tracking-widest">
                This will permanently delete this log from our encrypted servers.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <button 
                onClick={handleDeleteConfirm}
                className="w-full py-5 bg-red-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-red-200 active:scale-95 transition-transform"
              >
                Delete Log
              </button>
              <button 
                onClick={() => setReportToDelete(null)}
                className="w-full py-5 bg-brand-beige text-brand-charcoal rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] active:scale-95 transition-transform"
              >
                Keep Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentVault;
