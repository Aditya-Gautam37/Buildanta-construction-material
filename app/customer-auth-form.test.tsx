import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CustomerAuthForm } from "./customer-auth-form";

describe("CustomerAuthForm", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("blocks signup submission when the passwords do not match, without calling the API", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<CustomerAuthForm mode="signup" />);

    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Aditya" } });
    fireEvent.change(screen.getByLabelText("Last name"), { target: { value: "Gautam" } });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "aditya@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "different123" } });
    fireEvent.click(screen.getByText("Create customer account"));

    expect(screen.getByRole("alert")).toHaveTextContent("Passwords do not match.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a confirmation message and resets the form when signup requires email confirmation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ requiresConfirmation: true }),
    }));
    render(<CustomerAuthForm mode="signup" />);

    fireEvent.change(screen.getByLabelText("First name"), { target: { value: "Aditya" } });
    fireEvent.change(screen.getByLabelText("Last name"), { target: { value: "Gautam" } });
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "aditya@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByText("Create customer account"));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Account created. Open the confirmation link sent to your email, then sign in.",
      ),
    );
    expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe("");
  });

  it("posts login credentials without a confirmPassword field and redirects on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", fetchMock);
    const assignSpy = vi.fn();
    // @ts-expect-error -- jsdom's window.location.assign isn't implemented; stub it for this test.
    delete window.location;
    window.location = { ...window.location, assign: assignSpy, search: "" } as unknown as Location;

    render(<CustomerAuthForm mode="login" />);
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "aditya@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByText("Sign in to Buildanta"));

    await waitFor(() => expect(assignSpy).toHaveBeenCalledWith("/account"));

    const [url, requestInit] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/customer-auth/login");
    const body = JSON.parse(requestInit.body as string);
    expect(body).toEqual({ email: "aditya@example.com", password: "password123" });
  });

  it("shows the server error message when authentication fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Invalid credentials." }) }));
    render(<CustomerAuthForm mode="login" />);

    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "aditya@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByText("Sign in to Buildanta"));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Invalid credentials."));
  });
});
