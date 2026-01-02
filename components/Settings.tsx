
import React, { useState } from 'react';
import { EmergencyContact, CheckInSettings, User, VoiceSettings } from '../types';
import { GoogleGenAI, Modality } from "@google/genai";
import { decode, decodeAudioData } from '../services/geminiService';

interface SettingsProps {
  contacts: EmergencyContact[];
  onUpdateContacts: (contacts: EmergencyContact[]) => void;
  checkIn: CheckInSettings;
  onUpdateCheckIn: (settings: Partial<CheckInSettings>) => void;
  voiceSettings: VoiceSettings;
  onUpdateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  user: User | null;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  biometricEnabled: boolean;
  onToggleBiometric: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  contacts, 
  onUpdateContacts, 
  checkIn, 
  onUpdateCheckIn, 
  voiceSettings,
  onUpdateVoiceSettings,
  user, 
  onUpdateUser,
  onLogout,
  theme,
  onToggleTheme,
  biometricEnabled,
  onToggleBiometric
}) => {
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState<EmergencyContact>({ name: '', phone: '', relationship: '' });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const [samplingVoice, setSamplingVoice] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      onUpdateUser({
        ...user,
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone
      });
      setIsEditingProfile(false);
    }
  };

  const playVoiceSample = async (voice: VoiceSettings['voiceName']) => {
    if (samplingVoice) return;
    setSamplingVoice(voice);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Hello, I'm HerVoice AI. This is how I'll sound when I'm looking out for you.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (audioData) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const buffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = voiceSettings.speakingRate;
        source.connect(ctx.destination);
        source.start();
        source.onended = () => setSamplingVoice(null);
      } else {
        setSamplingVoice(null);
      }
    } catch (err) {
      console.error("Failed to play sample", err);
      setSamplingVoice(null);
    }
  };

  const toggleLink = (type: 'google' | 'contacts') => {
    if (!user) return;
    const updated = { ...user };
    if (type === 'google') updated.isGoogleLinked = !user.isGoogleLinked;
    if (type === 'contacts') updated.isContactsSynced = !user.isContactsSynced;
    onUpdateUser(updated);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone) return;

    let newContacts;
    if (editingIndex !== null) {
      newContacts = [...contacts];
      newContacts[editingIndex] = contactForm;
    } else {
      newContacts = [...contacts, contactForm];
    }

    onUpdateContacts(newContacts);
    setIsAddingContact(false);
    setEditingIndex(null);
  };

  const availableVoices: VoiceSettings['voiceName'][] = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

  return (
    <div className="p-6 pb-24 space-y-6 animate-in fade-in duration-300 dark:bg-slate-900">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h2>
          <p className="text-slate-500 text-sm">Personalize your safety vault.</p>
        </div>
        <button 
          onClick={onLogout}
          className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <i className="fa-solid fa-right-from-bracket"></i>
        </button>
      </header>

      <div className="space-y-6">
        {/* Profile Card */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden p-5 space-y-4 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 text-2xl font-bold border-2 border-white dark:border-slate-700 shadow-sm shrink-0">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg truncate">{user?.name}</h3>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              Edit
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={() => toggleLink('google')}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-bold transition-all ${
                user?.isGoogleLinked ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800 text-green-600 dark:text-green-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'
              }`}
            >
              <i className="fa-brands fa-google text-xs"></i>
              {user?.isGoogleLinked ? 'Google Linked' : 'Link Google'}
            </button>
            <button 
              onClick={() => toggleLink('contacts')}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-bold transition-all ${
                user?.isContactsSynced ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'
              }`}
            >
              <i className="fa-solid fa-address-book text-xs"></i>
              {user?.isContactsSynced ? 'Synced' : 'Sync Contacts'}
            </button>
          </div>
        </section>

        {/* Security / Biometrics */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
          <div className="p-5 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-fingerprint text-brand-rose"></i>
              Biometric Access
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Quick Unlock</span>
              <div 
                onClick={onToggleBiometric}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${biometricEnabled ? 'bg-brand-rose' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${biometricEnabled ? 'right-0.5' : 'left-0.5 shadow-sm'}`}></div>
              </div>
            </div>
          </div>
          <p className="px-5 pb-5 text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed">
            Use FaceID or Fingerprint for faster access to your secure vault and safety features.
          </p>
        </section>

        {/* Appearance */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
          <div className="p-5 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-palette text-purple-500"></i>
              Appearance
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Dark Mode</span>
              <div 
                onClick={onToggleTheme}
                className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${theme === 'dark' ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-700'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${theme === 'dark' ? 'right-0.5' : 'left-0.5 shadow-sm'}`}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Voice & Audio Settings */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
          <div className="p-5 border-b border-slate-50 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-volume-high text-brand-rose"></i>
              Voice & Audio
            </h3>
          </div>
          
          <div className="p-5 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Companion Voice</label>
              <div className="grid grid-cols-2 gap-2">
                {availableVoices.map(voice => (
                  <div key={voice} className="flex items-center gap-1.5">
                    <button
                      onClick={() => onUpdateVoiceSettings({ voiceName: voice })}
                      className={`flex-1 px-4 py-2 text-xs font-bold rounded-xl border transition-all text-left flex justify-between items-center ${
                        voiceSettings.voiceName === voice 
                          ? 'bg-brand-rose text-white border-brand-rose shadow-lg shadow-brand-rose/10' 
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      <span>{voice}</span>
                      {voiceSettings.voiceName === voice && <i className="fa-solid fa-check text-[10px]"></i>}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); playVoiceSample(voice); }}
                      disabled={samplingVoice !== null}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        samplingVoice === voice 
                          ? 'bg-brand-rose text-white animate-pulse' 
                          : 'bg-brand-beige dark:bg-slate-700 text-brand-rose'
                      }`}
                      title={`Listen to ${voice}`}
                    >
                      {samplingVoice === voice ? (
                        <i className="fa-solid fa-circle-notch animate-spin text-xs"></i>
                      ) : (
                        <i className="fa-solid fa-play text-xs"></i>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Speaking Rate</label>
                <span className="text-[10px] font-bold text-brand-rose bg-brand-rose/5 px-2 py-0.5 rounded-full">{voiceSettings.speakingRate.toFixed(1)}x</span>
              </div>
              <input 
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={voiceSettings.speakingRate}
                onChange={(e) => onUpdateVoiceSettings({ speakingRate: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full appearance-none accent-brand-rose cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter px-1">
                <span>Slow</span>
                <span>Normal</span>
                <span>Fast</span>
              </div>
            </div>
          </div>
          <p className="px-5 pb-5 text-[10px] text-slate-400 uppercase tracking-widest leading-relaxed">
            Click the play icon next to a voice to hear a sample before selecting your companion's voice.
          </p>
        </section>

        {/* Scheduled Safety */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
          <div className="p-5 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-clock text-orange-500"></i>
              Scheduled Safety
            </h3>
            <div 
              onClick={() => onUpdateCheckIn({ enabled: !checkIn.enabled, lastCheckInTime: new Date().toISOString() })}
              className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${checkIn.enabled ? 'bg-orange-500' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${checkIn.enabled ? 'right-0.5' : 'left-0.5 shadow-sm'}`}></div>
            </div>
          </div>
          
          {checkIn.enabled && (
            <div className="p-5 space-y-4 animate-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Check-in Interval</label>
                <div className="grid grid-cols-4 gap-2">
                  {[15, 30, 60, 120].map(mins => (
                    <button
                      key={mins}
                      onClick={() => onUpdateCheckIn({ intervalMinutes: mins })}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        checkIn.intervalMinutes === mins 
                          ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400' 
                          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      {mins >= 60 ? `${mins/60}h` : `${mins}m`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Emergency Contacts Section */}
        <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
          <div className="p-5 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-users text-purple-500"></i>
              Emergency Contacts
            </h3>
            <button 
              onClick={() => { setIsAddingContact(true); setEditingIndex(null); setContactForm({name:'', phone:'', relationship:''}); }}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
            >
              <i className="fa-solid fa-plus mr-1"></i> Add
            </button>
          </div>

          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {contacts.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <p className="text-xs">No contacts added yet.</p>
              </div>
            ) : (
              contacts.map((contact, index) => (
                <div key={index} className="p-4 flex justify-between items-center group">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{contact.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{contact.phone}</p>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                      {contact.relationship}
                    </span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingIndex(index); setContactForm(contacts[index]); setIsAddingContact(true); }}
                      className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-400 flex items-center justify-center hover:text-purple-600 dark:hover:text-purple-400"
                    >
                      <i className="fa-solid fa-pen text-xs"></i>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-20 duration-500">
            <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Edit Profile</h3>
                <button type="button" onClick={() => setIsEditingProfile(false)} className="text-slate-400">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
                  <input 
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl p-3 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl p-3 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone (Optional)</label>
                  <input 
                    type="tel"
                    value={profileForm.phone}
                    onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                    placeholder="+254..."
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl p-3 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsEditingProfile(false)}
                  className="py-3 px-4 bg-slate-100 dark:bg-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-bold text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="py-3 px-4 bg-purple-600 rounded-2xl text-white font-bold text-sm shadow-lg shadow-purple-200"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Contact Modal */}
      {isAddingContact && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-20 duration-500">
            <form onSubmit={handleSaveContact} className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {editingIndex !== null ? 'Edit Contact' : 'Add Contact'}
                </h3>
                <button type="button" onClick={() => setIsAddingContact(false)} className="text-slate-400">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Name</label>
                  <input 
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={e => setContactForm({...contactForm, name: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl p-3 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone</label>
                  <input 
                    type="tel"
                    required
                    value={contactForm.phone}
                    onChange={e => setContactForm({...contactForm, phone: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl p-3 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Relationship</label>
                  <select 
                    value={contactForm.relationship}
                    onChange={e => setContactForm({...contactForm, relationship: e.target.value})}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl p-3 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 outline-none"
                  >
                    <option value="Friend">Friend</option>
                    <option value="Mother">Mother</option>
                    <option value="Partner">Partner</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Guardian">Guardian</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAddingContact(false)}
                  className="py-3 px-4 bg-slate-100 dark:bg-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 font-bold text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="py-3 px-4 bg-purple-600 rounded-2xl text-white font-bold text-sm shadow-lg shadow-purple-200"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
