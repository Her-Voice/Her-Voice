
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { encode, decode, decodeAudioData } from '../services/geminiService';
import { VoiceSettings } from '../types';

interface LiveCompanionProps {
  onDistress: (status: boolean) => void;
  isOnline: boolean;
  voiceSettings: VoiceSettings;
}

const LiveCompanion: React.FC<LiveCompanionProps> = ({ onDistress, isOnline, voiceSettings }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("Tap to start digital safety monitoring");
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startSession = async () => {
    try {
      setStatus("Initializing AI Companion...");
      setIsActive(true);
      
      // Initialize GoogleGenAI with the API key from environment variables
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus("I'm right here with you. Speak if you need anything.");
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              // Wait for sessionPromise to resolve before sending input
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              const ctx = outputCtx;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error("Session Error:", e),
          onclose: () => {
            setIsActive(false);
            setStatus("Monitoring ended.");
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceSettings.voiceName } }
          },
          systemInstruction: "You are HerVoice AI. Guide the user if they sound distressed. Offer breathing exercises if panicking. Use a calm, reassuring voice. Your personality is that of a warm, reliable sister."
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus("Could not connect. Please check microphone.");
      setIsActive(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsActive(false);
    setStatus("Session completed.");
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 lg:p-16 h-full space-y-12 animate-in slide-in-from-bottom-10 bg-brand-beige/20 max-w-6xl mx-auto w-full">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-serif text-brand-charcoal">Safety Guardian</h2>
        <p className="text-brand-charcoal/50 max-w-[240px] text-sm leading-relaxed">{status}</p>
      </div>

      <div className="relative flex items-center justify-center h-72 w-72">
        {/* Decorative Rings */}
        <div className={`absolute inset-0 rounded-full border border-brand-rose/20 transition-transform duration-1000 ${isActive ? 'scale-110 opacity-100' : 'scale-75 opacity-0'}`}></div>
        <div className={`absolute inset-6 rounded-full border border-brand-rose/40 transition-transform duration-700 delay-75 ${isActive ? 'scale-110 opacity-80' : 'scale-75 opacity-0'}`}></div>
        
        {/* Main Button */}
        <button
          onClick={isActive ? stopSession : startSession}
          className={`relative z-10 w-52 h-52 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-[0_20px_50px_rgba(185,109,102,0.15)] active:scale-95 ${
            isActive ? 'bg-white text-brand-rose border-4 border-brand-rose' : 'bg-brand-rose text-white'
          }`}
        >
          <div className="mb-4">
             {isActive ? (
                <div className="flex gap-1.5 items-center justify-center h-10">
                   {[...Array(4)].map((_, i) => (
                     <div key={i} className="w-1.5 bg-brand-rose rounded-full animate-bounce" style={{ animationDelay: `${i*0.1}s`, height: `${12+i*4}px` }}></div>
                   ))}
                </div>
             ) : (
                <i className="fa-solid fa-microphone text-5xl"></i>
             )}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
            {isActive ? 'Disconnect' : 'Connect'}
          </span>
        </button>
      </div>

      <div className="w-full max-w-sm grid grid-cols-2 gap-4">
        <button 
          onClick={() => onDistress(true)}
          className="p-5 bg-white text-brand-rose rounded-[2rem] border border-brand-rose/10 flex flex-col items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-sm active:bg-brand-rose active:text-white transition-colors"
        >
          <i className="fa-solid fa-bell text-xl"></i>
          <span>Alert Emergency</span>
        </button>
        <button 
          className="p-5 bg-white text-brand-charcoal/40 rounded-[2rem] border border-brand-rose/5 flex flex-col items-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-sm"
        >
          <i className="fa-solid fa-location-arrow text-xl"></i>
          <span>Update Status</span>
        </button>
      </div>
      
      <p className="text-[10px] text-brand-charcoal/30 text-center italic tracking-wide uppercase font-black">
        "Walking beside you, every step of the way."
      </p>
    </div>
  );
};

export default LiveCompanion;
