"use client";

import { useEffect, useRef, useState } from "react";
import { UiIcon } from "../ui-icon";
import { slugify } from "../data";
import { areaUnitLabel, estimateQuantity, packLabel } from "./quantity-calculator";
import styles from "./know-your-material.module.css";

type RelatedMaterial = {
  role: string;
  reason: string;
  sequenceNote?: string | null;
  relatedProduct: { id: string; name: string };
};

type KnowledgeData = {
  assistantAvailable?: boolean;
  summary: string | null;
  useCases: string[];
  suitableSurfaces: string[];
  unsuitableSurfaces: string[];
  preparationSteps: string[];
  applicationSteps: string[];
  sequenceNote: string | null;
  mixingInstructions: string | null;
  requiredTools: string[];
  coverageValue: string | number | null;
  coverageUnit: string | null;
  coverageConditions: string | null;
  numberOfCoats: number | null;
  dryingCuringInfo: string | null;
  safetyPrecautions: string[];
  commonMistakes: string[];
  professionalTips: string[];
  relatedMaterials: RelatedMaterial[];
};

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error"; message: string }
  | { status: "ready"; data: KnowledgeData };

// This panel renders inside the cart, so a surprise in the payload must never
// be able to throw during render and take the cart page down with it. Coercing
// the response into a known shape once, here, is cheaper and safer than
// defensive checks at every use site.
function list(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function normalize(raw: unknown): KnowledgeData {
  const input = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  return {
    assistantAvailable: input.assistantAvailable === true,
    summary: text(input.summary),
    useCases: list(input.useCases),
    suitableSurfaces: list(input.suitableSurfaces),
    unsuitableSurfaces: list(input.unsuitableSurfaces),
    preparationSteps: list(input.preparationSteps),
    applicationSteps: list(input.applicationSteps),
    sequenceNote: text(input.sequenceNote),
    mixingInstructions: text(input.mixingInstructions),
    requiredTools: list(input.requiredTools),
    coverageValue: typeof input.coverageValue === "string" || typeof input.coverageValue === "number" ? input.coverageValue : null,
    coverageUnit: text(input.coverageUnit),
    coverageConditions: text(input.coverageConditions),
    numberOfCoats: typeof input.numberOfCoats === "number" ? input.numberOfCoats : null,
    dryingCuringInfo: text(input.dryingCuringInfo),
    safetyPrecautions: list(input.safetyPrecautions),
    commonMistakes: list(input.commonMistakes),
    professionalTips: list(input.professionalTips),
    relatedMaterials: Array.isArray(input.relatedMaterials)
      ? input.relatedMaterials.flatMap((item) => {
          const entry = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
          const product = (typeof entry.relatedProduct === "object" && entry.relatedProduct !== null ? entry.relatedProduct : {}) as Record<string, unknown>;
          const name = text(product.name);
          if (!name) return [];
          return [{
            role: text(entry.role) ?? "OTHER",
            reason: text(entry.reason) ?? "",
            sequenceNote: text(entry.sequenceNote),
            relatedProduct: { id: text(product.id) ?? "", name },
          }];
        })
      : [],
  };
}

export function KnowYourMaterialTrigger({ productId, productName, compact = false }: { productId: string; productName: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch once per product, on first open. Deliberately keyed on a ref rather
  // than on `state` — depending on the state this effect sets would re-run it
  // immediately, and the cleanup would cancel the in-flight response.
  const fetchedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!open || fetchedFor.current === productId) return;
    fetchedFor.current = productId;
    let cancelled = false;
    setState({ status: "loading" });
    fetch(`/api/products/${encodeURIComponent(productId)}/material-knowledge`, { cache: "no-store" })
      .then(async (response) => {
        if (cancelled) return;
        if (response.status === 404) return setState({ status: "not-found" });
        if (!response.ok) return setState({ status: "error", message: "This could not be loaded right now." });
        const data = normalize(await response.json());
        setState({ status: "ready", data });
      })
      .catch(() => { if (!cancelled) setState({ status: "error", message: "This could not be loaded right now." }); });
    return () => { cancelled = true; };
  }, [open, productId]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return <>
    <button
      type="button"
      className={compact ? styles.triggerCompact : styles.trigger}
      onClick={() => setOpen(true)}
    >
      <UiIcon name="sparkles" size={compact ? 14 : 16} />
      Know Your Material {!compact && "with AI"}
    </button>

    {open && <div className={styles.overlay} role="presentation" onClick={() => setOpen(false)}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={`Know Your Material: ${productName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.panelHeader}>
          <div><p className={styles.eyebrow}>Know Your Material</p><h2>{productName}</h2></div>
          <button type="button" className={styles.closeButton} onClick={() => setOpen(false)} aria-label="Close"><UiIcon name="x" size={18} /></button>
        </header>

        <div className={styles.panelBody}>
          {state.status === "loading" && <p className={styles.muted}>Loading verified information...</p>}
          {state.status === "not-found" && <div className={styles.emptyState}>
            <UiIcon name="shield" size={22} />
            <p>We haven&apos;t published verified information for this product yet.</p>
            <p className={styles.muted}>Please check the label, technical data sheet, or ask our team before relying on coverage, mixing or safety details.</p>
          </div>}
          {state.status === "error" && <p className={styles.muted}>{state.message}</p>}
          {state.status === "ready" && <KnowledgeSections data={state.data} />}
        </div>

        {state.status === "ready" && state.data.assistantAvailable
          ? <AskBox productId={productId} />
          : <footer className={styles.panelFooter}>
              <p className={styles.chatNote}>
                {state.status === "ready"
                  ? "The question assistant is not switched on yet. The verified information above is still accurate."
                  : "Questions can be answered once verified information is published for this product."}
              </p>
            </footer>}
      </div>
    </div>}
  </>;
}

type Exchange = { question: string; answer: string };

function AskBox({ productId }: { productId: string }) {
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Exchange[]>([]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const asked = question.trim();
    if (!asked || pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/products/${encodeURIComponent(productId)}/material-knowledge/ask`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: asked }),
      });
      const payload = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !payload.answer) {
        setError(payload.error || "The assistant is unavailable right now.");
      } else {
        setHistory((current) => [...current, { question: asked, answer: payload.answer! }]);
        setQuestion("");
      }
    } catch {
      setError("The assistant is unavailable right now.");
    } finally {
      setPending(false);
    }
  }

  return <footer className={styles.panelFooter}>
    {history.length > 0 && <div className={styles.chatHistory}>
      {history.map((item, index) => <div key={index} className={styles.exchange}>
        <p className={styles.askedQuestion}>{item.question}</p>
        <p className={styles.answer}>{item.answer}</p>
      </div>)}
    </div>}

    <form onSubmit={submit}>
      <label className={styles.chatLabel} htmlFor={`ask-${productId}`}>Ask a question about this material</label>
      <div className={styles.chatInputRow}>
        <input
          id={`ask-${productId}`}
          type="text"
          value={question}
          maxLength={500}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="e.g. What surface can I use this on?"
          disabled={pending}
          className={styles.chatInput}
        />
        <button type="submit" disabled={pending || !question.trim()} className={styles.chatSend}>
          {pending ? "Asking..." : "Ask"}
        </button>
      </div>
    </form>

    {error && <p className={styles.chatError} role="alert">{error}</p>}
    <p className={styles.chatNote}>Answers use only what Buildanta has verified above — never a guess. Your question is sent to our AI provider to write the answer, and is not stored by Buildanta.</p>
  </footer>;
}

function KnowledgeSections({ data }: { data: KnowledgeData }) {
  const hasCoverage = data.coverageValue != null || data.numberOfCoats != null || data.dryingCuringInfo;
  return <div className={styles.sections}>
    {data.summary && <p className={styles.summary}>{data.summary}</p>}

    <ListSection title="Where it's used" items={data.useCases} />
    <ListSection title="Suitable surfaces" items={data.suitableSurfaces} />
    <ListSection title="Not suitable for" items={data.unsuitableSurfaces} />
    <ListSection title="Tools you'll need" items={data.requiredTools} />
    <ListSection title="Preparation steps" items={data.preparationSteps} ordered />
    <ListSection title="Application steps" items={data.applicationSteps} ordered />
    {data.sequenceNote && <Note title="Sequencing" text={data.sequenceNote} />}
    {data.mixingInstructions && <Note title="Mixing" text={data.mixingInstructions} />}

    {hasCoverage && <section className={styles.section}>
      <h3>Coverage and curing</h3>
      <dl className={styles.factList}>
        {data.coverageValue != null && <div><dt>Coverage</dt><dd>{data.coverageValue}{data.coverageUnit ? ` ${data.coverageUnit}` : ""}</dd></div>}
        {data.coverageConditions && <div><dt>Conditions</dt><dd>{data.coverageConditions}</dd></div>}
        {data.numberOfCoats != null && <div><dt>Coats</dt><dd>{data.numberOfCoats}</dd></div>}
        {data.dryingCuringInfo && <div><dt>Drying / curing</dt><dd>{data.dryingCuringInfo}</dd></div>}
      </dl>
    </section>}

    {data.coverageValue != null && <QuantityEstimator data={data} />}

    <ListSection title="Safety precautions" items={data.safetyPrecautions} tone="warning" />
    <ListSection title="Common mistakes to avoid" items={data.commonMistakes} />
    <ListSection title="Professional tips" items={data.professionalTips} tone="tip" />

    {data.relatedMaterials.length > 0 && <section className={styles.section}>
      <h3>Works well with</h3>
      <ul className={styles.relatedList}>{data.relatedMaterials.map((item, index) => <li key={index}>
        <a className={styles.relatedLink} href={`/products/${slugify(item.relatedProduct.name)}`}>
          {item.relatedProduct.name}
          <UiIcon name="arrow-right" size={14} />
        </a>
        <span className={styles.relatedRole}>{item.role.replaceAll("_", " ").toLowerCase()}</span>
        <p>{item.reason}</p>
        {item.sequenceNote && <p className={styles.relatedSequence}>{item.sequenceNote}</p>}
      </li>)}</ul>
      <p className={styles.relatedNote}>
        Buildanta has confirmed these pairings. Nothing is added to your cart automatically — open a product to check its price, pack size and availability first.
      </p>
    </section>}

    <p className={styles.disclaimer}>Only the information above has been verified by Buildanta. For anything not covered here, check the product label or technical data sheet, or speak with our team.</p>
  </div>;
}

// Deterministic: this is arithmetic in the browser, not an AI answer. The
// working is shown so a customer can check it against their own numbers.
function QuantityEstimator({ data }: { data: KnowledgeData }) {
  const [areaText, setAreaText] = useState("");
  const [wastagePercent, setWastagePercent] = useState(0);

  const areaUnit = areaUnitLabel(data.coverageUnit);
  const pack = packLabel(data.coverageUnit);
  const area = Number(areaText);
  const result = areaText.trim() === ""
    ? null
    : estimateQuantity(
        {
          coverageValue: data.coverageValue,
          coverageUnit: data.coverageUnit,
          coverageConditions: data.coverageConditions,
          numberOfCoats: data.numberOfCoats,
        },
        area,
        { wastagePercent },
      );

  return <section className={styles.section}>
    <h3>How much do I need?</h3>
    <div className={styles.calcRow}>
      <label className={styles.calcField}>
        <span>Area to cover ({areaUnit})</span>
        <input
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          value={areaText}
          onChange={(event) => setAreaText(event.target.value)}
          placeholder="e.g. 20"
          className={styles.calcInput}
        />
      </label>
      <label className={styles.calcField}>
        <span>Extra for wastage</span>
        <select
          value={wastagePercent}
          onChange={(event) => setWastagePercent(Number(event.target.value))}
          className={styles.calcInput}
        >
          <option value={0}>None</option>
          <option value={5}>5%</option>
          <option value={10}>10%</option>
        </select>
      </label>
    </div>

    {result?.status === "ok" && <div className={styles.calcResult}>
      <strong>{result.packs} {pack}{result.packs === 1 ? "" : "s"}</strong>
      <p className={styles.calcWorking}>
        {result.area} {areaUnit}
        {result.wastagePercent > 0 && ` + ${result.wastagePercent}% wastage`}
        {result.coats > 1 && ` × ${result.coats} coats`}
        {` ÷ ${result.coveragePerPack} ${areaUnit} per ${pack}`}
        {`, rounded up.`}
      </p>
      {result.conditions && <p className={styles.calcNote}>Verified coverage assumes: {result.conditions}.</p>}
      {result.wastagePercent > 0 && <p className={styles.calcNote}>The wastage allowance is your own choice, not a Buildanta-verified figure.</p>}
    </div>}

    {result?.status === "invalid" && <p className={styles.calcNote}>{result.reason}</p>}
  </section>;
}

function ListSection({ title, items, ordered = false, tone }: { title: string; items: string[]; ordered?: boolean; tone?: "warning" | "tip" }) {
  if (!items.length) return null;
  const List = ordered ? "ol" : "ul";
  return <section className={`${styles.section} ${tone ? styles[tone] : ""}`}>
    <h3>{title}</h3>
    <List className={styles.list}>{items.map((item, index) => <li key={index}>{item}</li>)}</List>
  </section>;
}

function Note({ title, text }: { title: string; text: string }) {
  return <section className={styles.section}><h3>{title}</h3><p>{text}</p></section>;
}
