import React, { useState } from 'react';
import { X, Smartphone, Mail, Globe, Bell, Shield, LogOut, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';

interface SettingsProps {
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [passiveTracking, setPassiveTracking] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="flex flex-col h-full bg-zinc-950 overflow-y-auto animate-in slide-in-from-right duration-300 relative z-50">
      
      {/* Header */}
      <div className="p-6 flex justify-between items-center sticky top-0 bg-zinc-950/90 backdrop-blur-md z-30 border-b border-zinc-900">
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors border border-zinc-800">
          <X className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      <div className="p-6 space-y-8 pb-24">
        
        {/* Account Connections */}
        <section>
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 pl-2">Connected Accounts</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:bg-zinc-900 transition-colors active:scale-[0.99]">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">Google</div>
                    <div className="text-xs text-zinc-500">Connected as alex@gmail.com</div>
                  </div>
               </div>
               <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">Linked</span>
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:bg-zinc-900 transition-colors active:scale-[0.99]">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                    <svg className="w-5 h-5 text-black fill-current" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-1.16 4.12-.74 2.39.29 4.2 2.12 4.2 2.12-.03.04-2.82 1.35-2.92 4.67-.09 3.03 2.65 4.35 2.69 4.37-.02.05-.44 1.52-1.17 2.81zm-3.6-17.7c.91-1.11 1.63-2.58 1.34-4.18-1.44.13-2.98.98-3.86 2.02-.85.99-1.57 2.53-1.28 4.09 1.58.11 2.94-.8 3.8-1.93z"/></svg>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">Apple</div>
                    <div className="text-xs text-zinc-500">Not connected</div>
                  </div>
               </div>
               <ChevronRight className="w-5 h-5 text-zinc-700" />
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:bg-zinc-900 transition-colors active:scale-[0.99]">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center">
                     <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">Facebook</div>
                    <div className="text-xs text-zinc-500">Not connected</div>
                  </div>
               </div>
               <ChevronRight className="w-5 h-5 text-zinc-700" />
            </button>
          </div>
        </section>

        {/* Sync Preferences */}
        <section>
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 pl-2">Privacy & Sync</h3>
          <div className="bg-zinc-900/50 rounded-3xl border border-zinc-800 overflow-hidden">
            
            {/* Passive Tracking Toggle */}
            <div className="p-5 flex items-center justify-between border-b border-zinc-800/50">
              <div className="flex items-start gap-4">
                 <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500 mt-1">
                   <Smartphone className="w-5 h-5" />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-white">Passive Time Counting</h4>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed max-w-[200px]">
                      Automatically log focus time when your phone is near friends.
                    </p>
                 </div>
              </div>
              <button onClick={() => setPassiveTracking(!passiveTracking)} className="transition-colors">
                {passiveTracking ? (
                  <ToggleRight className="w-10 h-10 text-emerald-400 fill-emerald-400/20" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-zinc-600" />
                )}
              </button>
            </div>

            <div className="p-5 flex items-center justify-between">
              <div className="flex items-start gap-4">
                 <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 mt-1">
                   <Bell className="w-5 h-5" />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-white">Notifications</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      Get alerted when friends start a campfire nearby.
                    </p>
                 </div>
              </div>
               <button onClick={() => setNotifications(!notifications)} className="transition-colors">
                {notifications ? (
                  <ToggleRight className="w-10 h-10 text-emerald-400 fill-emerald-400/20" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-zinc-600" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Account Actions */}
        <section>
           <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 pl-2">Account</h3>
           <div className="space-y-3">
              <button className="w-full p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-left hover:bg-zinc-900 transition-colors flex items-center justify-between">
                 <span className="text-sm font-bold text-zinc-300">Data & Privacy</span>
                 <Shield className="w-4 h-4 text-zinc-500" />
              </button>
              
              <button className="w-full p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-left hover:bg-zinc-900 transition-colors flex items-center justify-between group">
                 <span className="text-sm font-bold text-rose-400 group-hover:text-rose-300">Log Out</span>
                 <LogOut className="w-4 h-4 text-rose-500/70" />
              </button>
              
              <div className="pt-4 text-center">
                 <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">Version 2.4.0 (Build 302)</p>
              </div>
           </div>
        </section>

      </div>
    </div>
  );
};

export default Settings;