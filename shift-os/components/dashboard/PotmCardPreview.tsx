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
      <svg className="absolute bottom-10 right-0 h-[62%] w-[58%] text-white/[0.075]" viewBox="0 0 180 220" aria-hidden="true">
        <path
          fill="currentColor"
          d="M57 23h66v28h31c-1 29-14 49-38 58-5 14-14 24-26 29v24h34v18H56v-18h34v-24c-12-5-21-15-26-29-24-9-37-29-38-58h31V23Zm0 46H43c3 14 9 24 19 30-3-10-5-20-5-30Zm61 30c10-6 16-16 19-30h-14c0 10-2 20-5 30Z"
        />
      </svg>

      <div className="relative flex h-full flex-col p-7 sm:p-9">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="max-w-[13rem] text-[clamp(17px,4.4vw,26px)] font-black uppercase leading-[1.02] tracking-[0.18em] text-white sm:max-w-sm sm:tracking-[0.24em]">Player of the Match</p>
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

        <div className="mt-8 sm:mt-12">
          <h3 className="max-w-[92%] text-[clamp(38px,10vw,64px)] font-black leading-[0.95] tracking-tight text-white drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)]">{playerName}</h3>
          <div className="mt-4 sm:mt-5">
            <p className="text-base font-bold text-white/90">{teamName}</p>
            <p className="mt-0.5 text-sm text-white/60">vs {opponent}</p>
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur sm:mt-6">
            <p className="line-clamp-3 text-sm italic leading-relaxed text-white/86">&ldquo;{displayMessage}&rdquo;</p>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-4 pt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/38">
          <span className="truncate">{displayClub}</span>
          <span className="shrink-0 text-white/24">Powered by SHIFT/OS</span>
        </div>
      </div>
    </article>
  );
}
