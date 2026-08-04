'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent } from '@workspace/ui/components/card';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { supabaseBrowser } from '@/lib/supabase/client';
import { safeRedirectPath } from '@/lib/safe-redirect';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [redirectPath, setRedirectPath] = useState('/dashboard');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');

    if (redirect) {
      setRedirectPath(safeRedirectPath(redirect));
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const supabase = supabaseBrowser();
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!isMounted) {
        return;
      }

      if (!user) {
        router.replace(`/login?redirect=${encodeURIComponent(`/profile/complete?redirect=${redirectPath}`)}`);
        return;
      }

      const currentFirstName = (user.user_metadata?.firstName as string | undefined) ?? '';
      const currentLastName = (user.user_metadata?.lastName as string | undefined) ?? '';

      setEmail(user.email ?? '');
      setFirstName(currentFirstName);
      setLastName(currentLastName);

      if (currentFirstName && currentLastName) {
        router.replace(safeRedirectPath(redirectPath));
      }
    }

    void loadUser();

    return () => {
      isMounted = false;
    };
  }, [redirectPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      setError('First name and last name are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = supabaseBrowser();
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: {
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
        },
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      if (!data.user?.id) {
        setError('Unable to update your profile right now.');
        return;
      }

      const syncResponse = await fetch('/api/auth/sync', { method: 'POST' });
      if (!syncResponse.ok) {
        throw new Error('Profile updated, but inventory synchronization failed.');
      }

      router.replace(safeRedirectPath(redirectPath));
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to update your profile right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-md border-slate-200 bg-white shadow-sm">
        <CardContent className="space-y-5 pt-6">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-slate-950">Finish your profile</h1>
            <p className="text-sm leading-6 text-slate-600">
              First name and last name are required before you can continue.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} disabled className="bg-slate-50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Pranav"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Sharma"
              />
            </div>

            {error ? (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Saving profile...' : 'Continue'}
            </Button>
          </form>

          <p className="text-sm text-slate-600">
            Need to switch accounts?{' '}
            <Link href="/login" className="font-medium text-slate-900 hover:underline">
              Sign in again
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
