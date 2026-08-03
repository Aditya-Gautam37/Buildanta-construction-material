"use client";

import { useState } from "react";

export function CustomerLogoutButton() {
  const [working, setWorking] = useState(false);
  return <button className="button navy" type="button" disabled={working} onClick={async () => {
    setWorking(true);
    await fetch("/api/customer-auth/logout", { method: "POST" });
    window.location.assign("/");
  }}>{working ? "Signing out…" : "Sign out"}</button>;
}
