'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signOut } from '@/lib/auth/signOut';

interface SignOutButtonProps {
  compact?: boolean;
}

export default function SignOutButton({ compact = false }: SignOutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignOut() {
    setLoading(true);
    setError('');
    const result = await signOut();
    setLoading(false);
    if (result.errorMessage) {
      setError(result.errorMessage);
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={loading}
        className={`${compact ? 'w-auto px-4 py-2 text-sm' : 'w-full px-6 py-3 text-base'} rounded-full border font-semibold transition-all duration-300 ease-out disabled:opacity-60`}
        style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}
        onMouseEnter={(event) => {
          event.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.2)';
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)';
        }}
      >
        {loading ? 'Signing out...' : 'Sign Out ->'}
      </button>
      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
