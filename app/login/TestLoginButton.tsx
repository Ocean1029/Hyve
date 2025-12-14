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
    <div className="mt-4" suppressHydrationWarning>
      <form onSubmit={handleTestLogin}>
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="h-5 w-5" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {isLoading ? 'Logging in...' : 'Test Login as Alex'}
        </button>
      </form>
    </div>
  );
}
