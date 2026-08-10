import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WizardOptionGrid, type WizardGridOption } from "./wizard-option-grid";

function option(index: number): WizardGridOption {
  return {
    id: `choice-${index}`,
    name: `Choice ${index}`,
    href: `/choice/${index}`,
    description: `Description ${index}`,
    productCount: index,
  };
}

describe("WizardOptionGrid", () => {
  it("keeps the existing six-choice cap and reveals the remaining choices on request", () => {
    render(<WizardOptionGrid heading="Choose" options={Array.from({ length: 8 }, (_, index) => option(index + 1))} />);

    expect(screen.getAllByRole("link")).toHaveLength(6);
    fireEvent.click(screen.getByRole("button", { name: "See all 8 options" }));
    expect(screen.getAllByRole("link")).toHaveLength(8);
  });

  it("gives a clicked option immediate selected feedback without changing its destination", () => {
    render(<WizardOptionGrid heading="Choose" options={[option(1), option(2)]} />);
    const selected = screen.getByRole("link", { name: /Choice 1/ });
    selected.addEventListener("click", (event) => event.preventDefault());

    fireEvent.click(selected);

    expect(selected).toHaveClass("is-selected");
    expect(selected).toHaveAttribute("aria-current", "step");
    expect(selected).toHaveAttribute("href", "/choice/1");
  });
});
