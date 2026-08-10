import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { STAGE_WIZARD_STEPS, WizardJourney } from "./wizard-journey";

describe("WizardJourney", () => {
  it("marks completed, active, and upcoming steps from the current URL-derived step", () => {
    const { container } = render(<WizardJourney steps={STAGE_WIZARD_STEPS} currentStep={2} />);

    expect(screen.getByText("Step 3 of 5")).toBeInTheDocument();
    expect(container.querySelectorAll("li.complete")).toHaveLength(2);
    expect(container.querySelector("li.active")).toHaveTextContent("Category");
    expect(container.querySelector("li.active")).toHaveAttribute("aria-current", "step");
    expect(container.querySelectorAll("li.upcoming")).toHaveLength(2);
  });

  it("keeps earlier selections visible and changeable through existing routes", () => {
    render(
      <WizardJourney
        steps={STAGE_WIZARD_STEPS}
        currentStep={1}
        selections={[{ label: "Stage", value: "Foundation & Structure", href: "/by-stage" }]}
      />,
    );

    expect(screen.getByText("Foundation & Structure")).toBeInTheDocument();
    expect(screen.getByTitle("Change stage")).toHaveAttribute("href", "/by-stage");
  });
});
