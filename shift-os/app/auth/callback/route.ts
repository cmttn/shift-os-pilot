import { NextResponse, type NextRequest } from 'next/server';
import { completePendingInvite } from '@/lib/auth/completeInvite';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      const inviteRedirect = user ? await completePendingInvite(supabase, user.id, user.user_metadata).catch(() => null) : null;
      return NextResponse.redirect(new URL(inviteRedirect ?? next, requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/auth/login?message=confirm-failed', requestUrl.origin));
}
