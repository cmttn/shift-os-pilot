import Link from 'next/link';

export interface PotmTickerItem {
  id: string;
  playerName: string;
  teamName: string;
  opponent: string;
  cardUrl: string | null;
  href?: string | null;
}

interface PotmTickerProps {
  title?: string;
  items: PotmTickerItem[];
  primaryColour: string;
}

export default function PotmTicker({ title = 'Recent POTM', items, primaryColour }: PotmTickerProps) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <p className="shrink-0 px-2 text-xs font-black uppercase tracking-[0.22em]" style={{ color: primaryColour }}>{title}</p>
        {items.map((item) => {
          const content = (
            <article className="flex min-w-[240px] items-center gap-3 rounded-xl border border-white/[0.06] bg-[#0d1117] p-3 transition duration-300 ease-out hover:border-white/15">
              {item.cardUrl ? (
                <img src={item.cardUrl} alt="" className="h-12 w-16 rounded-lg object-cover" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.06] text-lg">🏆</span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">POTM: {item.playerName}</span>
                <span className="mt-0.5 block truncate text-xs text-white/40">{item.teamName} v {item.opponent}</span>
              </span>
            </article>
          );
          return item.href ? (
            <Link key={item.id} href={item.href} className="shrink-0">
              {content}
            </Link>
          ) : (
            <div key={item.id} className="shrink-0">
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
