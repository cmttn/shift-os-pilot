import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

interface PlayerInvitePageProps {
  params: {
    token: string;
  };
}

interface InvitePlayerRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  invite_status: string | null;
  teams?: {
    name: string | null;
    age_group: string | null;
    clubs?: {
      name: string | null;
      badge_url: string | null;
      primary_colour: string | null;
    } | Array<{
      name: string | null;
      badge_url: string | null;
      primary_colour: string | null;
    }> | null;
  } | Array<{
    name: string | null;
    age_group: string | null;
    clubs?: {
      name: string | null;
      badge_url: string | null;
      primary_colour: string | null;
    } | Array<{
      name: string | null;
      badge_url: string | null;
      primary_colour: string | null;
    }> | null;
  }> | null;
}

function getFirstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function darkenHex(hexColour: string, percent: number): string {
  const hex = hexColour.replace('#', '');
  const value = parseInt(hex.length === 6 ? hex : '00c851', 16);
  const amount = Math.round((255 * percent) / 100);
  const r = Math.max(0, (value >> 16) - amount);
  const g = Math.max(0, ((value >> 8) & 0xff) - amount);
  const b = Math.max(0, (value & 0xff) - amount);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export default async function PlayerInvitePage({ params }: PlayerInvitePageProps) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('players')
    .select('id,first_name,last_name,invite_status,teams(name,age_group,clubs(name,badge_url,primary_colour))')
    .eq('invite_token', params.token)
    .neq('invite_status', 'accepted')
    .maybeSingle<InvitePlayerRow>();

  const team = getFirstRelation(data?.teams);
  const club = getFirstRelation(team?.clubs);

  if (!data || !team) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 py-10 text-center text-white" style={{ backgroundColor: '#080a0f' }}>
        <section className="w-full max-w-[480px] rounded-2xl border p-8" style={{ background: 'linear-gradient(145deg,#0d1117,#0a0e15)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h1 className="text-2xl font-black">This invite link has already been used or has expired.</h1>
          <Link href="/auth/login" className="mt-6 inline-flex rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 ease-out hover:bg-white/[0.06]">
            Go to SHIFT OS →
          </Link>
        </section>
      </main>
    );
  }

  const primaryColour = club?.primary_colour ?? '#00C851';
  const darkColour = darkenHex(primaryColour, 25);
  const playerFirstName = data.first_name?.trim() || 'Your child';
  const teamName = team.name ?? 'your team';
  const clubName = club?.name ?? 'SHIFT OS';
  const badgeInitials = getInitials(clubName);

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10 text-white" style={{ background: `radial-gradient(ellipse at top, ${primaryColour}18 0%, transparent 50%), #080a0f` }}>
      <section className="w-full max-w-[480px] text-center">
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/20"
          style={{ background: `linear-gradient(135deg, ${primaryColour}, ${darkColour})`, boxShadow: `0 16px 34px rgba(0,0,0,0.55), 0 0 28px ${primaryColour}66` }}
        >
          {club?.badge_url ? <img src={club.badge_url} alt={`${clubName} badge`} className="h-full w-full object-cover" /> : <span className="text-xl font-black text-white">{badgeInitials}</span>}
        </div>

        <p className="mt-3 text-sm font-medium text-white/50">{clubName}</p>
        {team.age_group ? <span className="mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold text-black" style={{ backgroundColor: primaryColour }}>{team.age_group}</span> : null}

        <h1 className="mt-5 text-2xl font-black leading-tight text-white">You&apos;ve been invited to join {teamName}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/50">
          {playerFirstName} has been added to the squad. Create your account to confirm availability, receive match updates and stay connected with the team.
        </p>

        <div className="mt-8 grid gap-3">
          <Link href={`/auth/signup?invite_token=${encodeURIComponent(params.token)}&role=parent`} className="rounded-full px-5 py-3 text-center text-sm font-bold text-black transition-all duration-300 ease-out hover:scale-[1.02]" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${darkColour})` }}>
            Create Account
          </Link>
          <Link href={`/auth/login?invite_token=${encodeURIComponent(params.token)}`} className="rounded-full border border-white/10 px-5 py-3 text-center text-sm font-semibold text-white transition-all duration-300 ease-out hover:bg-white/[0.06]">
            I already have an account
          </Link>
        </div>

        <p className="mt-8 text-xs uppercase tracking-[0.28em] text-white/20">Powered by SHIFT OS</p>
      </section>
    </main>
  );
}
