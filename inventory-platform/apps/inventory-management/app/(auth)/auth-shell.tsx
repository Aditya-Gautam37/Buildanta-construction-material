import type { ReactNode } from 'react';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  children: ReactNode;
};

export function AuthShell({ eyebrow, title, description, points, children }: AuthShellProps) {
  return (
    <main className="relative min-h-[calc(100vh-4rem)] flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.13),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(15,23,42,0.08),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#eefbf8_52%,_#ffffff_100%)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[linear-gradient(90deg,rgba(15,23,42,0.08),rgba(14,165,233,0.12),rgba(15,23,42,0.06))] blur-3xl" />

      <div className="relative grid min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden border-r border-slate-800/70 bg-slate-950 px-8 py-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.8),transparent_45%)]" />

          <div className="relative space-y-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-300">
              <Sparkles className="size-3.5 text-emerald-300" />
              Buildanta inventory access
            </div>

            <div className="max-w-xl space-y-4">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                {eyebrow}
              </p>
              <h1 className="text-5xl font-semibold tracking-tight text-white">{title}</h1>
              <p className="max-w-lg text-base leading-7 text-slate-300">{description}</p>
            </div>

            <div className="grid max-w-xl gap-3">
              {points.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-300" />
                  <p className="text-sm leading-6 text-slate-200">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
              <ArrowRight className="size-4 text-emerald-300" />
              Protected inventory workflow
            </div>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Sign in or create an account, then continue directly into the dashboard. The route is
              protected at the middleware level so unauthenticated users are redirected before the
              page renders.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-slate-500 shadow-sm backdrop-blur lg:hidden">
              <Sparkles className="size-3.5 text-emerald-700" />
              Buildanta inventory access
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
