import type { ClubDashboardData } from '@/lib/dashboard/getClubData';

function getContrastText(hexColour: string): string {
  const r = parseInt(hexColour.slice(1, 3), 16);
  const g = parseInt(hexColour.slice(3, 5), 16);
  const b = parseInt(hexColour.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function darkenHex(hex: string, amount: number): string {
  const normalized = hex.replace('#', '');
  const r = Math.max(0, Math.floor(parseInt(normalized.slice(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.floor(parseInt(normalized.slice(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.floor(parseInt(normalized.slice(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

interface ClubHeaderProps {
  clubData: ClubDashboardData;
}

export default function ClubHeader({ clubData }: ClubHeaderProps) {
  const { club, teams, totalPlayers, totalCoaches } = clubData;
  const initials = club.name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase();
  const darkColour = darkenHex(club.primary_colour, 0.4);

  return (
    <header
      className="relative overflow-hidden border-b border-gray-800 py-6"
      style={{ background: `linear-gradient(120deg, ${club.primary_colour} 0%, ${darkColour} 100%)` }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      />
      <div className="relative flex flex-col items-center justify-between gap-5 px-4 md:flex-row md:items-center md:px-8">
        <div className="flex flex-col items-center gap-4 text-center md:flex-row md:text-left">
          <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-gray-900 text-3xl font-bold text-white shadow-[0_0_24px_rgba(255,255,255,0.45)] md:h-[100px] md:w-[100px] md:text-4xl">
            {club.badge_url ? (
              <img src={club.badge_url} alt={`${club.name} badge`} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow md:text-4xl">{club.name}</h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm italic text-white/80 md:mx-0 md:text-base">
              {club.ethos ?? 'Building players and people every day.'}
            </p>
          </div>
        </div>

        <div className="hidden gap-3 md:flex">
          {[
            ['Teams', teams.length],
            ['Players', totalPlayers],
            ['Coaches', totalCoaches]
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/30 bg-white/20 px-5 py-2 text-center" style={{ color: getContrastText(club.primary_colour) }}>
              <p className="text-xl font-bold leading-tight">{value}</p>
              <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
