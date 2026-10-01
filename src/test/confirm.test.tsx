import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Confirm from "@/pages/Confirm";

const renderPage = (url: string) =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[url]}>
        <Confirm />
      </MemoryRouter>
    </HelmetProvider>,
  );

describe("Confirm page", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("does nothing on load, so a link scanner cannot confirm a subscription", () => {
    renderPage("/confirm?token=abc");
    expect(screen.getByRole("button", { name: /confirm subscription/i })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a POST only after the button is clicked", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true, message: "Subscription confirmed — welcome aboard." }) });
    renderPage("/confirm?token=abc");
    fireEvent.click(screen.getByRole("button", { name: /confirm subscription/i }));
    await waitFor(() => expect(screen.getByText(/welcome aboard/i)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/functions/v1/confirm?token=abc");
    expect(init.method).toBe("POST");
  });

  it("treats an invalid link (200 with success:false) as an error", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: false, message: "Invalid or expired confirmation link." }) });
    renderPage("/confirm?token=bad");
    fireEvent.click(screen.getByRole("button", { name: /confirm subscription/i }));
    await waitFor(() => expect(screen.getByText(/invalid or expired/i)).toBeInTheDocument());
  });

  it("shows an error for a missing token and never calls the server", () => {
    renderPage("/confirm");
    expect(screen.getByText(/invalid confirmation link/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
