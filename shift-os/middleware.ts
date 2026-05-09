import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type MembershipLookup = { club_role: string };

const PUBLIC_ROUTES = ['/', '/auth/login', '/auth/signup', '/auth/callback'];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (!session && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (session && (pathname === '/auth/login' || pathname === '/auth/signup')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (session) {
    const { data: membership } = await supabase
      .from('club_members')
      .select('club_role')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .maybeSingle<MembershipLookup>();

    const intendedRole = typeof session.user.user_metadata.intended_role === 'string' ? session.user.user_metadata.intended_role : '';
    const inviteToken = typeof session.user.user_metadata.invite_token === 'string' ? session.user.user_metadata.invite_token : '';

    if (!membership) {
      const url = request.nextUrl.clone();
      if (intendedRole === 'coach' && !inviteToken) url.pathname = '/dashboard/coach/welcome';
      else if (intendedRole === 'player') url.pathname = '/dashboard/player/welcome';
      else url.pathname = '/onboarding';
      if (pathname !== url.pathname) return NextResponse.redirect(url);
      return response;
    }

    const role = membership.club_role;
    if (role === 'admin' || role === 'club_admin' || role === 'shift_admin') {
      if (pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/club') && pathname !== '/dashboard') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard/club';
        return NextResponse.redirect(url);
      }
    }

    if (role === 'coach') {
      const { count } = await supabase.from('team_coaches').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id);
      const target = (count ?? 0) > 0 ? '/dashboard/coach' : '/dashboard/coach/welcome';
      if (pathname === '/dashboard' || (pathname.startsWith('/dashboard') && !pathname.startsWith(target) && !pathname.startsWith('/dashboard/coach/teams/new'))) {
        const url = request.nextUrl.clone();
        url.pathname = target;
        return NextResponse.redirect(url);
      }
    }

    if (role === 'parent' && (pathname === '/dashboard' || pathname.startsWith('/dashboard/club') || pathname.startsWith('/dashboard/coach'))) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard/parent/player';
      return NextResponse.redirect(url);
    }

    if (role === 'player' && pathname === '/dashboard') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard/player/welcome';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)']
};
