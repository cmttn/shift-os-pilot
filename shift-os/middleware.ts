import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type ClubMembership = {
  club_role: string | null;
  club_id: string | null;
};

type FamilyConnection = {
  id: string;
};

const PUBLIC_ROUTES = ['/', '/auth/login', '/auth/signup', '/auth/callback'];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/poll/') || pathname.startsWith('/invite/') || pathname.startsWith('/api/');
}

function redirectTo(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

function isOnRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const pathname = request.nextUrl.pathname;
  if (isPublicRoute(pathname)) {
    return response;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

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

  if (!session) {
    return redirectTo(request, '/');
  }

  const { data: membership } = await supabase
    .from('club_members')
    .select('club_role, club_id')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .order('joined_at', { ascending: true })
    .limit(1)
    .maybeSingle<ClubMembership>();

  const clubRole = membership?.club_role ?? null;
  console.log('[middleware] clubRole', clubRole, 'user', session.user.id, 'path', pathname);

  if (clubRole === 'admin') {
    return isOnRoute(pathname, '/dashboard/club') ? response : redirectTo(request, '/dashboard/club');
  }

  if (clubRole === 'coach') {
    if (isOnRoute(pathname, '/dashboard/coach/welcome') || isOnRoute(pathname, '/dashboard/coach/teams/new')) {
      return redirectTo(request, '/dashboard/coach');
    }

    return isOnRoute(pathname, '/dashboard/coach') ? response : redirectTo(request, '/dashboard/coach');
  }

  if (clubRole === 'parent') {
    return isOnRoute(pathname, '/dashboard/parent') ? response : redirectTo(request, '/dashboard/parent');
  }

  if (clubRole === 'player') {
    return isOnRoute(pathname, '/dashboard/player') ? response : redirectTo(request, '/dashboard/player');
  }

  if (clubRole === null) {
    const { data: familyConnection } = await supabase
      .from('football_family')
      .select('id')
      .eq('family_user_id', session.user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle<FamilyConnection>();

    if (familyConnection) {
      return isOnRoute(pathname, '/dashboard/family') ? response : redirectTo(request, '/dashboard/family');
    }

    const intendedRole = typeof session.user.user_metadata?.intended_role === 'string' ? session.user.user_metadata.intended_role : null;

    if (intendedRole === 'coach') {
      return isOnRoute(pathname, '/dashboard/coach/welcome') || isOnRoute(pathname, '/dashboard/coach/teams/new') ? response : redirectTo(request, '/dashboard/coach/welcome');
    }

    if (intendedRole === 'club_admin') {
      return pathname === '/onboarding' ? response : redirectTo(request, '/onboarding');
    }

    if (intendedRole === 'player') {
      return isOnRoute(pathname, '/dashboard/player/welcome') ? response : redirectTo(request, '/dashboard/player/welcome');
    }

    if (intendedRole === 'family') {
      return isOnRoute(pathname, '/dashboard/family') ? response : redirectTo(request, '/dashboard/family');
    }

    return pathname === '/onboarding' ? response : redirectTo(request, '/onboarding');
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json).*)']
};
