interface PotmCardPreviewProps {
  playerName: string;
  teamName: string;
  opponent: string;
  message: string;
  primaryColour: string;
  badgeUrl?: string | null;
  clubName?: string | null;
}

function darkenHex(hexColour: string, percent: number): string {
  const hex = hexColour.replace('#', '');
  const value = parseInt(hex.length === 6 ? hex : '00c851', 16);
  const amount = Math.round((255 * percent) / 100);
  const red = Math.max(0, (value >> 16) - amount);
  const green = Math.max(0, ((value >> 8) & 0xff) - amount);
  const blue = Math.max(0, (value & 0xff) - amount);
  return `#${((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1)}`;
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'SO';
}

export default function PotmCardPreview({ playerName, teamName, opponent, message, primaryColour, badgeUrl, clubName }: PotmCardPreviewProps) {
  const darkColour = darkenHex(primaryColour, 36);
  const displayMessage = message.trim() || 'Outstanding performance today - you were brilliant from start to finish!';
  const displayClub = clubName ?? teamName;

  return (
    <article
      className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
      style={{ background: `linear-gradient(135deg, ${primaryColour} 0%, ${darkColour} 100%)` }}
    >
      <div className="grid min-h-[260px] grid-cols-[0.42fr_0.58fr]">
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-white/80 bg-black/15 text-xl font-black text-white">
            {badgeUrl ? <img src={badgeUrl} alt="" className="h-full w-full object-cover" /> : initials(displayClub)}
          </div>
          <p className="mt-4 text-sm font-bold text-white">{displayClub}</p>
        </div>
        <div className="flex flex-col justify-center py-6 pr-6">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/65">Player of the Match</p>
          <h3 className="mt-3 text-3xl font-black leading-tight text-white">{playerName}</h3>
          <p className="mt-2 text-sm text-white/75">{teamName} vs {opponent}</p>
          <div className="my-4 h-px bg-white/20" />
          <p className="text-sm italic leading-relaxed text-white/85">&ldquo;{displayMessage}&rdquo;</p>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 text-xs text-white/45">
        <span>{displayClub}</span>
        <span>Powered by SHIFT OS</span>
      </div>
    </article>
  );
}
