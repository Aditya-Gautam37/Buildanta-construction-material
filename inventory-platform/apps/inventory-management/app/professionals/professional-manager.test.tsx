import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ProfessionalManager from "./professional-manager";
import type { ProfessionalRecord } from "@/lib/professionals";
import { deleteProfessionalAction, saveProfessionalAction } from "./actions";

vi.mock("./actions", () => ({
  saveProfessionalAction: vi.fn(),
  deleteProfessionalAction: vi.fn(),
}));

function makeProfessional(overrides: Partial<ProfessionalRecord> = {}): ProfessionalRecord {
  return {
    id: "pro-1",
    name: "Aditya Contractor",
    slug: "aditya-contractor",
    type: "CONTRACTOR",
    headline: "Residential specialist",
    bio: null,
    photoUrl: null,
    location: "Kanpur",
    yearsExperience: 5,
    email: null,
    phone: null,
    website: null,
    portfolioUrl: null,
    services: ["Turnkey projects"],
    featured: false,
    published: true,
    sortOrder: 0,
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("ProfessionalManager", () => {
  beforeEach(() => {
    vi.mocked(saveProfessionalAction).mockReset();
    vi.mocked(deleteProfessionalAction).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("filters the professional list by search query", () => {
    const professionals = [
      makeProfessional({ id: "pro-1", name: "Aditya Contractor", location: "Kanpur", type: "CONTRACTOR" }),
      makeProfessional({ id: "pro-2", name: "Priya Architect", location: "Lucknow", type: "ARCHITECT" }),
    ];
    render(<ProfessionalManager initialProfessionals={professionals} />);

    expect(screen.getByText("Aditya Contractor")).toBeInTheDocument();
    expect(screen.getByText("Priya Architect")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search people or locations"), { target: { value: "lucknow" } });

    expect(screen.queryByText("Aditya Contractor")).not.toBeInTheDocument();
    expect(screen.getByText("Priya Architect")).toBeInTheDocument();
  });

  it("opens the edit dialog pre-filled and saves an update through saveProfessionalAction", async () => {
    const professional = makeProfessional();
    vi.mocked(saveProfessionalAction).mockResolvedValue({
      ok: true,
      professional: { ...professional, name: "Aditya Renamed" },
    });
    render(<ProfessionalManager initialProfessionals={[professional]} />);

    fireEvent.click(screen.getByText("Edit"));

    const nameInput = screen.getByDisplayValue("Aditya Contractor");
    expect(nameInput).toBeInTheDocument();
    fireEvent.change(nameInput, { target: { value: "Aditya Renamed" } });
    fireEvent.click(screen.getByText("Save professional"));

    await waitFor(() => expect(saveProfessionalAction).toHaveBeenCalledTimes(1));
    const [savedInput] = vi.mocked(saveProfessionalAction).mock.calls[0]!;
    expect(savedInput).toMatchObject({ id: "pro-1", name: "Aditya Renamed" });

    await waitFor(() => expect(screen.getByText("Aditya Renamed")).toBeInTheDocument());
  });

  it("shows the returned error instead of closing the dialog when save fails", async () => {
    vi.mocked(saveProfessionalAction).mockResolvedValue({ ok: false, error: "That profile URL is already in use. Change the slug." });
    render(<ProfessionalManager initialProfessionals={[makeProfessional()]} />);

    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getByText("Save professional"));

    await waitFor(() =>
      expect(screen.getByText("That profile URL is already in use. Change the slug.")).toBeInTheDocument(),
    );
  });

  it("deletes a professional after user confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.mocked(deleteProfessionalAction).mockResolvedValue({ ok: true });
    const professional = makeProfessional();
    render(<ProfessionalManager initialProfessionals={[professional]} />);

    const card = screen.getByText("Aditya Contractor").closest(".overflow-hidden") as HTMLElement;
    const buttons = within(card).getAllByRole("button");
    fireEvent.click(buttons[buttons.length - 1]!);

    await waitFor(() => expect(deleteProfessionalAction).toHaveBeenCalledWith("pro-1"));
    await waitFor(() => expect(screen.queryByText("Aditya Contractor")).not.toBeInTheDocument());
  });

  it("does not delete when the user cancels the confirmation prompt", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<ProfessionalManager initialProfessionals={[makeProfessional()]} />);

    const card = screen.getByText("Aditya Contractor").closest(".overflow-hidden") as HTMLElement;
    const buttons = within(card).getAllByRole("button");
    fireEvent.click(buttons[buttons.length - 1]!);

    expect(deleteProfessionalAction).not.toHaveBeenCalled();
    expect(screen.getByText("Aditya Contractor")).toBeInTheDocument();
  });
});
