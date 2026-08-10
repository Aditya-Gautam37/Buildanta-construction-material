import type { CSSProperties } from "react";

export type WizardJourneyStep = {
  label: string;
};

export type WizardJourneySelection = {
  label: string;
  value: string;
  href?: string;
};

export const STAGE_WIZARD_STEPS: WizardJourneyStep[] = [
  { label: "Construction Stage" },
  { label: "Department" },
  { label: "Category" },
  { label: "Brand" },
  { label: "Products" },
];

export const ROOM_WIZARD_STEPS: WizardJourneyStep[] = [
  { label: "Room" },
  { label: "Department" },
  { label: "Category" },
  { label: "Brand" },
  { label: "Products" },
];

export const BRAND_WIZARD_STEPS: WizardJourneyStep[] = [
  { label: "Brand" },
  { label: "Department" },
  { label: "Category" },
  { label: "Products" },
];

export const CATEGORY_WIZARD_STEPS: WizardJourneyStep[] = [
  { label: "Department" },
  { label: "Category" },
  { label: "Brand" },
  { label: "Products" },
];

export function WizardJourney({
  steps,
  currentStep,
  selections = [],
}: {
  steps: WizardJourneyStep[];
  currentStep: number;
  selections?: WizardJourneySelection[];
}) {
  const activeStep = Math.min(Math.max(currentStep, 0), steps.length - 1);
  const progress = steps.length > 1 ? activeStep / (steps.length - 1) : 1;
  const isComplete = activeStep === steps.length - 1;

  return (
    <section
      className={`wizard-journey${isComplete ? " is-complete" : ""}`}
      aria-label="Shopping journey progress"
      style={{ "--wizard-progress": progress, "--wizard-step-count": steps.length } as CSSProperties}
    >
      <div className="wizard-journey-heading">
        <div>
          <span aria-hidden="true">⌁</span>
          <strong>Build your project</strong>
        </div>
        <small>Step {activeStep + 1} of {steps.length}</small>
      </div>

      <ol className="wizard-journey-steps">
        {steps.map((step, index) => {
          const state = index < activeStep ? "complete" : index === activeStep ? "active" : "upcoming";
          return (
            <li className={state} key={`${step.label}-${index}`} aria-current={state === "active" ? "step" : undefined}>
              <span className="wizard-step-marker" aria-hidden="true">
                {state === "complete" ? "✓" : index + 1}
              </span>
              <span className="wizard-step-copy">
                <small>Step {String(index + 1).padStart(2, "0")}</small>
                <strong>{step.label}</strong>
              </span>
            </li>
          );
        })}
      </ol>

      {selections.length > 0 ? (
        <div className="wizard-selection-summary" aria-label="Your selections">
          <span>Your project</span>
          <div>
            {selections.map((selection) =>
              selection.href ? (
                <a href={selection.href} key={`${selection.label}-${selection.value}`} title={`Change ${selection.label.toLowerCase()}`}>
                  <small>{selection.label}</small>
                  <strong>{selection.value}</strong>
                  <b aria-hidden="true">↺</b>
                </a>
              ) : (
                <span key={`${selection.label}-${selection.value}`}>
                  <small>{selection.label}</small>
                  <strong>{selection.value}</strong>
                </span>
              ),
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
