import { NextResponse, type NextRequest } from 'next/server';
import { completePendingInvite } from '@/lib/auth/completeInvite';
import { completePlayerInvite } from '@/lib/auth/completePlayerInvite';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';
  const playerInviteToken = requestUrl.searchParams.get('invite_token');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      const playerInviteRedirect = user ? await completePlayerInvite(supabase, user.id, playerInviteToken).catch(() => null) : null;
      const inviteRedirect = user ? await completePendingInvite(supabase, user.id, user.user_metadata).catch(() => null) : null;
      if (playerInviteRedirect) {
        return NextResponse.redirect(new URL(playerInviteRedirect, requestUrl.origin));
      }
      return NextResponse.redirect(new URL(inviteRedirect ?? next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/auth/login?message=confirm-failed', requestUrl.origin));
}
