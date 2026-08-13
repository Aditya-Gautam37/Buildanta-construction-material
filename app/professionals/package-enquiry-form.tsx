"use client";

import { useState } from "react";
import { areaLabel, formatRupees, type ContractorPackage } from "./package-estimate";
import styles from "./package-enquiry-form.module.css";

type Props = {
  professionalSlug: string;
  professionalName: string;
  selected: ContractorPackage;
  area: number;
  estimate: number;
  onClose: () => void;
};

type State =
  | { status: "editing"; error: string | null }
  | { status: "sending" }
  | { status: "sent"; reference: string };

export function PackageEnquiryForm({ professionalSlug, professionalName, selected, area, estimate, onClose }: Props) {
  const [state, setState] = useState<State>({ status: "editing", error: null });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.status === "sending") return;

    const form = new FormData(event.currentTarget);
    const text = (key: string) => String(form.get(key) ?? "").trim() || undefined;

    setState({ status: "sending" });
    try {
      const response = await fetch(
        `/api/professionals/${encodeURIComponent(professionalSlug)}/packages/${encodeURIComponent(selected.slug)}/enquiries`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          // No rate or total is sent. The server recalculates from the stored
          // package, so there is nothing here worth tampering with.
          body: JSON.stringify({
            customerName: text("customerName"),
            customerPhone: text("customerPhone"),
            customerEmail: text("customerEmail"),
            projectLocation: text("projectLocation"),
            plotDimensions: text("plotDimensions"),
            areaSqFt: area,
            floors: form.get("floors") ? Number(form.get("floors")) : undefined,
            constructionType: text("constructionType"),
            expectedStart: text("expectedStart"),
            requirement: text("requirement"),
            consent: form.get("consent") === "on",
          }),
        },
      );
      const payload = await response.json() as { reference?: string; error?: string };

      if (!response.ok || !payload.reference) {
        setState({ status: "editing", error: payload.error ?? "We could not send that enquiry. Please try again." });
        return;
      }
      setState({ status: "sent", reference: payload.reference });
    } catch {
      setState({ status: "editing", error: "We could not send that enquiry right now. Please try again shortly." });
    }
  }

  if (state.status === "sent") {
    return (
      <div className={styles.form} role="status">
        <h4>Enquiry sent</h4>
        <p className={styles.sentBody}>
          Thank you. Your reference is <strong>{state.reference}</strong>. The Buildanta
          team will review your requirement and get in touch about the{" "}
          {selected.name} package with {professionalName}.
        </p>
        <button type="button" className={styles.secondary} onClick={onClose}>Close</button>
      </div>
    );
  }

  const sending = state.status === "sending";

  return (
    <form className={styles.form} onSubmit={submit} noValidate={false}>
      <h4>Request a detailed quotation</h4>
      <p className={styles.summary}>
        <strong>{selected.name}</strong> · {area.toLocaleString("en-IN")} sq ft
        {" "}({areaLabel(selected.rateBasis).replace(" (sq ft)", "").toLowerCase()})
        {" "}· indicative {formatRupees(estimate)}
      </p>

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Your name <i aria-hidden="true">*</i></span>
          <input name="customerName" required minLength={2} maxLength={160} autoComplete="name" className={styles.input} />
        </label>
        <label className={styles.field}>
          <span>Phone number <i aria-hidden="true">*</i></span>
          <input name="customerPhone" required minLength={7} maxLength={30} inputMode="tel" autoComplete="tel" className={styles.input} />
        </label>
        <label className={styles.field}>
          <span>Email <em>optional</em></span>
          <input name="customerEmail" type="email" maxLength={320} autoComplete="email" className={styles.input} />
        </label>
        <label className={styles.field}>
          <span>Area in Kanpur <em>optional</em></span>
          <input name="projectLocation" maxLength={200} placeholder="e.g. Kakadeo" className={styles.input} />
        </label>
        <label className={styles.field}>
          <span>Plot size <em>optional</em></span>
          <input name="plotDimensions" maxLength={120} placeholder="e.g. 20 x 45 ft" className={styles.input} />
        </label>
        <label className={styles.field}>
          <span>Floors <em>optional</em></span>
          <input name="floors" type="number" min={1} max={20} className={styles.input} />
        </label>
        <label className={styles.field}>
          <span>Construction type <em>optional</em></span>
          <input name="constructionType" maxLength={120} placeholder="e.g. New house" className={styles.input} />
        </label>
        <label className={styles.field}>
          <span>Expected start <em>optional</em></span>
          <input name="expectedStart" maxLength={120} placeholder="e.g. Within 3 months" className={styles.input} />
        </label>
      </div>

      <label className={styles.field}>
        <span>Anything else we should know <em>optional</em></span>
        <textarea name="requirement" maxLength={5000} rows={3} className={styles.input} />
      </label>

      <label className={styles.consent}>
        <input type="checkbox" name="consent" required />
        <span>
          I&rsquo;m happy for Buildanta to contact me about this enquiry. My details are
          shared with the Buildanta team, not published on the site.
        </span>
      </label>

      {state.status === "editing" && state.error
        ? <p className={styles.error} role="alert">{state.error}</p>
        : null}

      <div className={styles.actions}>
        <button type="submit" className={styles.submit} disabled={sending}>
          {sending ? "Sending..." : "Send enquiry"}
        </button>
        <button type="button" className={styles.secondary} onClick={onClose} disabled={sending}>Cancel</button>
      </div>

      <p className={styles.note}>
        This starts a conversation, not an order. The contractor prepares a detailed
        quotation after reviewing your drawings and site.
      </p>
    </form>
  );
}
