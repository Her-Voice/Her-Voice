
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { encode, decode, decodeAudioData } from '../services/geminiService';

const API_KEY = process.env.API_KEY || "";

const LiveCompanion: React.FC<{ onDistress: (status: boolean) => void }> = ({ onDistress }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState("Tap to start companion session");
  const [transcription, setTranscription] = useState("");
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startSession = async () => {
    try {
      setStatus("Initializing AI...");
      setIsActive(true);
      
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus("I'm listening. Speak freely.");
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
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Audio output logic
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

            // Handle metadata if any (distress signals, etc.)
            // Note: In real app, we would use tool calls or hidden text responses
          },
          onerror: (e) => console.error("Session Error:", e),
          onclose: () => {
            setIsActive(false);
            setStatus("Session ended.");
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: "You are HerVoice AI. Guide the user if they sound distressed. Offer breathing exercises if panicking. Use a calm, reassuring voice."
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus("Error starting session.");
      setIsActive(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    setIsActive(false);
    setStatus("Session stopped.");
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 h-full space-y-12 animate-in slide-in-from-bottom-10">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-800">Safety Companion</h2>
        <p className="text-slate-500 max-w-xs">{status}</p>
      </div>

      <div className="relative flex items-center justify-center h-64 w-64">
        {/* Decorative Rings */}
        <div className={`absolute inset-0 rounded-full border-2 border-purple-100 transition-transform duration-1000 ${isActive ? 'scale-110 opacity-100' : 'scale-75 opacity-0'}`}></div>
        <div className={`absolute inset-4 rounded-full border-2 border-purple-200 transition-transform duration-700 delay-75 ${isActive ? 'scale-110 opacity-80' : 'scale-75 opacity-0'}`}></div>
        
        {/* Main Button */}
        <button
          onClick={isActive ? stopSession : startSession}
          className={`relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl active:scale-95 ${
            isActive ? 'bg-white text-red-500 border-4 border-red-500' : 'bg-purple-600 text-white'
          }`}
        >
          <i className={`fa-solid ${isActive ? 'fa-stop text-4xl' : 'fa-microphone text-5xl'} mb-4`}></i>
          <span className="text-sm font-bold uppercase tracking-widest">
            {isActive ? 'Stop' : 'Connect'}
          </span>
        </button>

        {isActive && (
          <div className="absolute -bottom-8 waveform">
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className="waveform-bar" 
                style={{ animationDelay: `${i * 0.1}s`, height: `${Math.random() * 20 + 10}px` }}
              ></div>
            ))}
          </div>
        )}
      </div>

      <div className="w-full max-w-sm grid grid-cols-2 gap-4">
        <button 
          onClick={() => onDistress(true)}
          className="p-4 bg-red-100 text-red-600 rounded-2xl flex flex-col items-center gap-2 font-bold shadow-sm"
        >
          <i className="fa-solid fa-bell"></i>
          <span>PANIC</span>
        </button>
        <button 
          className="p-4 bg-blue-100 text-blue-600 rounded-2xl flex flex-col items-center gap-2 font-bold shadow-sm"
        >
          <i className="fa-solid fa-map-pin"></i>
          <span>LOCATION</span>
        </button>
      </div>
      
      <p className="text-xs text-slate-400 text-center italic">
        "I'm right here with you, walking every step of the way."
      </p>
    </div>
  );
};

export default LiveCompanion;
