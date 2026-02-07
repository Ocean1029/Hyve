'use client';

import { useState } from 'react';
import { testLoginAsAlex } from './test-login';

export default function TestLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleTestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await testLoginAsAlex();
      if (result.success) {
        // Force a hard refresh to ensure session is recognized
        window.location.href = '/';
      } else {
        alert(result.error || 'Failed to login');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Test login error:', error);
      alert('Failed to login as Alex');
      setIsLoading(false);
    }
  };

  return (
    <div suppressHydrationWarning>
      <form onSubmit={handleTestLogin}>
        <button
          type="submit"
          disabled={isLoading}
          className="text-xs text-zinc-400 hover:text-stone-200 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:ring-offset-2 focus:ring-offset-zinc-950 font-medium backdrop-blur-sm"
          title="Test Login as Alex"
        >
          {isLoading ? '...' : 'Test'}
        </button>
      </form>
    </div>
  );
}

