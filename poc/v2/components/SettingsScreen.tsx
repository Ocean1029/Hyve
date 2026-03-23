import React from 'react';
import { X, User, Shield, Bell, Moon, Sun, ChevronRight, LogOut, CreditCard, Palette } from 'lucide-react';
import { GlassCard } from './UI';

interface SettingsScreenProps {
  onClose: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose, theme, onToggleTheme }) => {
  const settingsGroups = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Profile Information', value: 'Alex H.' },
        { icon: CreditCard, label: 'Subscription', value: 'Pro Plan' },
        { icon: Shield, label: 'Privacy & Security', value: '' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', value: 'All' },
        { icon: Palette, label: 'Personalization', value: '' },
      ]
    }
  ];

  return (
    <div className="absolute inset-0 z-[300] bg-hyve-bg0 animate-flip-in origin-top">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-hyve-surfaceBorder">
        <h2 className="text-lg font-black text-hyve-text1 uppercase tracking-tighter">Settings</h2>
        <button onClick={onClose} className="text-hyve-text1 active:scale-90 transition-transform">
          <X size={24} strokeWidth={1.5} />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto h-[calc(100%-64px)] no-scrollbar">
        {/* Theme Toggle Section */}
        <div className="mb-8">
          <h3 className="text-[10px] font-black text-hyve-text3 uppercase tracking-widest mb-4">Appearance</h3>
          <GlassCard className="!p-4" noPadding>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-amber-500/20 text-amber-600'}`}>
                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-hyve-text1">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</p>
                  <p className="text-[10px] text-hyve-text3">Switch to {theme === 'dark' ? 'day' : 'night'} mode</p>
                </div>
              </div>
              <button 
                onClick={onToggleTheme}
                className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${theme === 'dark' ? 'bg-indigo-600' : 'bg-amber-500'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${theme === 'dark' ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Settings Groups */}
        {settingsGroups.map((group, idx) => (
          <div key={idx} className="mb-8">
            <h3 className="text-[10px] font-black text-hyve-text3 uppercase tracking-widest mb-4">{group.title}</h3>
            <div className="flex flex-col gap-2">
              {group.items.map((item, i) => (
                <GlassCard key={i} className="!p-4" noPadding>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-hyve-surface1 flex items-center justify-center text-hyve-text2">
                        <item.icon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-hyve-text1">{item.label}</p>
                        {item.value && <p className="text-[10px] text-hyve-text3">{item.value}</p>}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-hyve-text3" />
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <button className="w-full py-4 flex items-center justify-center gap-2 text-red-500 font-bold text-sm mt-4 active:scale-95 transition-transform">
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};
