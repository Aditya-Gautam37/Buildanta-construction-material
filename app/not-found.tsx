import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="simple-protected">
      <div className="page-intro" style={{ padding: 0, background: "transparent", border: 0 }}>
        <p>404</p>
        <h1>We couldn&apos;t find that page.</h1>
        <span>The page you&apos;re looking for may have moved, been renamed, or no longer exists. Try one of the links below, or head back to the homepage.</span>
      </div>
      <div className="account-hero-actions" style={{ marginTop: 28 }}>
        <a className="button navy" href="/">Back to home <span>→</span></a>
        <a className="button account-outline" style={{ borderColor: "var(--border)", color: "var(--navy)" }} href="/categories">Browse materials</a>
        <a className="button account-outline" style={{ borderColor: "var(--border)", color: "var(--navy)" }} href="/bulk-quotes">Request a quote</a>
      </div>
    </main>
  );
}
