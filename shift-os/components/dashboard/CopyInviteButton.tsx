'use client';

import { useState } from 'react';

interface CopyInviteButtonProps {
  inviteUrl: string;
  label?: string;
}

export default function CopyInviteButton({ inviteUrl, label = 'Copy Link' }: CopyInviteButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="mt-4 rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 ease-out hover:bg-white/[0.06]"
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}
