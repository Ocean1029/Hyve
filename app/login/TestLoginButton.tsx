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
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:text-gray-600"
          title="Test Login as Alex"
        >
          {isLoading ? '...' : 'Test'}
        </button>
      </form>
    </div>
  );
}
