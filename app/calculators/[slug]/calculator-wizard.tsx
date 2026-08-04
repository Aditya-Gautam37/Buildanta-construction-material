"use client";

import { FormEvent, useRef, useState } from "react";
import type { PublicCalculator } from "../calculator-data";
import styles from "../calculator.module.css";

type EstimateItem = {
  id: string;
  outputKey: string;
  description: string;
  group: string;
  rawQuantity: string;
  wastageQuantity: string;
  purchaseQuantity: string;
  formulaUnitCode: string;
  unitCode: string;
  packageSize: string | null;
  availabilityLabel: string;
  leadTimeLabel: string | null;
  unitPrice: string | null;
  gstPercent: string | null;
  lineTotal: string | null;
  product: { id: string; name: string; brand: string; image: { src: string; alt: string } | null } | null;
  variant: { id: string; sku: string; unit: string; attributes: Record<string, unknown> } | null;
};

type Estimate = {
  reference: string;
  version: number;
  deliveryPincode: string;
  qualityTier: string;
  inputs: Record<string, unknown>;
  assumptions: string[];
  subtotal: string | null;
  gstTotal: string | null;
  deliveryTotal: string | null;
  indicativeTotal: string | null;
  expiresAt: string;
  expired: boolean;
  disclaimer: string;
  items: EstimateItem[];
  quotationReference: string | null;
};

function numeric(data: FormData, key: string) {
  return Number(data.get(key));
}

function optionalNumeric(data: FormData, key: string, fallback = 0) {
  const value = String(data.get(key) ?? "");
  return value ? Number(value) : fallback;
}

function buildInputs(type: string, data: FormData) {
  if (type === "BUILDING_BUDGET") {
    return {
      projectName: String(data.get("projectName")),
      siteLocation: String(data.get("siteLocation")),
      plotAreaSqFt: numeric(data, "plotAreaSqFt"),
      builtUpAreaSqFt: numeric(data, "builtUpAreaSqFt"),
      floors: numeric(data, "floors"),
      rooms: numeric(data, "rooms"),
      bathrooms: numeric(data, "bathrooms"),
      kitchens: numeric(data, "kitchens"),
      projectType: String(data.get("projectType")),
      structureSystem: String(data.get("structureSystem")),
      floorHeightFt: numeric(data, "floorHeightFt"),
      tileCoveragePercent: numeric(data, "tileCoveragePercent"),
      includeCeilingPaint: data.get("includeCeilingPaint") === "on",
      constructionScope: String(data.get("constructionScope")),
      wastagePercent: numeric(data, "wastagePercent"),
    };
  }

  const common = { quantity: numeric(data, "quantity"), wastagePercent: numeric(data, "wastagePercent") };
  if (type === "CEMENT_CONCRETE") return { ...common, componentType: String(data.get("componentType")), lengthM: numeric(data, "lengthM"), widthM: numeric(data, "widthM"), thicknessM: numeric(data, "thicknessM") };
  if (type === "BRICKS_BLOCKS") return { ...common, material: String(data.get("material")), wallLengthM: numeric(data, "wallLengthM"), wallHeightM: numeric(data, "wallHeightM"), wallThicknessM: numeric(data, "wallThicknessM"), openingsAreaM2: optionalNumeric(data, "openingsAreaM2") };
  if (type === "TILES_FLOORING") return { ...common, surfaceType: String(data.get("surfaceType")), lengthM: numeric(data, "lengthM"), widthM: numeric(data, "widthM"), openingsAreaM2: optionalNumeric(data, "openingsAreaM2"), tileLengthM: numeric(data, "tileLengthM"), tileWidthM: numeric(data, "tileWidthM") };
  return { ...common, roomLengthM: numeric(data, "roomLengthM"), roomWidthM: numeric(data, "roomWidthM"), wallHeightM: numeric(data, "wallHeightM"), openingsAreaM2: optionalNumeric(data, "openingsAreaM2"), includeCeiling: data.get("includeCeiling") === "on", paintCoats: numeric(data, "paintCoats"), primerCoats: numeric(data, "primerCoats"), puttyCoats: numeric(data, "puttyCoats") };
}

function scopeLabel(scope: string) {
  if (scope === "FOUNDATION") return "Foundation only";
  if (scope === "STRUCTURE") return "Foundation and structural shell";
  if (scope === "FULL_FINISH") return "Full finished planning";
  return "Project material plan";
}

function labelValue(value: unknown) {
  return String(value || "-").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function money(value: string | null) {
  return value == null ? "Request price" : `INR ${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function CalculatorWizard({ calculator }: { calculator: PublicCalculator }) {
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState("");
  const [quotationReference, setQuotationReference] = useState("");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [materialSearch, setMaterialSearch] = useState("");
  const submissionReference = useRef(`calc-${crypto.randomUUID()}`);
  const isBuildingPlan = calculator.type === "BUILDING_BUDGET";

  const groupedItems = estimate
    ? Array.from(estimate.items.reduce((groups, item) => {
        const group = item.group || "Material requirement";
        groups.set(group, [...(groups.get(group) || []), item]);
        return groups;
      }, new Map<string, EstimateItem[]>()))
    : [];

  const normalizedSearch = materialSearch.trim().toLowerCase();
  const visibleGroups = groupedItems
    .filter(([group]) => stageFilter === "ALL" || group === stageFilter)
    .map(([group, items]) => [group, items.filter((item) => {
      if (!normalizedSearch) return true;
      return [item.description, item.product?.name, item.product?.brand, item.variant?.sku]
        .some((value) => value?.toLowerCase().includes(normalizedSearch));
    })] as [string, EstimateItem[]])
    .filter(([, items]) => items.length > 0);
  const visibleLineCount = visibleGroups.reduce((total, [, items]) => total + items.length, 0);
  const pricedLineCount = estimate?.items.filter((item) => item.lineTotal != null).length || 0;

  async function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCalculating(true);
    setError("");
    setQuotationReference("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/calculators/${encodeURIComponent(calculator.slug)}/calculate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          deliveryPincode: String(data.get("deliveryPincode")),
          qualityTier: String(data.get("qualityTier")),
          sessionReference: submissionReference.current,
          inputs: buildInputs(calculator.type, data),
        }),
      });
      const body = await response.json() as Estimate & { message?: string; issues?: { message: string }[] };
      if (!response.ok) throw new Error(body.issues?.map((item) => item.message).join(" ") || body.message || "The estimate could not be calculated.");
      setEstimate(body);
      setStageFilter("ALL");
      setMaterialSearch("");
      submissionReference.current = `calc-${crypto.randomUUID()}`;
      setTimeout(() => document.getElementById("calculator-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The estimate could not be calculated.");
    } finally {
      setCalculating(false);
    }
  }

  async function requestQuotation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!estimate) return;
    setQuoting(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const requiredBy = String(data.get("requiredBy") ?? "");
    try {
      const response = await fetch(`/api/calculators/estimates/${encodeURIComponent(estimate.reference)}/quotation`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name")), email: String(data.get("email")), phone: String(data.get("phone")),
          company: String(data.get("company")) || undefined, requiredBy: requiredBy || undefined,
          projectType: String(data.get("quotationProjectType")) || undefined,
          customerNotes: String(data.get("customerNotes")) || undefined,
        }),
      });
      const body = await response.json() as { reference?: string; message?: string };
      if (!response.ok || !body.reference) throw new Error(body.message || "The quotation request could not be submitted.");
      setQuotationReference(body.reference);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The quotation request could not be submitted.");
    } finally {
      setQuoting(false);
    }
  }

  function downloadBoq() {
    if (!estimate) return;
    const rows = [
      ["Buildanta preliminary BOQ", estimate.reference],
      ["Project", estimate.inputs.projectName], ["Location", estimate.inputs.siteLocation],
      ["Scope", scopeLabel(String(estimate.inputs.constructionScope))], ["Total built-up area (sq ft)", estimate.inputs.totalBuiltUpAreaSqFt],
      ["Formula version", estimate.version], [],
      ["Stage", "Material", "Product", "Raw requirement", "Formula unit", "Wastage", "Purchase quantity", "Purchase unit", "Unit price", "GST %", "Line total", "Availability"],
      ...estimate.items.map((item) => [item.group, item.description, item.product?.name || "Staff selection required", item.rawQuantity, item.formulaUnitCode, item.wastageQuantity, item.purchaseQuantity, item.unitCode, item.unitPrice || "Request price", item.gstPercent || "", item.lineTotal || "", item.availabilityLabel]),
      [], ["Material subtotal", estimate.subtotal || "Pending"], ["GST snapshot", estimate.gstTotal || "Pending"], ["Indicative total", estimate.indicativeTotal || "Pending"],
      [], ["Important", estimate.disclaimer],
    ];
    const blob = new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${estimate.reference}-preliminary-boq.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function clearBoqFilters() {
    setStageFilter("ALL");
    setMaterialSearch("");
    requestAnimationFrame(() => document.getElementById("boq-stage-tabs")?.scrollTo({ left: 0, behavior: "smooth" }));
  }

  function calculateAllStages() {
    const scope = document.querySelector<HTMLSelectElement>('select[name="constructionScope"]');
    if (!scope) return;
    scope.value = "FULL_FINISH";
    scope.dispatchEvent(new Event("change", { bubbles: true }));
    scope.scrollIntoView({ behavior: "smooth", block: "center" });
    requestAnimationFrame(() => scope.form?.requestSubmit());
  }

  return <div className={`${styles.workspace} ${estimate && isBuildingPlan ? styles.workspaceWithBoq : ""}`}>
    <div className={styles.steps}><Step number="1" label={isBuildingPlan ? "Project profile and scope" : "Project measurements"} active /><Step number="2" label="Review refined BOQ" active={Boolean(estimate)} /><Step number="3" label="Request final quotation" active={Boolean(quotationReference)} /></div>
    <div className={`${styles.layout} ${estimate && isBuildingPlan ? styles.layoutWithBoq : ""}`}>
      <section className={`${styles.panel} ${styles.inputPanel}`}>
        <header className={styles.panelHeader}>
          <span className={styles.panelIcon} aria-hidden="true">01</span>
          <div><span className={styles.panelEyebrow}>{estimate && isBuildingPlan ? "Edit inputs" : "Project brief"}</span><h2>{estimate && isBuildingPlan ? "Adjust project details" : isBuildingPlan ? "Build your preliminary project BOQ" : "Enter project measurements"}</h2><p className={styles.muted}>{estimate && isBuildingPlan ? "Change any value and prepare the BOQ again to create a new estimate." : calculator.instructions}</p></div>
        </header>
        {isBuildingPlan && <div className={styles.scopeNote}><strong>Refined planning profile</strong><span>Project type, structural system, floor height and finish coverage now adjust the managed allowances. Final structural and MEP drawings remain mandatory.</span></div>}
        <form onSubmit={calculate} className={styles.formGrid}>
          <Field label="Delivery PIN code" name="deliveryPincode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} defaultValue="208001" />
          <Select label={isBuildingPlan ? "Material quality tier" : "Material preference"} name="qualityTier" options={[["STANDARD", "Standard"], ["ECONOMY", "Economy"], ["PREMIUM", "Premium"]]} />
          <CalculatorFields type={calculator.type} />
          <Field label="Wastage allowance (%)" name="wastagePercent" type="number" min="0" max="20" step="0.5" defaultValue="5" />
          <button className={`${styles.primary} ${styles.calculateButton} ${styles.fieldWide}`} disabled={calculating} aria-busy={calculating}><span>{calculating ? "Preparing your BOQ" : isBuildingPlan ? "Prepare refined BOQ" : "Calculate material requirement"}</span><b aria-hidden="true">{calculating ? "..." : "->"}</b></button>
        </form>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <p className={styles.disclaimer}>{calculator.disclaimer}</p>
      </section>

      <section className={`${styles.panel} ${styles.resultPanel} ${estimate && isBuildingPlan ? styles.boqPanel : ""} ${calculating ? styles.resultLoading : ""}`} id="calculator-results" aria-busy={calculating}>
        <div className={styles.resultHeader}>
          <div><span className={styles.boqKicker}>{isBuildingPlan ? "PRELIMINARY BILL OF QUANTITIES" : "MATERIAL ESTIMATE"}</span><h2>{isBuildingPlan ? "Project BOQ schedule" : "Your material estimate"}</h2><p className={styles.muted}>{estimate ? "A versioned material schedule connected to Buildanta Inventory." : "Complete the project brief to generate quantities, mapped products and indicative pricing."}</p></div>
          {estimate && <span className={styles.readyBadge}><i aria-hidden="true" /> Estimate ready</span>}
        </div>

        {estimate ? <>
          {isBuildingPlan && <>
            <div className={styles.documentBar}><div><span>BOQ reference</span><strong>{estimate.reference}</strong></div><div><span>Formula</span><strong>Version {estimate.version}</strong></div><div><span>Delivery area</span><strong>PIN {estimate.deliveryPincode}</strong></div><div><span>Valid until</span><strong>{new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(estimate.expiresAt))}</strong></div></div>
            <div className={styles.costOverview}>
              <div className={styles.costHero}><span>Indicative project total</span><strong>{money(estimate.indicativeTotal)}</strong><small>Materials and GST snapshot. Freight is confirmed in the final quotation.</small></div>
              <div className={styles.costMetrics}><div><span>Materials</span><strong>{money(estimate.subtotal)}</strong></div><div><span>GST snapshot</span><strong>{money(estimate.gstTotal)}</strong></div><div><span>Priced lines</span><strong>{pricedLineCount} of {estimate.items.length}</strong></div></div>
            </div>
            <dl className={styles.projectSummary}>
              <div><dt>Project</dt><dd>{String(estimate.inputs.projectName || "Project plan")}</dd><small>{String(estimate.inputs.siteLocation || "Location not supplied")}</small></div>
              <div><dt>Area and scope</dt><dd>{Number(estimate.inputs.totalBuiltUpAreaSqFt || 0).toLocaleString("en-IN")} sq ft</dd><small>{scopeLabel(String(estimate.inputs.constructionScope || ""))}</small></div>
              <div><dt>Build system</dt><dd>{labelValue(estimate.inputs.structureSystem)}</dd><small>{labelValue(estimate.inputs.projectType)} / {String(estimate.inputs.floorHeightFt || "-")} ft floor height</small></div>
              <div><dt>Material profile</dt><dd>{labelValue(estimate.qualityTier)}</dd><small>{String(estimate.inputs.tileCoveragePercent || "-")}% tile coverage</small></div>
            </dl>
            <div className={styles.boqToolbar}><div><strong>{estimate.items.length} material lines</strong><span>Inventory-mapped and grouped by construction stage</span></div><button type="button" onClick={() => window.print()}><span aria-hidden="true">P</span> Print</button><button type="button" onClick={downloadBoq}><span aria-hidden="true">D</span> CSV</button><button type="button" className={styles.toolbarPrimary} onClick={() => document.getElementById("quote-request")?.scrollIntoView({ behavior: "smooth" })}>Request quotation <b aria-hidden="true">-&gt;</b></button></div>
            <div className={styles.boqFilters}>
              <label className={styles.materialSearch}><span>Search BOQ</span><input value={materialSearch} onChange={(event) => setMaterialSearch(event.target.value)} placeholder="Material, brand or SKU" /><i aria-hidden="true">Q</i></label>
              {String(estimate.inputs.constructionScope) !== "FULL_FINISH" && <div className={styles.scopeCoverageNotice}><div><strong>{scopeLabel(String(estimate.inputs.constructionScope))} is selected</strong><span>{String(estimate.inputs.constructionScope) === "FOUNDATION" ? "This estimate contains only the foundation stage." : "This estimate contains foundation and structural-shell stages."} Choose the complete plan to include flooring, painting, electrical, plumbing, sanitaryware, doors and windows.</span></div><button type="button" onClick={calculateAllStages}>Calculate all stages <b>-&gt;</b></button></div>}
              <div className={styles.stageTabs} id="boq-stage-tabs" role="group" aria-label="Filter BOQ by construction stage">
                <button type="button" className={stageFilter === "ALL" ? styles.stageTabActive : ""} aria-pressed={stageFilter === "ALL"} onClick={() => setStageFilter("ALL")}><span>All stages</span><b>{estimate.items.length}</b></button>
                {groupedItems.map(([group, items], index) => <button type="button" key={group} className={stageFilter === group ? styles.stageTabActive : ""} aria-pressed={stageFilter === group} onClick={() => setStageFilter(group)}><i>{String(index + 1).padStart(2, "0")}</i><span>{group}</span><b>{items.length}</b></button>)}
              </div>
              <div className={styles.filterStatus}><span>Showing <strong>{visibleLineCount}</strong> of {estimate.items.length} lines</span>{(stageFilter !== "ALL" || materialSearch) && <button type="button" onClick={clearBoqFilters}>Clear filters</button>}</div>
            </div>
          </>}

          <div className={styles.boqTable} role="table" aria-label="Preliminary bill of quantities">
            <div className={styles.boqHead} role="row"><span>No.</span><span>Material and Inventory product</span><span>Calculated requirement</span><span>Purchase quantity</span><span>Rate</span><span>Amount</span></div>
            {visibleGroups.map(([group, items]) => {
              const groupTotal = items.every((item) => item.lineTotal != null) ? items.reduce((sum, item) => sum + Number(item.lineTotal), 0) : null;
              return <section className={styles.resultGroup} key={group}>
                <div className={styles.groupHeading}><span className={styles.stageNumber}>{String(groupedItems.findIndex(([name]) => name === group) + 1).padStart(2, "0")}</span><div><h3>{group}</h3><span>{items.length} material line{items.length === 1 ? "" : "s"}</span></div><strong>{groupTotal == null ? "Price confirmation required" : money(String(groupTotal))}</strong></div>
                {items.map((item) => <article className={styles.boqRow} role="row" key={item.id}>
                  <span className={styles.rowNumber}>{estimate.items.findIndex((entry) => entry.id === item.id) + 1}</span>
                  <div className={styles.materialCell}>{item.product?.image ? <img src={item.product.image.src} alt="" /> : <i>{item.description.slice(0, 1)}</i>}<div><strong>{item.product?.name || item.description}</strong><small>{item.product ? `${item.product.brand} / ${item.variant?.sku || "Mapped product"}` : "Staff product selection required"}</small><em><span aria-hidden="true" />{item.availabilityLabel}{item.leadTimeLabel ? ` - ${item.leadTimeLabel}` : ""}</em></div></div>
                  <div className={styles.quantityCell}><span className={styles.cellLabel}>Calculated</span><b>{Number(item.rawQuantity).toLocaleString("en-IN", { maximumFractionDigits: 2 })} {item.formulaUnitCode}</b><small>Includes +{Number(item.wastageQuantity).toLocaleString("en-IN", { maximumFractionDigits: 2 })} wastage</small></div>
                  <div className={styles.purchaseCell}><span className={styles.cellLabel}>Purchase</span><b>{Number(item.purchaseQuantity).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</b><small>{item.unitCode}{item.packageSize ? ` / pack ${item.packageSize}` : ""}</small></div>
                  <div className={styles.rateCell}><span className={styles.cellLabel}>Rate</span><b>{money(item.unitPrice)}</b><small>{item.gstPercent ? `${item.gstPercent}% GST` : "GST confirmed in quote"}</small></div>
                  <div className={styles.amountCell}><span className={styles.cellLabel}>Amount</span><strong>{money(item.lineTotal)}</strong></div>
                </article>)}
              </section>;
            })}
            {visibleGroups.length === 0 && <div className={styles.noResults}><span>0</span><h3>No BOQ lines match</h3><p>Try a different material name or clear the active stage filter.</p><button type="button" onClick={clearBoqFilters}>Show the complete BOQ</button></div>}
          </div>

          <details className={styles.assumptionDetails} open><summary><span>Calculation basis and professional checks</span><small>{estimate.assumptions.length} planning notes</small></summary><ul className={styles.assumptions}>{estimate.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul></details>

          <div className={styles.quote} id="quote-request">
            <div className={styles.quoteIntro}><span className={styles.quoteIcon} aria-hidden="true">BQ</span><div><span className={styles.panelEyebrow}>Next step</span><h3>Turn this BOQ into a commercial quotation</h3><p>Send all {estimate.items.length} mapped lines and this versioned calculation to the Buildanta Inventory team for price, freight and delivery confirmation.</p></div></div>
            {quotationReference ? <div className={styles.success}><strong>Quotation request received</strong><span>Reference: {quotationReference}</span><p>Buildanta Inventory will verify all BOQ lines and prepare the final quotation. When it is ready, open your customer account to review the total and book the complete BOQ.</p><div><a href="/account">Track and book this BOQ <b>-&gt;</b></a><a href="/signup">Create customer account</a></div></div> : <form onSubmit={requestQuotation} className={styles.formGrid}>
              <Field label="Your name" name="name" /><Field label="Phone" name="phone" type="tel" /><Field label="Email" name="email" type="email" className={styles.fieldWide} /><Field label="Company (optional)" name="company" required={false} /><Field label="Required by (optional)" name="requiredBy" type="date" required={false} />
              <Select label="Project type" name="quotationProjectType" options={[["Residential construction", "Residential construction"], ["Commercial project", "Commercial project"], ["Renovation", "Renovation"], ["Contractor requirement", "Contractor requirement"]]} />
              <Field label="Notes (optional)" name="customerNotes" required={false} /><button className={`${styles.primary} ${styles.calculateButton} ${styles.fieldWide}`} disabled={quoting} aria-busy={quoting}><span>{quoting ? "Sending to Inventory" : "Request quotation for complete BOQ"}</span><b aria-hidden="true">{quoting ? "..." : "->"}</b></button>
            </form>}
          </div>
          <p className={styles.disclaimer}>Estimate valid until {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(estimate.expiresAt))}. Final product selection, quantities, GST, freight, availability and delivery date are confirmed in the commercial quotation.</p>
        </> : <div className={styles.boqEmpty}><div className={styles.emptyDocument}><span>BOQ</span><i /><i /><i /><i /></div><span className={styles.panelEyebrow}>Your result will appear here</span><h3>One project brief. One clear material schedule.</h3><p>Buildanta will organize your requirements by construction stage, match Inventory products, and prepare an indicative cost snapshot.</p><div className={styles.emptyFlow}><span><b>01</b> Quantities</span><i /><span><b>02</b> Products</span><i /><span><b>03</b> Pricing</span></div></div>}
        {calculating && <div className={styles.loadingOverlay} role="status"><span className={styles.loadingMark} /><strong>Building your material schedule</strong><small>Calculating quantities and matching Inventory products...</small></div>}
      </section>
    </div>
  </div>;
}

function CalculatorFields({ type }: { type: string }) {
  if (type === "BUILDING_BUDGET") return <>
    <div className={`${styles.formSectionTitle} ${styles.fieldWide}`}><b>1</b><span>Project basics</span></div>
    <Field label="Project name" name="projectName" placeholder="Example: Singh family home" className={styles.fieldWide} />
    <Field label="Site location / city" name="siteLocation" placeholder="Example: Kanpur, Uttar Pradesh" className={styles.fieldWide} />
    <Select label="Project use" name="projectType" options={[["RESIDENTIAL", "Residential"], ["COMMERCIAL", "Commercial"]]} />
    <Select label="Structural system" name="structureSystem" options={[["RCC_FRAME", "RCC framed structure"], ["LOAD_BEARING", "Load-bearing masonry"]]} />
    <div className={`${styles.formSectionTitle} ${styles.fieldWide}`}><b>2</b><span>Area and accommodation</span></div>
    <Field label="Plot area (sq ft)" name="plotAreaSqFt" type="number" min="100" max="1000000" step="1" defaultValue="1500" />
    <Field label="Built-up area per floor (sq ft)" name="builtUpAreaSqFt" type="number" min="100" max="500000" step="1" defaultValue="1000" />
    <Field label="Number of floors" name="floors" type="number" min="1" max="20" step="1" defaultValue="1" />
    <Field label="Floor-to-floor height (ft)" name="floorHeightFt" type="number" min="8" max="20" step="0.5" defaultValue="10" />
    <Field label="Total rooms" name="rooms" type="number" min="1" max="200" step="1" defaultValue="4" />
    <Field label="Bathrooms" name="bathrooms" type="number" min="0" max="100" step="1" defaultValue="2" />
    <Field label="Kitchens" name="kitchens" type="number" min="0" max="20" step="1" defaultValue="1" />
    <Select label="Construction requirement" name="constructionScope" defaultValue="FULL_FINISH" options={[["FOUNDATION", "Foundation only"], ["STRUCTURE", "Foundation + structural shell"], ["FULL_FINISH", "Full finished material plan"]]} />
    <div className={`${styles.formSectionTitle} ${styles.fieldWide}`}><b>3</b><span>Finish assumptions</span><small>Applied only to the full-finish scope</small></div>
    <Field label="Tile coverage of built-up area (%)" name="tileCoveragePercent" type="number" min="0" max="100" step="1" defaultValue="70" />
    <label className={styles.check}><input name="includeCeilingPaint" type="checkbox" defaultChecked /> Include ceiling painting</label>
  </>;
  if (type === "CEMENT_CONCRETE") return <><Select label="Concrete component" name="componentType" options={[["SLAB", "Slab"], ["FOOTING", "Footing"], ["BEAM", "Beam"], ["COLUMN", "Column"], ["OTHER", "Other"]]} /><Field label="Number of identical components" name="quantity" type="number" min="1" step="1" defaultValue="1" /><Field label="Length (metres)" name="lengthM" type="number" min="0.01" step="0.01" defaultValue="5" /><Field label="Width (metres)" name="widthM" type="number" min="0.01" step="0.01" defaultValue="4" /><Field label="Thickness / depth (metres)" name="thicknessM" type="number" min="0.01" max="20" step="0.01" defaultValue="0.1" /></>;
  if (type === "BRICKS_BLOCKS") return <><Select label="Masonry material" name="material" options={[["BRICK", "Red clay brick"], ["AAC_BLOCK", "AAC block"]]} /><Field label="Number of identical walls" name="quantity" type="number" min="1" step="1" defaultValue="1" /><Field label="Wall length (metres)" name="wallLengthM" type="number" min="0.01" step="0.01" defaultValue="5" /><Field label="Wall height (metres)" name="wallHeightM" type="number" min="0.01" step="0.01" defaultValue="3" /><Field label="Wall thickness (metres)" name="wallThicknessM" type="number" min="0.01" max="2" step="0.005" defaultValue="0.115" /><Field label="Openings per wall (sq m)" name="openingsAreaM2" type="number" min="0" step="0.01" defaultValue="2" /></>;
  if (type === "TILES_FLOORING") return <><Select label="Surface" name="surfaceType" options={[["FLOOR", "Floor"], ["WALL", "Wall"]]} /><Field label="Number of identical surfaces" name="quantity" type="number" min="1" step="1" defaultValue="1" /><Field label="Surface length (metres)" name="lengthM" type="number" min="0.01" step="0.01" defaultValue="5" /><Field label="Surface width / height (metres)" name="widthM" type="number" min="0.01" step="0.01" defaultValue="4" /><Field label="Openings per surface (sq m)" name="openingsAreaM2" type="number" min="0" step="0.01" defaultValue="0" /><Field label="Tile length (metres)" name="tileLengthM" type="number" min="0.01" max="5" step="0.01" defaultValue="0.6" /><Field label="Tile width (metres)" name="tileWidthM" type="number" min="0.01" max="5" step="0.01" defaultValue="0.6" /></>;
  return <><Field label="Number of identical rooms" name="quantity" type="number" min="1" step="1" defaultValue="1" /><Field label="Room length (metres)" name="roomLengthM" type="number" min="0.01" step="0.01" defaultValue="5" /><Field label="Room width (metres)" name="roomWidthM" type="number" min="0.01" step="0.01" defaultValue="4" /><Field label="Wall height (metres)" name="wallHeightM" type="number" min="0.01" max="30" step="0.01" defaultValue="3" /><Field label="Doors and windows (sq m)" name="openingsAreaM2" type="number" min="0" step="0.01" defaultValue="4" /><Field label="Finish paint coats" name="paintCoats" type="number" min="1" max="5" step="1" defaultValue="2" /><Field label="Primer coats" name="primerCoats" type="number" min="0" max="3" step="1" defaultValue="1" /><Field label="Putty coats" name="puttyCoats" type="number" min="0" max="3" step="1" defaultValue="2" /><label className={styles.check}><input name="includeCeiling" type="checkbox" /> Include ceiling area</label></>;
}

function Step({ number, label, active = false }: { number: string; label: string; active?: boolean }) {
  return <span className={`${styles.step} ${active ? styles.stepActive : ""}`}><b>{number}</b>{label}</span>;
}

function Field({ label, className = "", required = true, ...props }: { label: string; className?: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className={`${styles.field} ${className}`}>{label}<input required={required} {...props} /></label>;
}

function Select({ label, name, options, defaultValue }: { label: string; name: string; options: [string, string][]; defaultValue?: string }) {
  return <label className={styles.field}>{label}<select name={name} required defaultValue={defaultValue}>{options.map(([value, text]) => <option value={value} key={value}>{text}</option>)}</select></label>;
}
