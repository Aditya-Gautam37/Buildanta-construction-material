import type { EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { syncAuthenticatedUser } from '@/lib/auth/sync-user';
import { safeRedirectPath } from '@/lib/safe-redirect';
import { createClient } from '@/lib/supabase/server';

function authErrorRedirect(request: NextRequest, message: string) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  url.searchParams.set('error', message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null;
  const next = safeRedirectPath(request.nextUrl.searchParams.get('next'));
  const supabase = await createClient();

  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : null;

  if (!result || result.error) {
    return authErrorRedirect(request, 'The confirmation link is invalid or has expired. Please request a new link.');
  }

  const user = result.data.user;
  if (user) {
    try {
      await syncAuthenticatedUser(user);
    } catch (error) {
      console.error('Unable to synchronize confirmed user.', error);
      return authErrorRedirect(request, 'Your email was confirmed, but your inventory profile could not be prepared.');
    }
  }

  const redirect = request.nextUrl.clone();
  redirect.pathname = next;
  redirect.search = '';
  return NextResponse.redirect(redirect);
}
