"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import type { StoreProduct } from "../live-catalog";
import { buildStagePlan, getStageQuestionProfile, type StageAnswers } from "./stage-planner";
import styles from "./stage-questionnaire.module.css";

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
  unitPrice: string | null;
  lineTotal: string | null;
  product: { name: string; brand: string } | null;
  variant: { sku: string } | null;
};

type Estimate = {
  reference: string;
  calculator: { name: string; slug: string };
  version: number;
  disclaimer: string;
  assumptions: string[];
  items: EstimateItem[];
};

type PlanningMode = "CONCEPT" | "DETAILED" | "DRAWING_BASED";
type PlanStatus = "READY" | "IN_PROGRESS" | "NEED_HELP" | "SKIP";

type WizardState = {
  deliveryPincode: string;
  planningMode: PlanningMode;
  planStatus: PlanStatus;
  plotAreaSqFt: number;
  builtUpAreaSqFt: number;
  floors: number;
  floorHeightFt: number;
  basement: boolean;
  bedrooms: number;
  livingRooms: number;
  kitchens: number;
  bathrooms: number;
  diningRooms: number;
  balconies: number;
  utilityRooms: number;
  studies: number;
  pujaRooms: number;
  storageRooms: number;
  garages: number;
  servantRooms: number;
  halls: number;
  projectType: StageAnswers["projectType"];
  structureSystem: StageAnswers["structureSystem"];
  qualityTier: StageAnswers["qualityTier"];
  coveragePercent: number;
  wastagePercent: number;
};

type RoomKey = "bedrooms" | "livingRooms" | "kitchens" | "bathrooms" | "diningRooms" | "balconies" | "utilityRooms" | "studies" | "pujaRooms" | "storageRooms" | "garages" | "servantRooms" | "halls";

const SHARED_PROJECT_KEY = "buildanta-stage-project-v2";

const ROOM_OPTIONS: Array<{ key: RoomKey; label: string; image: string; roomType: string }> = [
  { key: "livingRooms", label: "Living room", image: "/livingroom.jpg", roomType: "LIVING_ROOM" },
  { key: "kitchens", label: "Kitchen", image: "/kitchen.jpg", roomType: "KITCHEN" },
  { key: "bedrooms", label: "Bedroom", image: "/bedroom.jpg", roomType: "BEDROOM" },
  { key: "bathrooms", label: "Bathroom", image: "/bathroom.jpg", roomType: "BATHROOM" },
  { key: "diningRooms", label: "Dining area", image: "/livingroom.jpg", roomType: "DINING_ROOM" },
  { key: "balconies", label: "Balcony", image: "/homepage_img.png", roomType: "BALCONY" },
  { key: "utilityRooms", label: "Utility", image: "/kitchen.jpg", roomType: "UTILITY" },
  { key: "studies", label: "Study", image: "/bedroom.jpg", roomType: "STUDY" },
  { key: "pujaRooms", label: "Puja room", image: "/homepage_img.png", roomType: "OTHER" },
  { key: "storageRooms", label: "Storage", image: "/homepage_img.png", roomType: "OTHER" },
  { key: "garages", label: "Garage", image: "/homepage_img.png", roomType: "GARAGE" },
  { key: "servantRooms", label: "Servant room", image: "/bedroom.jpg", roomType: "BEDROOM" },
  { key: "halls", label: "Hall", image: "/livingroom.jpg", roomType: "LIVING_ROOM" },
];

const QUALITY_OPTIONS: Array<{ value: StageAnswers["qualityTier"]; title: string; kicker: string; details: string[] }> = [
  { value: "ECONOMY", title: "Economy", kicker: "Reliable essentials", details: ["Certified structural products", "Value tiles and finishes", "Practical fixtures and lighting"] },
  { value: "STANDARD", title: "Standard", kicker: "Balanced performance", details: ["Branded project materials", "Vitrified finishes", "Durable fittings and washable paint"] },
  { value: "PREMIUM", title: "Premium", kicker: "Design-led selection", details: ["Premium compatible products", "Designer surfaces and bathware", "Performance lighting and hardware"] },
];

const PLAN_OPTIONS: Array<{ value: PlanStatus; title: string; detail: string }> = [
  { value: "READY", title: "My building plan is ready", detail: "Use your drawings during quotation verification." },
  { value: "IN_PROGRESS", title: "My plan is in progress", detail: "Start with a preliminary concept estimate." },
  { value: "NEED_HELP", title: "I need professional help", detail: "Buildanta can connect you with a professional." },
  { value: "SKIP", title: "I do not have a plan yet", detail: "Continue with standard planning assumptions." },
];

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

const STEP_TITLES = ["Project readiness", "Area and floors", "Space requirements", "Material preference", "Review and calculate"];

function defaultWizard(profileCoverage: number, deliveryPincode?: string): WizardState {
  return {
    deliveryPincode: /^\d{6}$/.test(deliveryPincode ?? "") ? deliveryPincode! : "208001",
    planningMode: "CONCEPT",
    planStatus: "IN_PROGRESS",
    plotAreaSqFt: 1200,
    builtUpAreaSqFt: 1000,
    floors: 1,
    floorHeightFt: 10,
    basement: false,
    bedrooms: 2,
    livingRooms: 1,
    kitchens: 1,
    bathrooms: 2,
    diningRooms: 1,
    balconies: 1,
    utilityRooms: 0,
    studies: 0,
    pujaRooms: 0,
    storageRooms: 0,
    garages: 0,
    servantRooms: 0,
    halls: 0,
    projectType: "RESIDENTIAL",
    structureSystem: "RCC_FRAME",
    qualityTier: "STANDARD",
    coveragePercent: profileCoverage,
    wastagePercent: 5,
  };
}

function initialWizard(profileCoverage: number, deliveryPincode?: string): WizardState {
  const fallback = defaultWizard(profileCoverage, deliveryPincode);
  if (typeof sessionStorage === "undefined") return fallback;
  try {
    const saved = sessionStorage.getItem(SHARED_PROJECT_KEY);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved) as Partial<WizardState>;
    return {
      ...fallback,
      ...parsed,
      coveragePercent: profileCoverage,
      deliveryPincode: /^\d{6}$/.test(deliveryPincode ?? "") ? deliveryPincode! : parsed.deliveryPincode ?? fallback.deliveryPincode,
    };
  } catch {
    return fallback;
  }
}

function makeSessionReference(stage: string) {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `stage-${stage.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${suffix}`;
}

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function moneyFromString(value: string | null) {
  return value == null ? null : money(Number(value));
}

function roomCount(state: WizardState) {
  return ROOM_OPTIONS.reduce((total, room) => total + state[room.key], 0);
}

function stageAnswers(state: WizardState): StageAnswers {
  return {
    builtUpAreaSqFt: state.builtUpAreaSqFt,
    floors: state.floors,
    rooms: Math.max(1, roomCount(state) - state.bathrooms - state.kitchens),
    bathrooms: state.bathrooms,
    kitchens: state.kitchens,
    projectType: state.projectType,
    structureSystem: state.structureSystem,
    qualityTier: state.qualityTier,
    coveragePercent: state.coveragePercent,
    wastagePercent: state.wastagePercent,
  };
}

function roomBreakdown(state: WizardState) {
  const grouped = new Map<string, number>();
  for (const room of ROOM_OPTIONS) {
    const quantity = state[room.key];
    if (quantity > 0) grouped.set(room.roomType, (grouped.get(room.roomType) ?? 0) + quantity);
  }
  return Array.from(grouped, ([roomType, quantity]) => ({ roomType, quantity }));
}

export function StageQuestionnaire({ stage, products, deliveryPincode }: { stage: string; products: StoreProduct[]; deliveryPincode?: string }) {
  const profile = getStageQuestionProfile(stage);
  const calculatorConfig = STAGE_CALCULATOR_CONFIG[stage];
  const [step, setStep] = useState(0);
  const [wizard, setWizard] = useState<WizardState>(() => initialWizard(profile.defaultCoverage, deliveryPincode));
  const [stepError, setStepError] = useState("");
  const [submitted, setSubmitted] = useState<StageAnswers | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [calcError, setCalcError] = useState("");
  const sessionReference = useRef(makeSessionReference(stage));

  const plan = useMemo(() => (submitted && !calculatorConfig ? buildStagePlan(stage, submitted, products) : null), [products, stage, submitted, calculatorConfig]);
  const stageImage = products.find((product) => product.image)?.image || "/homepage_img.png";

  useEffect(() => {
    try {
      const shared: Partial<WizardState> = { ...wizard };
      delete shared.coveragePercent;
      sessionStorage.setItem(SHARED_PROJECT_KEY, JSON.stringify(shared));
    } catch {
      // The wizard remains fully usable when storage is blocked.
    }
  }, [wizard]);

  function updateField<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setWizard((current) => ({ ...current, [key]: value }));
    setStepError("");
    setCalcError("");
    setEstimate(null);
    setSubmitted(null);
    sessionReference.current = makeSessionReference(stage);
  }

  function validateStep(index: number) {
    if (index === 0 && !/^\d{6}$/.test(wizard.deliveryPincode)) return "Enter a valid 6-digit delivery PIN code.";
    if (index === 1 && (wizard.builtUpAreaSqFt < 100 || wizard.builtUpAreaSqFt > 1_000_000)) return "Built-up area must be between 100 and 10,00,000 sq ft.";
    if (index === 1 && wizard.plotAreaSqFt < wizard.builtUpAreaSqFt) return "Plot area cannot be smaller than the built-up area per floor.";
    if (index === 1 && (wizard.floors < 1 || wizard.floors > 100)) return "Choose between 1 and 100 floors.";
    if (index === 2 && roomCount(wizard) < 1) return "Add at least one room or project space.";
    if (index === 4 && (wizard.coveragePercent < 1 || wizard.coveragePercent > 100)) return "Stage coverage must be between 1% and 100%.";
    if (index === 4 && (wizard.wastagePercent < 0 || wizard.wastagePercent > 20)) return "Wastage must be between 0% and 20%.";
    return "";
  }

  function nextStep() {
    const error = validateStep(step);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError("");
    setStep((current) => Math.min(STEP_TITLES.length - 1, current + 1));
  }

  function previousStep() {
    setStepError("");
    setStep((current) => Math.max(0, current - 1));
  }

  async function prepareResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateStep(4);
    if (validationError) {
      setStepError(validationError);
      return;
    }

    const answers = stageAnswers(wizard);
    if (!calculatorConfig) {
      setSubmitted(answers);
      requestAnimationFrame(() => document.getElementById("stage-plan-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
      return;
    }

    setCalculating(true);
    setCalcError("");
    setEstimate(null);
    try {
      const response = await fetch("/api/calculators/complete-construction-material/calculate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          deliveryPincode: wizard.deliveryPincode,
          qualityTier: wizard.qualityTier,
          sessionReference: sessionReference.current,
          inputs: {
            projectName: `${stage} plan`,
            siteLocation: `PIN ${wizard.deliveryPincode}`,
            plotAreaSqFt: wizard.plotAreaSqFt,
            builtUpAreaSqFt: wizard.builtUpAreaSqFt,
            floors: wizard.floors,
            rooms: answers.rooms,
            bathrooms: wizard.bathrooms,
            kitchens: wizard.kitchens,
            projectType: wizard.projectType,
            structureSystem: wizard.structureSystem,
            floorHeightFt: wizard.floorHeightFt,
            tileCoveragePercent: stage === "Flooring & Tiling" ? wizard.coveragePercent : 70,
            includeCeilingPaint: false,
            constructionScope: "FULL_FINISH",
            wastagePercent: wizard.wastagePercent,
            roomBreakdown: roomBreakdown(wizard),
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
        <span>{calculatorConfig ? "GUIDED STAGE ESTIMATOR" : "PRELIMINARY STAGE PLANNER"}</span>
        <h2 id="stage-questionnaire-title">Plan {stage}, one simple step at a time</h2>
        <p>{calculatorConfig
          ? <>Your answers are calculated by Buildanta&apos;s versioned material engine. Products and prices are matched only after quantities are prepared.</>
          : <>This stage still uses a clearly labelled local planning allowance while its versioned formula is being completed.</>}
        </p>
      </div>
      <div className={styles.headingActions}>
        <b>{products.length} live stage products</b>
        <a className={styles.skipLink} href="#product-results">Exit to products ↓</a>
      </div>
    </div>

    <form className={styles.wizard} onSubmit={prepareResult}>
      <div className={styles.progressHeader}>
        <div><strong>Step {step + 1} of {STEP_TITLES.length}</strong><span>{STEP_TITLES[step]}</span></div>
        <ol aria-label="Questionnaire progress">
          {STEP_TITLES.map((title, index) => <li className={index < step ? styles.complete : index === step ? styles.current : ""} key={title} aria-current={index === step ? "step" : undefined}><span>{index + 1}</span><small>{title}</small></li>)}
        </ol>
      </div>

      <div className={`${styles.wizardBody} ${step === 2 || step === 3 || step === 4 ? styles.wideStep : ""}`}>
        {step < 2 && <aside className={styles.visualPanel}>
          <img src={stageImage} alt="" />
          <div><span>{stage}</span><strong>{step === 0 ? "Start with what you already know." : `${wizard.builtUpAreaSqFt.toLocaleString("en-IN")} sq ft per floor`}</strong><small>Your answers are saved in this browser session.</small></div>
        </aside>}

        <div className={styles.questionPanel}>
          {step === 0 && <fieldset>
            <legend>Tell us how far your project has progressed</legend>
            <p>This helps us label the estimate correctly and identify where professional verification is required.</p>
            <label className={styles.pinField}><span>Delivery PIN code</span><input aria-label="Delivery PIN code" inputMode="numeric" maxLength={6} value={wizard.deliveryPincode} onChange={(event) => updateField("deliveryPincode", event.target.value.replace(/\D/g, ""))} /><small>Used only for product availability and delivery context.</small></label>
            <div className={styles.modeRow} aria-label="Planning mode">
              {(["CONCEPT", "DETAILED", "DRAWING_BASED"] as PlanningMode[]).map((mode) => <button type="button" className={wizard.planningMode === mode ? styles.selected : ""} onClick={() => updateField("planningMode", mode)} key={mode}>{mode === "CONCEPT" ? "Concept estimate" : mode === "DETAILED" ? "Detailed estimate" : "Drawing based"}</button>)}
            </div>
            <div className={styles.planOptions}>
              {PLAN_OPTIONS.map((option) => <button type="button" className={wizard.planStatus === option.value ? styles.selected : ""} onClick={() => updateField("planStatus", option.value)} key={option.value}><span>{wizard.planStatus === option.value ? "✓" : ""}</span><strong>{option.title}</strong><small>{option.detail}</small></button>)}
            </div>
            {wizard.planningMode !== "CONCEPT" && <div className={styles.infoNote}>This stage wizard currently produces a preliminary concept quantity schedule. Your detailed drawings can be checked during quotation verification.</div>}
          </fieldset>}

          {step === 1 && <fieldset>
            <legend>What is the size of your project?</legend>
            <p>Enter built-up area for one floor. The total project basis is calculated using the number of floors.</p>
            <label className={styles.rangeField}><span>Built-up area per floor</span><input aria-label="Built-up area slider" type="range" min="100" max="10000" step="50" value={Math.min(10000, wizard.builtUpAreaSqFt)} onChange={(event) => updateField("builtUpAreaSqFt", Number(event.target.value))} /><div><input aria-label="Built-up area per floor" type="number" min="100" max="1000000" value={wizard.builtUpAreaSqFt} onChange={(event) => updateField("builtUpAreaSqFt", Number(event.target.value))} /><b>sq ft</b></div></label>
            <div className={styles.areaGrid}>
              <label><span>Plot area</span><div><input aria-label="Plot area" type="number" min="100" max="1000000" value={wizard.plotAreaSqFt} onChange={(event) => updateField("plotAreaSqFt", Number(event.target.value))} /><small>sq ft</small></div></label>
              <label><span>Number of floors</span><div className={styles.stepper}><button type="button" aria-label="Decrease floors" onClick={() => updateField("floors", Math.max(1, wizard.floors - 1))}>−</button><strong>{wizard.floors}</strong><button type="button" aria-label="Increase floors" onClick={() => updateField("floors", Math.min(100, wizard.floors + 1))}>+</button></div></label>
              <label><span>Typical floor height</span><div><input aria-label="Floor height" type="number" min="8" max="20" step="0.5" value={wizard.floorHeightFt} onChange={(event) => updateField("floorHeightFt", Number(event.target.value))} /><small>ft</small></div></label>
              <label className={styles.toggleLabel}><span>Basement</span><button type="button" role="switch" aria-checked={wizard.basement} onClick={() => updateField("basement", !wizard.basement)}><i />{wizard.basement ? "Included" : "Not included"}</button></label>
            </div>
          </fieldset>}

          {step === 2 && <fieldset>
            <legend>Select your space requirements</legend>
            <p>Room quantities create the concept electrical point and plumbing fixture schedules. Adjust every space that applies.</p>
            <div className={styles.roomGrid}>
              {ROOM_OPTIONS.map((room) => <article key={room.key}>
                <img src={room.image} alt="" loading="lazy" />
                <strong>{room.label}</strong>
                <div className={styles.stepper}><button type="button" aria-label={`Decrease ${room.label}`} onClick={() => updateField(room.key, Math.max(0, wizard[room.key] - 1))}>−</button><span>{wizard[room.key]}</span><button type="button" aria-label={`Increase ${room.label}`} onClick={() => updateField(room.key, Math.min(200, wizard[room.key] + 1))}>+</button></div>
              </article>)}
            </div>
          </fieldset>}

          {step === 3 && <fieldset>
            <legend>Choose the project and material preference</legend>
            <p>Quality changes compatible catalogue recommendations and indicative price—not the underlying engineering quantity.</p>
            <div className={styles.choiceRow}>
              <label><span>Project type</span><select value={wizard.projectType} onChange={(event) => updateField("projectType", event.target.value as WizardState["projectType"])}><option value="RESIDENTIAL">Residential</option><option value="COMMERCIAL">Commercial</option></select></label>
              <label><span>Structural system</span><select value={wizard.structureSystem} onChange={(event) => updateField("structureSystem", event.target.value as WizardState["structureSystem"])}><option value="RCC_FRAME">RCC frame</option><option value="LOAD_BEARING">Load bearing</option></select></label>
            </div>
            <div className={styles.qualityGrid}>
              {QUALITY_OPTIONS.map((option) => <button type="button" className={wizard.qualityTier === option.value ? styles.selected : ""} onClick={() => updateField("qualityTier", option.value)} key={option.value}><i>{option.title.slice(0, 1)}</i><span>{wizard.qualityTier === option.value ? "Selected" : option.kicker}</span><strong>{option.title}</strong>{option.details.map((detail) => <small key={detail}>✓ {detail}</small>)}</button>)}
            </div>
          </fieldset>}

          {step === 4 && <fieldset>
            <legend>Review your {stage} estimate</legend>
            <p>Check the project basis before Buildanta prepares the material schedule.</p>
            <div className={styles.reviewGrid}>
              <button type="button" onClick={() => setStep(0)}><span>Location and plan</span><strong>{wizard.deliveryPincode} · {wizard.planStatus.replaceAll("_", " ").toLowerCase()}</strong><small>Edit</small></button>
              <button type="button" onClick={() => setStep(1)}><span>Project size</span><strong>{wizard.builtUpAreaSqFt.toLocaleString("en-IN")} sq ft × {wizard.floors} floor(s)</strong><small>Edit</small></button>
              <button type="button" onClick={() => setStep(2)}><span>Spaces</span><strong>{roomCount(wizard)} selected spaces</strong><small>Edit</small></button>
              <button type="button" onClick={() => setStep(3)}><span>Preference</span><strong>{wizard.qualityTier.toLowerCase()} · {wizard.structureSystem.replaceAll("_", " ").toLowerCase()}</strong><small>Edit</small></button>
            </div>
            <div className={styles.stageControls}>
              <label><span>{profile.coverageLabel}</span><div><input aria-label={profile.coverageLabel} type="number" min="1" max="100" value={wizard.coveragePercent} onChange={(event) => updateField("coveragePercent", Number(event.target.value))} /><small>%</small></div><em>{profile.coverageHelp}</em></label>
              <label><span>Wastage allowance</span><div><input aria-label="Wastage allowance" type="number" min="0" max="20" step="0.5" value={wizard.wastagePercent} onChange={(event) => updateField("wastagePercent", Number(event.target.value))} /><small>%</small></div><em>Applied separately and shown in the result.</em></label>
            </div>
            <div className={styles.infoNote}>{calculatorConfig ? "This is a preliminary concept estimate using a published calculator version. Final quantities require approved drawings and site measurements." : "This stage is still a local preliminary allowance and is not yet backed by a published calculator version."}</div>
          </fieldset>}

          {stepError && <p className={styles.formError} role="alert">{stepError}</p>}
          {calcError && <p className={styles.formError} role="alert">{calcError}</p>}

          <div className={styles.wizardActions}>
            <button type="button" className={styles.backButton} onClick={previousStep} disabled={step === 0}>← Back</button>
            {step < STEP_TITLES.length - 1
              ? <button type="button" className={styles.nextButton} onClick={nextStep}>Next <span>→</span></button>
              : <button type="submit" className={styles.nextButton} disabled={calculating}>{calculating ? "Preparing estimate…" : `Calculate ${stage}`} <span>→</span></button>}
          </div>
        </div>
      </div>
    </form>

    {calculatorConfig ? (estimate ? <div className={styles.results} id="stage-plan-results">
      <div className={styles.resultIntro}><div><span>PRELIMINARY · VERSION {estimate.version}</span><h3>Your {stage} material schedule</h3><p>Reference {estimate.reference} · {wizard.qualityTier.toLowerCase()} product preference</p></div><button type="button" onClick={() => setStep(4)}>Edit answers</button></div>
      <div className={styles.resultSummary}>
        <div><span>Calculation basis</span><strong>{wizard.builtUpAreaSqFt.toLocaleString("en-IN")} sq ft × {wizard.floors}</strong></div>
        <div><span>Material lines</span><strong>{visibleItems.length}</strong></div>
        <div><span>Catalogue mapped</span><strong>{mappedCount} of {visibleItems.length}</strong></div>
        <div className={styles.total}><span>Mapped-product total</span><strong>{visibleTotal != null ? money(visibleTotal) : "Quotation required"}</strong></div>
      </div>

      <div className={styles.table} role="table" aria-label={`${stage} calculated material result`}>
        <div className={styles.tableHead} role="row"><span>Material</span><span>Base quantity</span><span>Wastage</span><span>Purchase quantity</span><span>Product / rate</span><span>Indicative amount</span></div>
        {visibleItems.length === 0 && <div className={styles.tableRow} role="row"><div><strong>No lines yet for this stage</strong><small>Add a supported room breakdown or detailed schedule to see quantities here.</small></div><span>—</span><span>—</span><span>—</span><div>—</div><strong>—</strong></div>}
        {visibleItems.map((item) => <div className={styles.tableRow} role="row" key={item.id}>
          <div><strong>{item.description}</strong><small>{item.outputKey.replaceAll("_", " ")}</small></div>
          <span>{Number(item.rawQuantity).toLocaleString("en-IN")} {item.formulaUnitCode}</span>
          <span>+{Number(item.wastageQuantity).toLocaleString("en-IN")} {item.formulaUnitCode}</span>
          <span><b>{Number(item.purchaseQuantity).toLocaleString("en-IN")}</b> {item.unitCode}</span>
          <div>{item.product ? <><strong>{item.product.name}</strong><small>{item.product.brand} / {item.variant?.sku || "Mapped product"}</small></> : <><b>Mapping pending</b><small>Quantity is ready; Inventory can map a product later.</small></>}</div>
          <strong>{moneyFromString(item.lineTotal) ?? "Not priced"}</strong>
        </div>)}
      </div>

      <div className={styles.assumptions}>
        <div><strong>Calculation basis and professional checks</strong>{estimate.assumptions.map((assumption) => <span key={assumption}>{assumption}</span>)}{wizard.basement && <span>Basement selection is recorded for quotation review but is not separately quantified by this concept formula.</span>}{calculatorConfig.extraNote && <span>{calculatorConfig.extraNote}</span>}<span>{estimate.disclaimer}</span></div>
        <a href={`/bulk-quotes?stage=${encodeURIComponent(stage)}&estimate=${encodeURIComponent(estimate.reference)}`}>Request a verified quotation →</a>
      </div>
    </div> : null)
    : (plan ? <div className={styles.results} id="stage-plan-results">
      <div className={styles.resultIntro}><div><span>LOCAL PRELIMINARY ALLOWANCE</span><h3>Your {stage} planning schedule</h3><p>This result is not yet backed by a published calculator version.</p></div><button type="button" onClick={() => setStep(4)}>Edit answers</button></div>
      <div className={styles.resultSummary}>
        <div><span>Planning basis</span><strong>{plan.basisAreaSqFt.toLocaleString("en-IN")} sq ft</strong></div>
        <div><span>Material lines</span><strong>{plan.totalLines}</strong></div>
        <div><span>Catalogue mapped</span><strong>{plan.mappedLines} of {plan.totalLines}</strong></div>
        <div className={styles.total}><span>Mapped-product total</span><strong>{plan.indicativeTotal ? money(plan.indicativeTotal) : "Quotation required"}</strong></div>
      </div>
      <div className={styles.table} role="table" aria-label={`${stage} preliminary material result`}>
        <div className={styles.tableHead} role="row"><span>Material</span><span>Calculated need</span><span>Wastage</span><span>Purchase quantity</span><span>Product / rate</span><span>Indicative amount</span></div>
        {plan.lines.map((line) => <div className={styles.tableRow} role="row" key={line.key}>
          <div><strong>{line.material}</strong><small>{line.note}</small></div>
          <span>{line.requirement.toLocaleString("en-IN")} {line.unit}</span><span>Included</span>
          <span><b>{line.purchaseQuantity.toLocaleString("en-IN")}</b> {line.unit}</span>
          <div>{line.product ? <><a href={`/products/${line.product.slug}`}>{line.product.name}</a><small>{line.product.brand} · {line.planningRate ? `${money(line.planningRate)} planning rate` : "Request price"}</small></> : <><b>Mapping pending</b><small>Add this material from Inventory to price it automatically.</small></>}</div>
          <strong>{line.lineTotal == null ? "Not priced" : money(line.lineTotal)}</strong>
        </div>)}
      </div>
      <div className={styles.assumptions}><div><strong>Local planning assumptions (unversioned)</strong>{plan.assumptions.map((assumption) => <span key={assumption}>{assumption}</span>)}</div><a href={`/bulk-quotes?stage=${encodeURIComponent(stage)}`}>Request a verified quotation →</a></div>
    </div> : null)}
  </section>;
}
