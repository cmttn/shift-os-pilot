'use client';

import { useRouter } from 'next/navigation';
import { type CSSProperties, type ReactNode, useTransition } from 'react';

interface ParentAvailabilityButtonProps {
  playerId: string;
  sessionId: string;
  status: 'available' | 'unavailable';
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
}

export default function ParentAvailabilityButton({
  playerId,
  sessionId,
  status,
  children,
  className,
  style,
  disabled = false
}: ParentAvailabilityButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function updateAvailability() {
    if (disabled || isPending) return;

    const response = await fetch('/api/update-availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, playerId, status })
    });

    if (response.ok) {
      startTransition(() => {
        router.refresh();
      });
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || isPending}
      onClick={updateAvailability}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}
