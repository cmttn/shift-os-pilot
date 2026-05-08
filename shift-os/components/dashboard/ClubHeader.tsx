import type { ClubDashboardData } from '@/lib/dashboard/getClubData';

interface ClubHeaderProps {
  clubData: ClubDashboardData;
}

export default function ClubHeader({ clubData }: ClubHeaderProps) {
  const { club, teams, totalPlayers, totalCoaches } = clubData;
  const initials = club.name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="relative h-[120px] overflow-hidden border-b border-gray-800 md:h-[160px]" style={{ background: `linear-gradient(140deg, ${club.primary_colour} 0%, #111827 85%)` }}>
      <div className="flex h-full items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white text-2xl font-bold text-gray-900 shadow-2xl md:h-20 md:w-20 md:text-3xl">
            {club.badge_url ? <img src={club.badge_url} alt={`${club.name} badge`} className="h-full w-full object-cover" /> : initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white drop-shadow md:text-3xl">{club.name}</h1>
            <p className="max-w-xl text-sm text-white/80">{(club.ethos ?? 'Building players and people every day.').slice(0, 60)}</p>
          </div>
        </div>

        <div className="hidden gap-2 md:flex">
          <div className="rounded-full bg-white/15 px-4 py-2 text-sm text-white">Teams: {teams.length}</div>
          <div className="rounded-full bg-white/15 px-4 py-2 text-sm text-white">Players: {totalPlayers}</div>
          <div className="rounded-full bg-white/15 px-4 py-2 text-sm text-white">Coaches: {totalCoaches}</div>
        </div>
      </div>
    </header>
  );
}
