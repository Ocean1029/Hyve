'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Settings from './Settings';
import BottomNav from './BottomNav';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

interface SettingsClientProps {
  user: {
    id: string;
    userId?: string;
    name?: string | null;
    email?: string | null;
    privacy?: string | null;
  };
}

const SettingsClient: React.FC<SettingsClientProps> = ({ user }) => {
  const router = useRouter();
  
  // Enable swipe navigation for settings page
  useSwipeNavigation({ 
    currentPath: '/settings', 
    enabled: true 
  });

  const handleClose = () => {
    router.push('/profile');
  };

  return (
    <div className="w-full h-dvh bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-[414px] bg-zinc-950 relative overflow-hidden shadow-2xl border-x border-zinc-900/50">
        <Settings user={user} onClose={handleClose} />
        <BottomNav />
      </div>
    </div>
  );
};

export default SettingsClient;

