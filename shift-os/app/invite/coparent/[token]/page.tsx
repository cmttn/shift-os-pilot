import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/service';

interface CoParentInvitePageProps {
  params: {
    token: string;
  };
}

interface InviteRow {
  player_id: string;
  invited_by: string;
  invitee_name: string | null;
  status: string | null;
  expires_at: string | null;
}

interface PlayerRow {
  first_name: string | null;
  last_name: string | null;
  team_id: string | null;
}

interface TeamRow {
  name: string;
  club_id: string | null;
}

interface ClubRow {
  name: string;
  badge_url: string | null;
  primary_colour: string | null;
}

interface ProfileRow {
  full_name: string | null;
}

function fullName(firstName: string | null, lastName: string | null): string {
  return [firstName, lastName].map((part) => part?.trim()).filter(Boolean).join(' ') || 'Player';
}

function isExpired(value: string | null): boolean {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.valueOf()) && date.valueOf() < Date.now();
}

export default async function CoParentInvitePage({ params }: CoParentInvitePageProps) {
  const supabase = createServiceClient();
  const { data: invite } = await supabase
    .from('football_family_invites')
    .select('player_id,invited_by,invitee_name,status,expires_at')
    .eq('invite_token', params.token)
    .maybeSingle<InviteRow>();

  if (!invite || invite.status !== 'pending' || isExpired(invite.expires_at)) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5 text-white" style={{ backgroundColor: '#080a0f' }}>
        <section className="w-full max-w-[480px] rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 text-center">
          <h1 className="text-2xl font-black">This parent invite has expired or already been used.</h1>
          <Link href="/auth/login" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">Go to SHIFT OS</Link>
        </section>
      </main>
    );
  }

  const [{ data: player }, { data: inviter }] = await Promise.all([
    supabase.from('players').select('first_name,last_name,team_id').eq('id', invite.player_id).maybeSingle<PlayerRow>(),
    supabase.from('users_profile').select('full_name').or(`id.eq.${invite.invited_by},user_id.eq.${invite.invited_by}`).maybeSingle<ProfileRow>()
  ]);
  const { data: team } = player?.team_id
    ? await supabase.from('teams').select('name,club_id').eq('id', player.team_id).maybeSingle<TeamRow>()
    : { data: null };
  const { data: club } = team?.club_id
    ? await supabase.from('clubs').select('name,badge_url,primary_colour').eq('id', team.club_id).maybeSingle<ClubRow>()
    : { data: null };

  const playerName = fullName(player?.first_name ?? null, player?.last_name ?? null);
  const primaryColour = club?.primary_colour ?? '#00C851';
  const signupHref = `/auth/signup?coparent_token=${encodeURIComponent(params.token)}&role=parent`;
  const loginHref = `/auth/login?coparent_token=${encodeURIComponent(params.token)}`;

  return (
    <main className="min-h-screen px-5 py-10 text-white" style={{ backgroundColor: '#080a0f' }}>
      <section className="mx-auto max-w-[480px] text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/10 shadow-2xl" style={{ boxShadow: `0 0 32px ${primaryColour}66` }}>
          {club?.badge_url ? <img src={club.badge_url} alt="" className="h-full w-full object-cover" /> : <span className="font-black" style={{ color: primaryColour }}>SO</span>}
        </div>
        <p className="mt-4 text-sm text-white/45">{club?.name ?? team?.name ?? 'SHIFT OS'}</p>
        <h1 className="mt-5 text-3xl font-black">You have been invited as a parent for {playerName}</h1>
        <p className="mt-3 text-sm leading-relaxed text-white/50">{inviter?.full_name ?? 'A parent'} has invited you to share full parent access for {playerName} on SHIFT OS.</p>

        <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 text-left">
          {['Confirm availability', 'Set and award goals', 'Raise parent tickets', 'View fixtures, coach notes and milestones'].map((item) => (
            <p key={item} className="mb-3 text-sm text-white/65">{item}</p>
          ))}
          <p className="mt-4 text-xs leading-relaxed text-white/30">This is a full-access parent connection, not view-only Football Family access.</p>
        </div>

        <div className="mt-6 space-y-3">
          <Link href={signupHref} className="flex min-h-13 items-center justify-center rounded-full px-5 text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${primaryColour}, ${primaryColour}cc)` }}>Create Account to Join</Link>
          <Link href={loginHref} className="flex min-h-13 items-center justify-center rounded-full border border-white/10 px-5 text-sm font-semibold text-white/65">I already have an account</Link>
        </div>
      </section>
    </main>
  );
}
