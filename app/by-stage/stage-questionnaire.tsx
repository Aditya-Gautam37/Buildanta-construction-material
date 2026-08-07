"use client";

import { FormEvent, useMemo, useState } from "react";
import type { StoreProduct } from "../live-catalog";
import { buildStagePlan, getStageQuestionProfile, type StageAnswers } from "./stage-planner";
import styles from "./stage-questionnaire.module.css";

type EstimateItem = {
  id: string;
  outputKey: string;
  description: string;
  group: string;
  rawQuantity: string;
  purchaseQuantity: string;
  formulaUnitCode: string;
  unitCode: string;
  unitPrice: string | null;
  lineTotal: string | null;
  product: { name: string; brand: string } | null;
  variant: { sku: string } | null;
};

type Estimate = {
  reference: string;
  assumptions: string[];
  items: EstimateItem[];
};

// Maps a storefront stage to the real, versioned `building-material-budget-v3` calculator's
// output lines (see formula-registry.ts FormulaLine.group/outputKey). Stages with no entry here
// have no matching backend lines yet and keep using the local, unversioned estimate below —
// clearly labelled as such, not silently presented as equivalent.
const STAGE_CALCULATOR_CONFIG: Record<string, { matchesItem: (item: EstimateItem) => boolean; extraNote?: string }> = {
  "Foundation & Structure": { matchesItem: (item) => item.group === "Foundation and structure" },
  "Walls & Masonry": { matchesItem: (item) => item.group === "Structural shell" },
  "Bathroom & Plumbing": { matchesItem: (item) => item.outputKey.startsWith("plumbing_") || item.outputKey === "sanitary_fixture_set" },
  "Electrical & Wiring": { matchesItem: (item) => item.outputKey.startsWith("electrical_") },
  "Flooring & Tiling": { matchesItem: (item) => item.group === "Flooring and finishes" },
  "Paint & Finishing": { matchesItem: (item) => item.group === "Painting system" },
  "Doors, Windows, Railings & Glass": {
    matchesItem: (item) => item.group === "Doors and windows",
    extraNote: "Railings and glass are not yet covered by the versioned calculator. Request a manual quotation for those items.",
  },
};

function numberValue(data: FormData, key: string) {
  return Number(data.get(key) ?? 0);
}

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function moneyFromString(value: string | null) {
  return value == null ? null : money(Number(value));
}

export function StageQuestionnaire({ stage, products, deliveryPincode }: { stage: string; products: StoreProduct[]; deliveryPincode?: string }) {
  const profile = getStageQuestionProfile(stage);
  const calculatorConfig = STAGE_CALCULATOR_CONFIG[stage];

  // Gap-stage path: local, unversioned estimate (no matching backend lines yet).
  const [submitted, setSubmitted] = useState<StageAnswers | null>(null);
  const plan = useMemo(() => (submitted && !calculatorConfig ? buildStagePlan(stage, submitted, products) : null), [products, stage, submitted, calculatorConfig]);

  // Covered-stage path: real call to the versioned Buildanta calculator.
  const [calculating, setCalculating] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [calcError, setCalcError] = useState("");

  async function prepareResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const answers: StageAnswers = {
      builtUpAreaSqFt: numberValue(data, "builtUpAreaSqFt"),
      floors: numberValue(data, "floors"),
      rooms: numberValue(data, "rooms"),
      bathrooms: numberValue(data, "bathrooms"),
      kitchens: numberValue(data, "kitchens"),
      projectType: String(data.get("projectType")) as StageAnswers["projectType"],
      structureSystem: String(data.get("structureSystem")) as StageAnswers["structureSystem"],
      qualityTier: String(data.get("qualityTier")) as StageAnswers["qualityTier"],
      coveragePercent: numberValue(data, "coveragePercent"),
      wastagePercent: numberValue(data, "wastagePercent"),
    };

    if (!calculatorConfig) {
      setSubmitted(answers);
      requestAnimationFrame(() => document.getElementById("stage-plan-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
      return;
    }

    setCalculating(true);
    setCalcError("");
    setEstimate(null);
    try {
      const bedrooms = Math.max(1, answers.rooms - answers.bathrooms - answers.kitchens);
      const roomBreakdown = [
        { roomType: "BEDROOM", quantity: bedrooms },
        ...(answers.bathrooms > 0 ? [{ roomType: "BATHROOM", quantity: answers.bathrooms }] : []),
        ...(answers.kitchens > 0 ? [{ roomType: "KITCHEN", quantity: answers.kitchens }] : []),
      ];
      const plotAreaSqFt = Math.min(1_000_000, Math.max(answers.builtUpAreaSqFt, Math.round((answers.builtUpAreaSqFt / answers.coveragePercent) * 100)));
      const response = await fetch("/api/calculators/complete-construction-material/calculate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          deliveryPincode: /^\d{6}$/.test(deliveryPincode ?? "") ? deliveryPincode : "208001",
          qualityTier: answers.qualityTier,
          sessionReference: `stage-${crypto.randomUUID()}`,
          inputs: {
            projectName: `${stage} plan`,
            siteLocation: "Kanpur",
            plotAreaSqFt,
            builtUpAreaSqFt: answers.builtUpAreaSqFt,
            floors: answers.floors,
            rooms: answers.rooms,
            bathrooms: answers.bathrooms,
            kitchens: answers.kitchens,
            projectType: answers.projectType,
            structureSystem: answers.structureSystem,
            floorHeightFt: 10,
            tileCoveragePercent: stage === "Flooring & Tiling" ? answers.coveragePercent : 70,
            includeCeilingPaint: false,
            constructionScope: "FULL_FINISH",
            wastagePercent: answers.wastagePercent,
            roomBreakdown,
          },
        }),
      });
      const body = await response.json() as Estimate & { message?: string; issues?: { message: string }[] };
      if (!response.ok) throw new Error(body.issues?.map((item) => item.message).join(" ") || body.message || "The estimate could not be calculated.");
      setEstimate(body);
      requestAnimationFrame(() => document.getElementById("stage-plan-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (reason) {
      setCalcError(reason instanceof Error ? reason.message : "The estimate could not be calculated.");
    } finally {
      setCalculating(false);
    }
  }

  const visibleItems = useMemo(() => (estimate && calculatorConfig ? estimate.items.filter(calculatorConfig.matchesItem) : []), [estimate, calculatorConfig]);
  const mappedCount = visibleItems.filter((item) => item.product != null).length;
  const visibleTotal = visibleItems.length && visibleItems.every((item) => item.lineTotal != null)
    ? visibleItems.reduce((sum, item) => sum + Number(item.lineTotal), 0)
    : null;

  return <section className={styles.planner} aria-labelledby="stage-questionnaire-title">
    <div className={styles.heading}>
      <div>
        <span>{calculatorConfig ? "STAGE ESTIMATE" : "LOCAL PRELIMINARY ESTIMATE (OPTIONAL)"}</span>
        <h2 id="stage-questionnaire-title">Answer a few questions for {stage}</h2>
        <p>{calculatorConfig
          ? <>Uses Buildanta&apos;s versioned material calculator, scoped to {stage}. This is a short, stage-only view — for a full house-wide plan across every stage, use <a href="/calculators">Material Calculators</a>.</>
          : <>This stage doesn&apos;t have a versioned Buildanta calculation yet, so this is a local, unofficial estimate for quick planning only. For a full house-wide plan, use <a href="/calculators">Material Calculators</a>.</>}
        </p>
      </div>
      <div className={styles.headingActions}>
        <b>{products.length} mapped products</b>
        <a className={styles.skipLink} href="#product-results">Skip to products ↓</a>
      </div>
    </div>

    <form className={styles.form} onSubmit={prepareResult}>
      <label><span>Built-up area per floor</span><div><input name="builtUpAreaSqFt" type="number" min="100" max="1000000" defaultValue="1000" required /><small>sq ft</small></div></label>
      <label><span>Number of floors</span><input name="floors" type="number" min="1" max="100" defaultValue="1" required /></label>
      <label><span>Rooms</span><input name="rooms" type="number" min="0" max="1000" defaultValue="4" required /></label>
      <label><span>Bathrooms</span><input name="bathrooms" type="number" min="0" max="500" defaultValue="2" required /></label>
      <label><span>Kitchens</span><input name="kitchens" type="number" min="0" max="100" defaultValue="1" required /></label>
      <label><span>Project type</span><select name="projectType" defaultValue="RESIDENTIAL"><option value="RESIDENTIAL">Residential</option><option value="COMMERCIAL">Commercial</option></select></label>
      <label><span>Structural system</span><select name="structureSystem" defaultValue="RCC_FRAME"><option value="RCC_FRAME">RCC frame</option><option value="LOAD_BEARING">Load bearing</option></select></label>
      <label><span>Material quality</span><select name="qualityTier" defaultValue="STANDARD"><option value="ECONOMY">Economy</option><option value="STANDARD">Standard</option><option value="PREMIUM">Premium</option></select></label>
      <label className={styles.coverage}><span>{profile.coverageLabel}</span><div><input name="coveragePercent" type="number" min="1" max="100" defaultValue={profile.defaultCoverage} required /><small>%</small></div><em>{profile.coverageHelp}</em></label>
      <label><span>Wastage allowance</span><div><input name="wastagePercent" type="number" min="0" max="20" step="0.5" defaultValue="5" required /><small>%</small></div></label>
      <button type="submit" disabled={calculating}>{calculating ? "Calculating…" : `Prepare ${stage} result`} <b aria-hidden="true">→</b></button>
    </form>
    {calcError && <p className={styles.formError} role="alert">{calcError}</p>}

    {calculatorConfig ? (estimate ? <div className={styles.results} id="stage-plan-results">
      <div className={styles.resultSummary}>
        <div><span>Calculation basis</span><strong>{stage}</strong></div>
        <div><span>Material lines</span><strong>{visibleItems.length}</strong></div>
        <div><span>Catalogue mapped</span><strong>{mappedCount} of {visibleItems.length}</strong></div>
        <div className={styles.total}><span>Mapped-product total</span><strong>{visibleTotal != null ? money(visibleTotal) : "Quotation required"}</strong></div>
      </div>

      <div className={styles.table} role="table" aria-label={`${stage} calculated material result`}>
        <div className={styles.tableHead} role="row"><span>Material</span><span>Calculated need</span><span>Purchase quantity</span><span>Product / rate</span><span>Indicative amount</span></div>
        {visibleItems.length === 0 && <div className={styles.tableRow} role="row"><div><strong>No lines yet for this stage</strong><small>Add a room breakdown or explicit point/fixture schedule to see quantities here.</small></div><span>—</span><span>—</span><div>—</div><strong>—</strong></div>}
        {visibleItems.map((item) => <div className={styles.tableRow} role="row" key={item.id}>
          <div><strong>{item.description}</strong><small>{item.rawQuantity} {item.formulaUnitCode} calculated</small></div>
          <span>{Number(item.rawQuantity).toLocaleString("en-IN")} {item.formulaUnitCode}</span>
          <span><b>{Number(item.purchaseQuantity).toLocaleString("en-IN")}</b> {item.unitCode}</span>
          <div>{item.product ? <><strong>{item.product.name}</strong><small>{item.product.brand} / {item.variant?.sku || "Mapped product"}</small></> : <><b>Mapping pending</b><small>Add this material from Inventory to price it automatically.</small></>}</div>
          <strong>{moneyFromString(item.lineTotal) ?? "Not priced"}</strong>
        </div>)}
      </div>

      <div className={styles.assumptions}>
        <div><strong>Calculation basis and professional checks</strong>{estimate.assumptions.map((assumption) => <span key={assumption}>{assumption}</span>)}{calculatorConfig.extraNote && <span>{calculatorConfig.extraNote}</span>}</div>
        <a href={`/bulk-quotes?stage=${encodeURIComponent(stage)}`}>Request a verified quotation →</a>
      </div>
    </div> : <div className={styles.empty}><span>01</span><div><strong>Your stage result will appear here</strong><p>Complete the questions above. No sign-in is required to see the calculated schedule.</p></div></div>)
    : (plan ? <div className={styles.results} id="stage-plan-results">
      <div className={styles.resultSummary}>
        <div><span>Planning basis</span><strong>{plan.basisAreaSqFt.toLocaleString("en-IN")} sq ft</strong></div>
        <div><span>Material lines</span><strong>{plan.totalLines}</strong></div>
        <div><span>Catalogue mapped</span><strong>{plan.mappedLines} of {plan.totalLines}</strong></div>
        <div className={styles.total}><span>Mapped-product total</span><strong>{plan.indicativeTotal ? money(plan.indicativeTotal) : "Quotation required"}</strong></div>
      </div>

      <div className={styles.table} role="table" aria-label={`${stage} preliminary material result`}>
        <div className={styles.tableHead} role="row"><span>Material</span><span>Calculated need</span><span>Purchase quantity</span><span>Product / rate</span><span>Indicative amount</span></div>
        {plan.lines.map((line) => <div className={styles.tableRow} role="row" key={line.key}>
          <div><strong>{line.material}</strong><small>{line.note}</small></div>
          <span>{line.requirement.toLocaleString("en-IN")} {line.unit}</span>
          <span><b>{line.purchaseQuantity.toLocaleString("en-IN")}</b> {line.unit}</span>
          <div>{line.product ? <><a href={`/products/${line.product.slug}`}>{line.product.name}</a><small>{line.product.brand} · {line.planningRate ? `${money(line.planningRate)} planning rate` : "Request price"}</small></> : <><b>Mapping pending</b><small>Add this material from Inventory to price it automatically.</small></>}</div>
          <strong>{line.lineTotal == null ? "Not priced" : money(line.lineTotal)}</strong>
        </div>)}
      </div>

      <div className={styles.assumptions}><div><strong>Local planning assumptions (unversioned)</strong>{plan.assumptions.map((assumption) => <span key={assumption}>{assumption}</span>)}</div><a href={`/bulk-quotes?stage=${encodeURIComponent(stage)}`}>Request a verified quotation →</a></div>
    </div> : <div className={styles.empty}><span>01</span><div><strong>Your stage result will appear here</strong><p>Complete the questions above. No sign-in is required to see the preliminary schedule.</p></div></div>)}
  </section>;
}
