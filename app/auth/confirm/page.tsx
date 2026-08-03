"use client";

import { useEffect, useState } from "react";

export default function CustomerAuthConfirmationPage() {
  const [message, setMessage] = useState("Confirming your Buildanta account…");

  useEffect(() => {
    const values = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = values.get("access_token");
    const refreshToken = values.get("refresh_token");
    const expiresIn = Number(values.get("expires_in") ?? 3600);
    const authError = values.get("error_description");
    if (authError) {
      window.setTimeout(() => setMessage(decodeURIComponent(authError)), 0);
      return;
    }
    if (!accessToken || !refreshToken) {
      window.setTimeout(() => setMessage("This confirmation link is invalid or has expired. Please create the account again."), 0);
      return;
    }

    fetch("/api/customer-auth/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accessToken, refreshToken, expiresIn }),
    }).then(async (response) => {
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to confirm the account.");
      window.history.replaceState(null, "", "/auth/confirm");
      window.location.replace("/account");
    }).catch((error) => setMessage(error instanceof Error ? error.message : "Unable to confirm the account."));
  }, []);

  return <main className="customer-confirm"><div><img src="/logo.png" alt="" /><h1>{message}</h1><a href="/login">Return to customer login</a></div></main>;
}
