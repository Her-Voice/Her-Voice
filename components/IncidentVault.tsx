
import React, { useState, useRef } from 'react';
import { IncidentReport } from '../types';
import MapLayer from './MapLayer';

interface IncidentVaultProps {
  reports: IncidentReport[];
  onUpdateReport?: (report: IncidentReport) => void;
  onDeleteReport: (id: string) => void;
}

const IncidentVault: React.FC<IncidentVaultProps> = ({ reports, onUpdateReport, onDeleteReport }) => {
  const [selectedReport, setSelectedReport] = useState<IncidentReport | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
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

  const handleDeleteConfirm = () => {
    if (reportToDelete) {
      onDeleteReport(reportToDelete);
      setReportToDelete(null);
      setSelectedReport(null);
    }
  };

  return (
    <div className="p-6 pb-24 space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Secure Vault</h2>
        <p className="text-slate-500 text-sm">Your documented experiences, saved securely.</p>
      </header>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
          <i className="fa-solid fa-folder-open text-5xl opacity-20"></i>
          <p className="text-center text-sm px-10">You haven't documented any incidents. We hope it stays that way.</p>
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
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm active:bg-slate-50 transition-colors cursor-pointer group relative"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">
                    {new Date(report.timestamp).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 line-clamp-1">{report.description}</h3>
                    {report.audioData && (
                      <i className="fa-solid fa-microphone text-xs text-purple-500"></i>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                      report.status === 'Finalized' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'
                    }`}>
                      {report.status}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportToDelete(report.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-full bg-red-50 text-red-400 flex items-center justify-center transition-opacity hover:bg-red-100 hover:text-red-600"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                </div>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                {report.context}
              </p>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-4 text-slate-400">
                <div className="flex items-center gap-1.5 text-[10px] font-medium">
                  <i className="fa-solid fa-location-arrow"></i>
                  <span>GPS Logged</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium">
                  <i className="fa-solid fa-lock"></i>
                  <span>Encrypted</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-20 duration-500">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800">Incident Details</h3>
                <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setReportToDelete(selectedReport.id)} 
                      className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center"
                    >
                      <i className="fa-solid fa-trash-can text-xs"></i>
                    </button>
                    <button onClick={() => setSelectedReport(null)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
              </div>
              
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex items-center justify-between bg-slate-50 p-1 rounded-2xl border border-slate-100">
                    <button 
                        onClick={() => setShowMap(false)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${!showMap ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        Report Details
                    </button>
                    <button 
                        onClick={() => setShowMap(true)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${showMap ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        Map Location
                    </button>
                </div>

                {!showMap ? (
                    <div className="space-y-6 animate-in fade-in">
                        {/* Audio Evidence Section */}
                        <section className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3 block">Voice Evidence</label>
                            {selectedReport.audioData ? (
                                <div className="space-y-3">
                                    <audio src={selectedReport.audioData} controls className="w-full h-10 custom-audio" />
                                    <p className="text-[10px] text-purple-600 text-center font-medium">Recorded Note Available</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3">
                                    <button 
                                        onClick={isRecording ? stopRecording : startRecording}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                                            isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-purple-600 shadow-sm'
                                        }`}
                                    >
                                        <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
                                    </button>
                                    <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">
                                        {isRecording ? 'Recording... Tap to Stop' : 'Record Voice Note'}
                                    </p>
                                </div>
                            )}
                        </section>

                        <section>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                            <p className="text-slate-700 font-medium leading-relaxed mt-1">{selectedReport.description}</p>
                        </section>

                        <div className="grid grid-cols-2 gap-4">
                            <section>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date & Time</label>
                                <p className="text-slate-700 text-sm mt-1">{new Date(selectedReport.timestamp).toLocaleString()}</p>
                            </section>
                            <section>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location</label>
                                <p className="text-slate-700 text-sm mt-1">{selectedReport.location.lat.toFixed(4)}, {selectedReport.location.lng.toFixed(4)}</p>
                            </section>
                        </div>

                        <section>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Context/Environment</label>
                            <p className="text-slate-700 text-sm leading-relaxed mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedReport.context}</p>
                        </section>

                        <section>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Perpetrator Details</label>
                            <p className="text-slate-700 text-sm leading-relaxed mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedReport.perpetratorInfo}</p>
                        </section>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in">
                         <div className="h-64 rounded-3xl overflow-hidden border border-slate-200">
                            <MapLayer 
                                center={selectedReport.location}
                                points={[{ 
                                  ...selectedReport.location, 
                                  type: 'incident', 
                                  label: `${selectedReport.description} (${new Date(selectedReport.timestamp).toLocaleString()})` 
                                }]}
                                zoom={17}
                                className="h-full w-full"
                            />
                         </div>
                         <p className="text-center text-xs text-slate-500 italic">This location was logged automatically at the time of the incident.</p>
                    </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button className="py-3 px-4 border border-slate-200 rounded-xl text-slate-600 font-semibold text-sm flex items-center justify-center gap-2">
                  <i className="fa-solid fa-share"></i> Share Report
                </button>
                <button className="py-3 px-4 bg-purple-600 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-200">
                  <i className="fa-solid fa-download"></i> Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 text-3xl mx-auto shadow-inner">
              <i className="fa-solid fa-circle-exclamation animate-bounce"></i>
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-bold text-slate-800">Delete Report?</h4>
              <p className="text-sm text-slate-500 leading-relaxed">
                This action is permanent and your encrypted evidence will be wiped from the vault forever.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDeleteConfirm}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-red-200 active:scale-95 transition-transform"
              >
                DELETE PERMANENTLY
              </button>
              <button 
                onClick={() => setReportToDelete(null)}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                KEEP REPORT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentVault;
