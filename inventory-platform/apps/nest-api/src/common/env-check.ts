// Fails the boot with a clear message instead of letting a missing variable
// surface later as an opaque runtime crash on whichever request touches it
// first (a Prisma connection error, or "Cannot read properties of undefined"
// deep inside an auth guard). Each group lists every accepted alias for that
// setting — see .env.example for why more than one name is accepted.
const requiredGroups: Array<{ label: string; anyOf: string[] }> = [
  { label: 'DATABASE_URL', anyOf: ['DATABASE_URL'] },
  { label: 'a Supabase project URL', anyOf: ['SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'] },
  {
    label: 'a Supabase publishable/anon key',
    anyOf: ['SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  },
];

export function assertRequiredEnv(): void {
  const missing = requiredGroups.filter((group) => !group.anyOf.some((key) => Boolean(process.env[key]?.trim())));
  if (missing.length === 0) return;
  const detail = missing.map((group) => `  - ${group.label} (checked: ${group.anyOf.join(', ')})`).join('\n');
  throw new Error(
    `Buildanta API cannot start: missing required configuration.\n${detail}\n` +
      'Set these in the environment before starting the app — see .env.example.',
  );
}
