
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockUser: User = {
        id: 'u1',
        name: mode === 'signup' ? formData.name : 'Jane Doe',
        email: formData.email || 'jane@example.com',
        isGoogleLinked: false,
        isContactsSynced: false
      };
      onLogin(mockUser);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col p-8 justify-center animate-in fade-in duration-500">
      <div className="flex flex-col items-center mb-12">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-3xl shadow-xl shadow-purple-200 mb-6">
          <i className="fa-solid fa-v"></i>
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">HerVoice</h1>
        <p className="text-slate-500 font-medium">Your safety companion</p>
      </div>

      <div className="bg-slate-50 p-1.5 rounded-2xl flex mb-8">
        <button 
          onClick={() => setMode('login')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'login' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}
        >
          Login
        </button>
        <button 
          onClick={() => setMode('signup')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'signup' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Full Name</label>
            <div className="relative">
              <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
              <input 
                required
                type="text"
                placeholder="Jane Doe"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-purple-100 transition-all"
              />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Email Address</label>
          <div className="relative">
            <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input 
              required
              type="email"
              placeholder="jane@example.com"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Password</label>
          <div className="relative">
            <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
            <input 
              required
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-purple-100 transition-all"
            />
          </div>
        </div>

        {mode === 'login' && (
          <div className="text-right">
            <button type="button" className="text-xs font-bold text-purple-600">Forgot Password?</button>
          </div>
        )}

        <button 
          disabled={loading}
          type="submit"
          className="w-full py-5 bg-purple-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-purple-100 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? (
            <i className="fa-solid fa-circle-notch animate-spin"></i>
          ) : (
            mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'
          )}
        </button>
      </form>

      <div className="mt-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 text-slate-300">
          <div className="h-px bg-slate-100 flex-1"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Or connect with</span>
          <div className="h-px bg-slate-100 flex-1"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-3 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 shadow-sm active:scale-95 transition-all">
            <i className="fa-brands fa-google text-red-500"></i>
            Google
          </button>
          <button className="flex items-center justify-center gap-3 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-600 shadow-sm active:scale-95 transition-all">
            <i className="fa-brands fa-apple text-slate-800"></i>
            Apple
          </button>
        </div>
      </div>

      <p className="mt-12 text-center text-xs text-slate-400 leading-relaxed px-8">
        By continuing, you agree to HerVoice's <span className="text-slate-600 font-bold underline">Terms of Service</span> and <span className="text-slate-600 font-bold underline">Privacy Policy</span>.
      </p>
    </div>
  );
};

export default Auth;
