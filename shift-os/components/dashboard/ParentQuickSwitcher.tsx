'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export interface ParentQuickSwitchOption {
  href: string;
  label: string;
  sublabel: string;
}

interface ParentQuickSwitcherProps {
  label: string;
  options: ParentQuickSwitchOption[];
}

export default function ParentQuickSwitcher({ label, options }: ParentQuickSwitcherProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  if (options.length === 0) return null;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-full border bg-white/[0.06] px-3 py-1.5 text-sm text-white transition-all duration-300 ease-out hover:bg-white/[0.09]"
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
      >
        <span className="max-w-[150px] truncate">{label}</span>
        <span className="text-xs text-white/45">v</span>
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-60 overflow-hidden rounded-xl border bg-[#0d1117] shadow-xl" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {options.map((option) => (
            <Link
              key={option.href}
              href={option.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-white transition-colors duration-300 ease-out hover:bg-white/[0.04]"
            >
              <span className="block font-semibold">{option.label}</span>
              <span className="mt-0.5 block text-xs text-white/35">{option.sublabel}</span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
