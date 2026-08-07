"use client";

import { FormEvent, useMemo, useState } from "react";
import type { StoreProduct } from "../live-catalog";
import { buildStagePlan, getStageQuestionProfile, type StageAnswers } from "./stage-planner";
import styles from "./stage-questionnaire.module.css";

function numberValue(data: FormData, key: string) {
  return Number(data.get(key) ?? 0);
}

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function StageQuestionnaire({ stage, products }: { stage: string; products: StoreProduct[] }) {
  const profile = getStageQuestionProfile(stage);
  const [submitted, setSubmitted] = useState<StageAnswers | null>(null);
  const plan = useMemo(() => submitted ? buildStagePlan(stage, submitted, products) : null, [products, stage, submitted]);

  function preparePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSubmitted({
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
    });
    requestAnimationFrame(() => document.getElementById("stage-plan-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return <section className={styles.planner} aria-labelledby="stage-questionnaire-title">
    <div className={styles.heading}>
      <div><span>QUICK STAGE ESTIMATE (OPTIONAL)</span><h2 id="stage-questionnaire-title">Answer a few questions for {stage}</h2><p>Get a preliminary material schedule with live catalogue products, purchase quantities and indicative Kanpur pricing. This is a short, stage-only estimate — for a full house-wide plan across every stage, use <a href="/calculators">Material Calculators</a>.</p></div>
      <div className={styles.headingActions}>
        <b>{products.length} mapped products</b>
        <a className={styles.skipLink} href="#product-results">Skip to products ↓</a>
      </div>
    </div>

    <form className={styles.form} onSubmit={preparePlan}>
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
      <button type="submit">Prepare {stage} result <b aria-hidden="true">→</b></button>
    </form>

    {plan ? <div className={styles.results} id="stage-plan-results">
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

      <div className={styles.assumptions}><div><strong>Planning assumptions</strong>{plan.assumptions.map((assumption) => <span key={assumption}>{assumption}</span>)}</div><a href={`/bulk-quotes?stage=${encodeURIComponent(stage)}`}>Request a verified quotation →</a></div>
    </div> : <div className={styles.empty}><span>01</span><div><strong>Your stage result will appear here</strong><p>Complete the questions above. No sign-in is required to see the preliminary schedule.</p></div></div>}
  </section>;
}
