'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Smartphone, Mail, Globe, Bell, Shield, LogOut, ChevronRight, User, Edit2, Check, X as XIcon } from 'lucide-react';
import { updateUserProfile } from '@/modules/users/actions';

interface SettingsProps {
  user?: {
    id: string;
    userId?: string;
    name?: string | null;
    email?: string | null;
  };
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onClose }) => {
  const router = useRouter();
  const [passiveTracking, setPassiveTracking] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [isEditingUserId, setIsEditingUserId] = useState(false);
  const [userIdValue, setUserIdValue] = useState(user?.userId || user?.id || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState(false);

  // Update userIdValue and nameValue when user changes
  useEffect(() => {
    if (user) {
      setUserIdValue(user.userId || user.id || '');
      setNameValue(user.name || '');
    }
  }, [user]);

  const handleSaveUserId = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateUserProfile(user.id, { userId: userIdValue.trim() });
      
      if (result.success) {
        setSuccess(true);
        setIsEditingUserId(false);
        setTimeout(() => setSuccess(false), 2000);
        // Refresh the page to show updated userId
        router.refresh();
      } else {
        setError(result.error || 'Failed to update userId');
      }
    } catch (err) {
      setError('An error occurred while updating userId');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveName = async () => {
    if (!user?.id) return;
    
    setIsSavingName(true);
    setNameError(null);
    setNameSuccess(false);

    try {
      const result = await updateUserProfile(user.id, { name: nameValue.trim() });
      
      if (result.success) {
        setNameSuccess(true);
        setIsEditingName(false);
        setTimeout(() => setNameSuccess(false), 2000);
        // Refresh the page to show updated name
        router.refresh();
      } else {
        setNameError(result.error || 'Failed to update name');
      }
    } catch (err) {
      setNameError('An error occurred while updating name');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setUserIdValue(user?.userId || user?.id || '');
    setIsEditingUserId(false);
    setError(null);
    setSuccess(false);
  };

  const handleCancelEditName = () => {
    setNameValue(user?.name || '');
    setIsEditingName(false);
    setNameError(null);
    setNameSuccess(false);
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 overflow-y-auto">
      
      {/* Header */}
      <div className="p-6 flex justify-between items-center sticky top-0 bg-zinc-950/90 backdrop-blur-md z-30 border-b border-zinc-900">
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <button onClick={onClose} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors border border-zinc-800">
          <X className="w-5 h-5 text-zinc-400" />
        </button>
      </div>

      <div className="p-6 space-y-8 pb-40">
        
        {/* Account Connections */}
        <section>
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 pl-2">Connected Accounts</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:bg-zinc-900 transition-colors active:scale-[0.99]">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">Google</div>
                    <div className="text-xs text-zinc-500">Connected as alex@gmail.com</div>
                  </div>
               </div>
               <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">Linked</span>
            </button>
          </div>
        </section>

        {/* Profile Section */}
        <section>
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 pl-2">Profile</h3>
          
          {/* User Name */}
          <div className="bg-zinc-900/50 rounded-3xl border border-zinc-800 overflow-hidden mb-3">
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 mt-1">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white mb-1">User Name</h4>
                  <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                    Your display name shown to other users.
                  </p>
                  
                  {isEditingName ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={nameValue}
                        onChange={(e) => {
                          setNameValue(e.target.value);
                          setNameError(null);
                        }}
                        maxLength={50}
                        className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-blue-500 text-sm"
                        placeholder="Enter your name"
                        disabled={isSavingName}
                      />
                      {nameError && (
                        <p className="text-xs text-rose-400">{nameError}</p>
                      )}
                      {nameSuccess && (
                        <p className="text-xs text-emerald-400">Name updated successfully!</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveName}
                          disabled={isSavingName || nameValue.trim() === (user?.name || '')}
                          className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isSavingName ? (
                            <>Saving...</>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Save
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleCancelEditName}
                          disabled={isSavingName}
                          className="px-3 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-stone-200 bg-zinc-800/50 px-3 py-2 rounded-lg border border-zinc-700">
                          {user?.name || 'No name set'}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="ml-3 p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User ID */}
          <div className="bg-zinc-900/50 rounded-3xl border border-zinc-800 overflow-hidden">
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500 mt-1">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white mb-1">User ID</h4>
                  <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                    Your custom user ID. Can be used to search for you. Only letters, numbers, and underscores allowed (max 30 characters).
                  </p>
                  
                  {isEditingUserId ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={userIdValue}
                        onChange={(e) => {
                          setUserIdValue(e.target.value);
                          setError(null);
                        }}
                        maxLength={30}
                        className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg border border-zinc-700 focus:outline-none focus:border-purple-500 text-sm font-mono"
                        placeholder="Enter user ID"
                        disabled={isSaving}
                      />
                      {error && (
                        <p className="text-xs text-rose-400">{error}</p>
                      )}
                      {success && (
                        <p className="text-xs text-emerald-400">User ID updated successfully!</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveUserId}
                          disabled={isSaving || userIdValue.trim() === (user?.userId || user?.id || '')}
                          className="flex-1 px-3 py-2 bg-purple-500 text-white rounded-lg text-sm font-bold hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isSaving ? (
                            <>Saving...</>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Save
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="px-3 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-sm font-bold hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-mono text-stone-200 bg-zinc-800/50 px-3 py-2 rounded-lg border border-zinc-700">
                          {user?.userId || user?.id || 'N/A'}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsEditingUserId(true)}
                        className="ml-3 p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
              <button 
                onClick={() => setPassiveTracking(!passiveTracking)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ease-in-out focus:outline-none  ${
                  passiveTracking ? 'bg-emerald-500/90' : 'bg-zinc-800'
                }`}
                role="switch"
                aria-checked={passiveTracking}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out ${
                    passiveTracking ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="p-5 flex items-center justify-between">
              <div className="flex items-start gap-4">
                 <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 mt-1">
                   <Bell className="w-5 h-5" />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-white">Notifications</h4>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed max-w-[200px]">
                      Get alerted when friends start a hyve nearby.
                    </p>
                 </div>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 ease-in-out focus:outline-none  ${
                  notifications ? 'bg-emerald-500/90' : 'bg-zinc-800'
                }`}
                role="switch"
                aria-checked={notifications}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-all duration-200 ease-in-out ${
                    notifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
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