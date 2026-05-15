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
      <div className="absolute inset-y-0 right-10 w-24 rotate-[18deg] bg-white/[0.07]" />
      <svg className="absolute -left-[14%] bottom-[3%] h-[46%] w-[42%] text-white/[0.02]" viewBox="0 0 180 220" aria-hidden="true">
        <path
          fill="currentColor"
          d="M57 23h66v28h31c-1 29-14 49-38 58-5 14-14 24-26 29v24h34v18H56v-18h34v-24c-12-5-21-15-26-29-24-9-37-29-38-58h31V23Zm0 46H43c3 14 9 24 19 30-3-10-5-20-5-30Zm61 30c10-6 16-16 19-30h-14c0 10-2 20-5 30Z"
        />
      </svg>
      <svg className="absolute right-[-10%] top-[19%] h-[50%] w-[46%] text-white/[0.024]" viewBox="0 0 180 220" aria-hidden="true">
        <path
          fill="currentColor"
          d="M57 23h66v28h31c-1 29-14 49-38 58-5 14-14 24-26 29v24h34v18H56v-18h34v-24c-12-5-21-15-26-29-24-9-37-29-38-58h31V23Zm0 46H43c3 14 9 24 19 30-3-10-5-20-5-30Zm61 30c10-6 16-16 19-30h-14c0 10-2 20-5 30Z"
        />
      </svg>

      <div className="absolute inset-4 sm:inset-8">
        <p className="absolute left-0 right-0 top-[5%] whitespace-nowrap text-center text-[clamp(12px,3.25vw,24px)] font-black uppercase leading-none tracking-[0.13em] text-white sm:tracking-[0.22em]">Player of the Match</p>

        <div className="absolute left-1/2 top-[10%] flex h-[24%] w-[24%] -translate-x-1/2 items-center justify-center drop-shadow-[0_18px_32px_rgba(0,0,0,0.45)]">
          {badgeUrl ? <img src={badgeUrl} alt="" className="max-h-full max-w-full scale-[1.6] object-contain" /> : <div className="flex h-full w-full scale-[1.6] items-center justify-center rounded-[24px] bg-white/15 text-3xl font-black text-white ring-1 ring-white/20 sm:rounded-[34px] sm:text-5xl">{initials(displayClub)}</div>}
        </div>

        <div className="absolute left-0 right-0 top-[36%] flex flex-col items-center">
          <h3 className="max-w-full text-center text-[clamp(29px,7.6vw,58px)] font-black leading-[0.88] tracking-[-0.02em] text-white drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)] [overflow-wrap:anywhere]">{playerName}</h3>
          <p className="mt-2 text-sm font-bold leading-none text-white/90 sm:mt-3 sm:text-base">{teamName}</p>
          <p className="mt-1 text-xs leading-none text-white/60 sm:text-sm">vs {opponent}</p>
          <p className="mt-3 text-[8px] font-semibold uppercase leading-none tracking-[0.12em] text-white/50 sm:text-[10px]">Awarded by parents</p>
        </div>

        <div className="absolute left-0 right-0 top-[69%] rounded-2xl border border-white/[0.08] bg-black/[0.18] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur sm:p-4">
          <p className="line-clamp-2 text-xs italic leading-relaxed text-white/86 sm:line-clamp-3 sm:text-sm">&ldquo;{displayMessage}&rdquo;</p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[14%] font-semibold uppercase">
          <span className="absolute bottom-[48%] left-2 right-2 whitespace-nowrap text-[7px] tracking-[0.05em] text-white/40 sm:text-[9px] sm:tracking-[0.08em]">{displayClub}</span>
          <span className="absolute bottom-[10%] right-2 text-[5px] tracking-[0.12em] text-white/20 sm:right-3 sm:text-[7px]">Powered by SHIFT/OS</span>
        </div>
      </div>
    </article>
  );
}
