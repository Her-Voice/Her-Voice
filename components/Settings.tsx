
import React, { useState } from 'react';
import { EmergencyContact, CheckInSettings, User } from '../types';

interface SettingsProps {
  contacts: EmergencyContact[];
  onUpdateContacts: (contacts: EmergencyContact[]) => void;
  checkIn: CheckInSettings;
  onUpdateCheckIn: (settings: Partial<CheckInSettings>) => void;
  user: User | null;
  onUpdateUser: (user: User) => void;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  contacts, 
  onUpdateContacts, 
  checkIn, 
  onUpdateCheckIn, 
  user, 
  onUpdateUser,
  onLogout
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

  return (
    <div className="p-6 pb-24 space-y-6 animate-in fade-in duration-300">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
          <p className="text-slate-500 text-sm">Personalize your safety vault.</p>
        </div>
        <button 
          onClick={onLogout}
          className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <i className="fa-solid fa-right-from-bracket"></i>
        </button>
      </header>

      <div className="space-y-6">
        {/* Profile Card */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-600 text-2xl font-bold border-2 border-white shadow-sm shrink-0">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 text-lg truncate">{user?.name}</h3>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <button 
              onClick={() => setIsEditingProfile(true)}
              className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Edit
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={() => toggleLink('google')}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-bold transition-all ${
                user?.isGoogleLinked ? 'bg-green-50 border-green-100 text-green-600' : 'bg-white border-slate-100 text-slate-500'
              }`}
            >
              <i className="fa-brands fa-google text-xs"></i>
              {user?.isGoogleLinked ? 'Google Linked' : 'Link Google'}
            </button>
            <button 
              onClick={() => toggleLink('contacts')}
              className={`flex items-center justify-center gap-2 py-3 rounded-2xl border text-xs font-bold transition-all ${
                user?.isContactsSynced ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-white border-slate-100 text-slate-500'
              }`}
            >
              <i className="fa-solid fa-address-book text-xs"></i>
              {user?.isContactsSynced ? 'Synced' : 'Sync Contacts'}
            </button>
          </div>
        </section>

        {/* Scheduled Safety */}
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-clock text-orange-500"></i>
              Scheduled Safety
            </h3>
            <div 
              onClick={() => onUpdateCheckIn({ enabled: !checkIn.enabled, lastCheckInTime: new Date().toISOString() })}
              className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${checkIn.enabled ? 'bg-orange-500' : 'bg-slate-200'}`}
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
                          ? 'bg-orange-50 border-orange-200 text-orange-600' 
                          : 'bg-white border-slate-100 text-slate-500'
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
        <section className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-users text-purple-500"></i>
              Emergency Contacts
            </h3>
            <button 
              onClick={() => { setIsAddingContact(true); setEditingIndex(null); setContactForm({name:'', phone:'', relationship:''}); }}
              className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors"
            >
              <i className="fa-solid fa-plus mr-1"></i> Add
            </button>
          </div>

          <div className="divide-y divide-slate-50">
            {contacts.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <p className="text-xs">No contacts added yet.</p>
              </div>
            ) : (
              contacts.map((contact, index) => (
                <div key={index} className="p-4 flex justify-between items-center group">
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-800 text-sm">{contact.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{contact.phone}</p>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                      {contact.relationship}
                    </span>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => { setEditingIndex(index); setContactForm(contacts[index]); setIsAddingContact(true); }}
                      className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:text-purple-600"
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
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-20 duration-500">
            <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Edit Profile</h3>
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
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={profileForm.email}
                    onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone (Optional)</label>
                  <input 
                    type="tel"
                    value={profileForm.phone}
                    onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                    placeholder="+254..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsEditingProfile(false)}
                  className="py-3 px-4 bg-slate-100 rounded-2xl text-slate-600 font-bold text-sm"
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
          <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-20 duration-500">
            <form onSubmit={handleSaveContact} className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">
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
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone</label>
                  <input 
                    type="tel"
                    required
                    value={contactForm.phone}
                    onChange={e => setContactForm({...contactForm, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Relationship</label>
                  <select 
                    value={contactForm.relationship}
                    onChange={e => setContactForm({...contactForm, relationship: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 text-sm focus:ring-2 focus:ring-purple-200 outline-none"
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
                  className="py-3 px-4 bg-slate-100 rounded-2xl text-slate-600 font-bold text-sm"
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
