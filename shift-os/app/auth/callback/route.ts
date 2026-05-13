import { NextResponse, type NextRequest } from 'next/server';
import { completeCoParentInvite } from '@/lib/auth/completeCoParentInvite';
import { completeFamilyInvite } from '@/lib/auth/completeFamilyInvite';
import { completePendingInvite } from '@/lib/auth/completeInvite';
import { completePlayerInvite } from '@/lib/auth/completePlayerInvite';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';
  const playerInviteToken = requestUrl.searchParams.get('invite_token');
  const familyInviteToken = requestUrl.searchParams.get('family_token');
  const coParentInviteToken = requestUrl.searchParams.get('coparent_token');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      const playerInviteRedirect = user ? await completePlayerInvite(supabase, user.id, playerInviteToken).catch(() => null) : null;
      const coParentInviteRedirect = user ? await completeCoParentInvite(supabase, user.id, coParentInviteToken).catch(() => null) : null;
      const familyInviteRedirect = user ? await completeFamilyInvite(supabase, user.id, familyInviteToken).catch(() => null) : null;
      const inviteRedirect = user ? await completePendingInvite(supabase, user.id, user.user_metadata).catch(() => null) : null;
      if (playerInviteRedirect) {
        return NextResponse.redirect(new URL(playerInviteRedirect, requestUrl.origin));
      }
      if (familyInviteRedirect) {
        return NextResponse.redirect(new URL(familyInviteRedirect, requestUrl.origin));
      }
      if (coParentInviteRedirect) {
        return NextResponse.redirect(new URL(coParentInviteRedirect, requestUrl.origin));
      }
      return NextResponse.redirect(new URL(inviteRedirect ?? next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/auth/login?message=confirm-failed', requestUrl.origin));
}
