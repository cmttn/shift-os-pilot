import type { ClubDashboardData } from '@/lib/dashboard/getClubData';

function getContrastText(hexColour: string): string {
  const hex = hexColour.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function darkenHex(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round((255 * percent) / 100));
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round((255 * percent) / 100));
  const b = Math.max(0, (num & 0xff) - Math.round((255 * percent) / 100));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

interface ClubHeaderProps {
  clubData: ClubDashboardData;
}

export default function ClubHeader({ clubData }: ClubHeaderProps) {
  const { club, teams, totalPlayers, totalCoaches } = clubData;
  const initials = club.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const darkColour = darkenHex(club.primary_colour, 30);
  const contrastText = getContrastText(club.primary_colour);

  return (
    <header
      className="relative min-h-[200px] overflow-hidden py-8 md:h-[200px] md:py-0"
      style={{ background: `linear-gradient(135deg, ${club.primary_colour} 0%, ${darkColour} 45%, #080a0f 100%)` }}
    >
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '14px 14px'
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-full" style={{ background: 'linear-gradient(to bottom, transparent 50%, #080a0f 100%)' }} />

      <div className="relative flex h-full flex-col items-center justify-center px-5 text-center md:flex-row md:justify-between md:px-10 md:text-left">
        <div className="flex flex-col items-center md:flex-row">
          {club.badge_url ? (
            <img
              src={club.badge_url}
              alt={`${club.name} badge`}
              className="h-20 w-20 overflow-hidden rounded-full object-cover md:h-[110px] md:w-[110px]"
              style={{ filter: `drop-shadow(0 12px 32px rgba(0,0,0,0.8)) drop-shadow(0 0 20px ${club.primary_colour}66)` }}
            />
          ) : (
            <p
              className="text-5xl font-black leading-none text-white md:text-6xl"
              style={{ textShadow: `0 0 40px ${club.primary_colour}` }}
            >
              {initials}
            </p>
          )}

          <div className="mt-5 md:ml-6 md:mt-0">
            <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}>
              {club.name}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm italic text-white/45 md:mx-0">{club.ethos ?? 'Building players and people every day.'}</p>
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {[
            ['Teams', teams.length],
            ['Players', totalPlayers],
            ['Coaches', totalCoaches]
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-full border px-5 py-2.5 text-center backdrop-blur-md transition-all duration-300 ease-out hover:bg-white/[0.12]"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.12)',
                color: contrastText === '#ffffff' ? '#ffffff' : '#f0f4ff'
              }}
            >
              <p className="text-2xl font-bold leading-none text-white">{value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.28em] text-white/35">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
