'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { supabaseBrowser } from '@/lib/supabase/client';
import { safeRedirectPath } from '@/lib/safe-redirect';
import { AuthShell } from '../auth-shell';

export default function LoginPage() {
  const router = useRouter();
  const [redirectPath, setRedirectPath] = useState('/dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');

    if (redirect) {
      setRedirectPath(safeRedirectPath(redirect));
    }

    const authError = params.get('error');
    if (authError) {
      setError(authError);
    }
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = supabaseBrowser();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (data?.session) {
        const user = data.session.user;
        const hasMissingProfileName = !user.user_metadata?.firstName || !user.user_metadata?.lastName;

        const syncResponse = await fetch('/api/auth/sync', {
          method: 'POST',
        });
        if (!syncResponse.ok) {
          throw new Error('Signed in, but your inventory profile could not be synchronized.');
        }

        if (hasMissingProfileName) {
          router.replace(`/profile/complete?redirect=${encodeURIComponent(redirectPath)}`);
          return;
        }

        router.replace(safeRedirectPath(redirectPath));
        return;
      }

      if (signInError) {
        setError(signInError.message);
      }
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to sign in right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Inventory operations"
      title="Your catalog, fully under control."
      description="Manage Buildanta products, construction taxonomies, brands, suppliers, and durable product media from one connected workspace."
      points={[
        'Authenticated catalog access with role-based editing.',
        'Live products, variants, suppliers, and construction taxonomies.',
        'Durable brand logos and product imagery backed by object storage.',
      ]}
    >
      <Card className="w-full border-slate-200 bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Access inventory dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
              />
            </div>

            {error ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>

            <div className="text-right">
              <Link href="/forgot-password" className="text-sm font-medium text-slate-700 hover:underline">
                Forgot password?
              </Link>
            </div>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            Need an account?{' '}
            <Link href="/signup" className="font-medium text-slate-900 hover:underline">
              Create one
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
