
import React, { useState, useRef, useEffect } from 'react';
import { getGeminiResponse } from '../services/geminiService';
import { AppView } from '../types';

interface WellbeingChatProps {
  setView: (view: AppView) => void;
  isOnline: boolean;
}

const WellbeingChat: React.FC<WellbeingChatProps> = ({ setView, isOnline }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: "Hello. I'm your digital companion. How has your heart been feeling today?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || !isOnline) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await getGeminiResponse(userMsg);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting, but I'm still here for you. Take a gentle breath." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-brand-beige/20 relative">
      <header className="p-4 border-b border-brand-rose/10 flex items-center justify-between glass sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-beige flex items-center justify-center text-brand-rose shadow-sm">
            <i className="fa-solid fa-heart"></i>
          </div>
          <div>
            <h2 className="font-serif text-brand-charcoal text-lg">Companion</h2>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 ${isOnline ? 'bg-emerald-500' : 'bg-slate-300'} rounded-full`}></span>
              <span className="text-[10px] font-black text-brand-charcoal/30 uppercase tracking-widest">{isOnline ? 'Always Listening' : 'Waiting for Signal'}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setView(AppView.GROUNDING)}
          className="px-4 py-1.5 bg-brand-rose text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand-rose/10 flex items-center gap-2"
        >
          <i className="fa-solid fa-wind"></i>
          <span>Calm</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-28">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-5 rounded-3xl shadow-sm text-sm leading-relaxed ${
              m.role === 'user' 
                ? 'bg-brand-rose text-white rounded-br-none' 
                : 'bg-white text-brand-charcoal rounded-bl-none border border-brand-rose/5'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-5 rounded-3xl rounded-bl-none border border-brand-rose/5 shadow-sm">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-brand-rose/40 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-brand-rose/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-brand-rose/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef}></div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-md border-t border-brand-rose/10">
        {!isOnline && (
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-20">
             <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-brand-beige flex items-center gap-2">
                <i className="fa-solid fa-cloud-slash text-brand-rose/40"></i>
                <span className="text-[10px] font-black text-brand-rose uppercase tracking-widest">Connect to reflect together</span>
             </div>
          </div>
        )}
        <div className="flex gap-3 items-center bg-white border border-brand-rose/20 rounded-2xl px-5 py-2 shadow-inner focus-within:border-brand-rose transition-colors">
          <input
            disabled={!isOnline}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isOnline ? "Reflect with your companion..." : "Offline - Messages will sync later"}
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 text-brand-charcoal placeholder:text-brand-charcoal/30"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || !isOnline}
            className="text-brand-rose disabled:opacity-30 p-2 hover:scale-110 transition-transform"
          >
            <i className="fa-solid fa-paper-plane text-lg"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WellbeingChat;
