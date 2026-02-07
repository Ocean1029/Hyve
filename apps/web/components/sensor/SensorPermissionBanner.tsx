'use client';

import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface SensorPermissionBannerProps {
  onRequestPermission: () => Promise<boolean>;
  onDismiss: () => void;
}

/**
 * Banner that appears at the top of dashboard when sensor permission is denied
 * Provides a way for users to re-request permission
 */
export default function SensorPermissionBanner({
  onRequestPermission,
  onDismiss,
}: SensorPermissionBannerProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleEnable = async () => {
    if (isRequesting) return;
    
    setIsRequesting(true);
    try {
      const granted = await onRequestPermission();
      
      // If granted, banner will be automatically hidden by provider
      // If denied, show a hint about system settings
      if (!granted) {
        // Could show additional UI here to guide users to system settings
        console.log('Permission denied. User may need to enable in system settings.');
      }
    } catch (error) {
      console.error('Error requesting sensor permission:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20 backdrop-blur-sm animate-in slide-in-from-top duration-500">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Icon and Message */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-200">
                Sensor not enabled
              </p>
              <p className="text-xs text-amber-300/70 mt-0.5">
                Focus Mode requires manual control without sensor access
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Enable Button */}
            <button
              onClick={handleEnable}
              disabled={isRequesting}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-bold rounded-xl border border-amber-500/30 hover:border-amber-500/50 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isRequesting ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Requesting</span>
                </span>
              ) : (
                'Enable'
              )}
            </button>

            {/* Dismiss Button */}
            <button
              onClick={onDismiss}
              disabled={isRequesting}
              className="p-2 hover:bg-amber-500/10 text-amber-300/70 hover:text-amber-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

