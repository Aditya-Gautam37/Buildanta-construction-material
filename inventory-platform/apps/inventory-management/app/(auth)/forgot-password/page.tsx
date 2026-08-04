'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { supabaseBrowser } from '@/lib/supabase/client';
import { AuthShell } from '../auth-shell';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const supabase = supabaseBrowser();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent('/reset-password')}`,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSuccess('Password reset email sent. Open the link in this same browser.');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send a reset email right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your inventory password."
      description="We will send a secure recovery link to your account email."
      points={[
        'The link returns to this local inventory application.',
        'Choose a new password after the secure session is verified.',
        'Your products and permissions remain unchanged.',
      ]}
    >
      <Card className="w-full border-slate-200 bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Forgot password</CardTitle>
          <CardDescription>Enter the email used for your inventory account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
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

            {error ? <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
            {success ? <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p> : null}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Sending email...' : 'Send reset email'}
            </Button>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            <Link href="/login" className="font-medium text-slate-900 hover:underline">
              Return to sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
