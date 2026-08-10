"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Storefront runtime error:", error);
  }, [error]);

  return (
    <main className="simple-protected">
      <div className="page-intro" style={{ padding: 0, background: "transparent", border: 0 }}>
        <p>SOMETHING WENT WRONG</p>
        <h1>This page hit a snag.</h1>
        <span>An unexpected error occurred while loading this page. You can try again, or head back to the homepage while we look into it.</span>
      </div>
      <div className="account-hero-actions" style={{ marginTop: 28 }}>
        <button className="button navy" type="button" onClick={reset}>Try again <span>→</span></button>
        <a className="button account-outline" style={{ borderColor: "var(--border)", color: "var(--navy)" }} href="/">Back to home</a>
      </div>
    </main>
  );
}
