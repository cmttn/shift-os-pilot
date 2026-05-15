interface PotmCardPreviewProps {
  playerName: string;
  teamName: string;
  opponent: string;
  message: string;
  primaryColour: string;
  secondaryColour?: string | null;
  badgeUrl?: string | null;
  clubName?: string | null;
}

function darkenHex(hexColour: string, percent: number): string {
  const hex = hexColour.replace('#', '');
  const value = parseInt(hex.length === 6 ? hex : 'fff200', 16);
  const amount = Math.round((255 * percent) / 100);
  const red = Math.max(0, (value >> 16) - amount);
  const green = Math.max(0, ((value >> 8) & 0xff) - amount);
  const blue = Math.max(0, (value & 0xff) - amount);
  return `#${((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1)}`;
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'SO';
}

export default function PotmCardPreview({ playerName, teamName, opponent, message, primaryColour, secondaryColour, badgeUrl, clubName }: PotmCardPreviewProps) {
  const secondary = secondaryColour ?? darkenHex(primaryColour, 46);
  const deep = '#08090d';
  const displayMessage = message.trim() || 'Outstanding effort today - keep it up.';
  const displayClub = clubName ?? teamName;

  return (
    <article className="relative aspect-square w-full overflow-hidden rounded-[28px] border border-white/10 shadow-2xl" style={{ backgroundColor: deep }}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primaryColour} 0%, ${secondary} 48%, ${deep} 100%)` }} />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl" style={{ backgroundColor: `${primaryColour}66` }} />
      <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full blur-3xl" style={{ backgroundColor: `${secondary}80` }} />
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(0,0,0,0.08),rgba(0,0,0,0.72))]" />
      <div className="absolute inset-x-0 top-12 rotate-[-12deg] text-center text-[64px] font-black tracking-[0.28em] text-white/[0.045]">POTM POTM POTM</div>
      <div className="absolute inset-y-0 right-10 w-24 rotate-[18deg] bg-white/[0.07]" />

      <div className="relative flex h-full flex-col p-7 sm:p-9">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.34em] text-white/70">Player of the Match</p>
            <p className="mt-2 inline-flex rounded-full border border-white/15 bg-black/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">Awarded by parents</p>
          </div>
          <div className="flex h-24 w-24 shrink-0 items-center justify-center drop-shadow-[0_18px_32px_rgba(0,0,0,0.45)] sm:h-28 sm:w-28">
            {badgeUrl ? (
              <img src={badgeUrl} alt="" className="max-h-full max-w-full object-contain" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-[22px] bg-white/15 text-2xl font-black text-white ring-1 ring-white/20 sm:h-28 sm:w-28">{initials(displayClub)}</div>
            )}
          </div>
        </div>

        <div className="mt-auto">
          <h3 className="max-w-[92%] text-[48px] font-black leading-[0.95] tracking-tight text-white drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)] sm:text-[64px]">{playerName}</h3>
          <div className="mt-5">
            <p className="text-base font-bold text-white/90">{teamName}</p>
            <p className="mt-0.5 text-sm text-white/60">vs {opponent}</p>
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur">
            <p className="line-clamp-3 text-sm italic leading-relaxed text-white/86">&ldquo;{displayMessage}&rdquo;</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/38">
          <span className="truncate">{displayClub}</span>
          <span className="shrink-0 text-white/24">Powered by SHIFT/OS</span>
        </div>
      </div>
    </article>
  );
}
