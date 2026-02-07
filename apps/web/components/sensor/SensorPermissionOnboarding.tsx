'use client';

import React, { useState } from 'react';
import { Smartphone } from 'lucide-react';

interface SensorPermissionOnboardingProps {
  onComplete: (granted: boolean) => void;
  onSkip: () => void;
  requestPermission: () => Promise<boolean>;
}

/**
 * Onboarding screen that guides users to grant sensor permission
 * Displayed on first login or when permission needs to be requested
 */
export default function SensorPermissionOnboarding({
  onComplete,
  onSkip,
  requestPermission,
}: SensorPermissionOnboardingProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnableSensor = async () => {
    if (isRequesting) return;
    
    setIsRequesting(true);
    try {
      const granted = await requestPermission();
      onComplete(granted);
    } catch (error) {
      console.error('Error requesting sensor permission:', error);
      onComplete(false);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-rose-900/10 to-transparent pointer-events-none"></div>
      
      {/* Onboarding Card */}
      <div className="relative z-10 w-full max-w-sm mx-4 rounded-3xl bg-zinc-900/90 backdrop-blur-xl p-8 border border-zinc-800 shadow-[0_0_40px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-8 duration-500">
        {/* Decorative Glow Effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Content */}
        <div className="relative z-10">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/30 to-rose-500/30 rounded-full blur-xl"></div>
              <div className="relative bg-gradient-to-br from-amber-500/20 to-rose-500/20 p-4 rounded-full border border-amber-500/30">
                <Smartphone className="w-8 h-8 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-black tracking-tight text-stone-200 mb-3 text-center">
            Enable Device Sensor
          </h2>

          {/* Description */}
          <p className="text-sm text-zinc-400 font-medium text-center mb-8 leading-relaxed">
            To automatically detect when you put your phone down and enter Focus Mode, we need access to your device's motion sensor. This helps create a seamless focus experience with your friends.
          </p>

          {/* Enable Button */}
          <button
            onClick={handleEnableSensor}
            disabled={isRequesting}
            className="w-full bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl hover:from-amber-400 hover:to-rose-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-amber-500 disabled:hover:to-rose-500"
          >
            {isRequesting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Requesting...</span>
              </span>
            ) : (
              'Enable Sensor'
            )}
          </button>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            disabled={isRequesting}
            className="w-full mt-4 text-zinc-500 text-sm font-bold hover:text-zinc-300 uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed py-2"
          >
            Maybe Later
          </button>

          {/* Info Note */}
          <p className="text-xs text-zinc-600 text-center mt-6 leading-relaxed">
            You can change this setting anytime. Focus Mode will still work without sensor access, but you'll need to manually toggle the status.
          </p>
        </div>
      </div>
    </div>
  );
}

