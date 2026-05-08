'use client';

import { useState } from 'react';

interface ParentAvailabilityToggleProps {
  primaryColour: string;
  playerName: string;
  label: string;
}

export default function ParentAvailabilityToggle({ primaryColour, playerName, label }: ParentAvailabilityToggleProps) {
  const [available, setAvailable] = useState<boolean | null>(null);

  return (
    <div className="rounded-[10px] border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-white">{playerName}</p>
          <p className="mt-1 text-sm text-white/30">{label}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            ['Available', true],
            ['Unavailable', false]
          ].map(([text, value]) => {
            const isActive = available === value;
            return (
              <button
                key={text as string}
                type="button"
                onClick={() => setAvailable(value as boolean)}
                className="rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300 ease-out"
                style={
                  isActive
                    ? { backgroundColor: primaryColour, borderColor: primaryColour, color: '#ffffff' }
                    : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }
                }
              >
                {text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
