"use client";

import { FormEvent, useState } from "react";

export function CustomerAuthForm({ mode }: { mode: "login" | "signup" }) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setError("");
    setSuccess("");
    const form = new FormData(formElement);
    const password = String(form.get("password") ?? "");
    if (mode === "signup" && password !== String(form.get("confirmPassword") ?? "")) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const payload = Object.fromEntries(form.entries());
    delete payload.confirmPassword;
    try {
      const response = await fetch(`/api/customer-auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string; requiresConfirmation?: boolean };
      if (!response.ok) throw new Error(data.error ?? "Authentication failed.");
      if (data.requiresConfirmation) {
        setSuccess("Account created. Open the confirmation link sent to your email, then sign in.");
        formElement.reset();
        return;
      }
      // Carry any cart built while signed out into the account. Without this a
      // visitor sent here from checkout returns to an empty cart, which is a
      // worse experience than not asking them to sign in at all.
      // A failure here must not block the sign-in that already succeeded.
      try {
        await fetch("/api/cart/merge", { method: "POST" });
      } catch {
        // Ignored deliberately: they are signed in, and their guest cart is
        // still recoverable on the next merge attempt.
      }

      const requested = new URLSearchParams(window.location.search).get("redirect");
      const destination = requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/account";
      window.location.assign(destination);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="customer-auth-form" onSubmit={submit}>
      {mode === "signup" && (
        <div className="field-grid">
          <label>First name<input name="firstName" autoComplete="given-name" required /></label>
          <label>Last name<input name="lastName" autoComplete="family-name" required /></label>
        </div>
      )}
      <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required /></label>
      {mode === "signup" && (
        <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required /></label>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      {success && <p className="customer-auth-success" role="status">{success}</p>}
      <button className="button navy wide" type="submit" disabled={submitting}>
        {submitting ? "Please wait…" : mode === "login" ? "Sign in to Buildanta" : "Create customer account"}
        <span>→</span>
      </button>
      <small>Your password is handled securely by Supabase and is never stored by Buildanta.</small>
    </form>
  );
}
