import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Unsubscribe from "@/pages/Unsubscribe";

const renderPage = (url: string) =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[url]}>
        <Unsubscribe />
      </MemoryRouter>
    </HelmetProvider>,
  );

describe("Unsubscribe page", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("does nothing on load, so a link scanner cannot unsubscribe anyone", () => {
    renderPage("/unsubscribe?token=abc");
    expect(screen.getByRole("button", { name: /confirm unsubscribe/i })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a POST only after the button is clicked", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ message: "You've been unsubscribed successfully." }) });
    renderPage("/unsubscribe?token=abc");
    fireEvent.click(screen.getByRole("button", { name: /confirm unsubscribe/i }));
    await waitFor(() => expect(screen.getByText(/unsubscribed successfully/i)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/functions/v1/unsubscribe?token=abc");
    expect(init.method).toBe("POST");
  });

  it("shows an error for a missing token and never calls the server", () => {
    renderPage("/unsubscribe");
    expect(screen.getByText(/invalid unsubscribe link/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the server's message when the request fails", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: "Failed to unsubscribe" }) });
    renderPage("/unsubscribe?token=abc");
    fireEvent.click(screen.getByRole("button", { name: /confirm unsubscribe/i }));
    await waitFor(() => expect(screen.getByText(/failed to unsubscribe/i)).toBeInTheDocument());
  });
});
