import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React, { useState } from "react";

interface HealthCheckButtonProps {
  onError?: (error: unknown) => void;
  onSuccess?: (data: unknown) => void;
}

// Simple Mock HealthCheckButton Component
const HealthCheckButton = ({ onSuccess, onError }: HealthCheckButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleCheck = async () => {
    setIsLoading(true);
    setStatus("idle");

    try {
      const response = await fetch("/api/health");
      if (!response.ok) throw new Error("Failed");

      const data = await response.json();
      setStatus("success");
      onSuccess?.(data);
    } catch (error) {
      setStatus("error");
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleCheck} disabled={isLoading} data-testid="health-btn">
        {isLoading ? "Lädt..." : "Health Check"}
      </button>

      {status === "success" && (
        <div data-testid="success-msg">✓ OK</div>
      )}
      {status === "error" && (
        <div data-testid="error-msg">✗ Fehler</div>
      )}
      {isLoading && (
        <div data-testid="loading-msg">Lädt...</div>
      )}
    </div>
  );
};

describe("HealthCheckButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("zeigt den Health-Check Button", () => {
    render(<HealthCheckButton />);

    const button = screen.getByTestId("health-btn");
    expect(button).toBeInTheDocument();
  });

  it("zeigt Ladezustand", async () => {
    const user = userEvent.setup();
    
    global.fetch = vi.fn(() =>
      new Promise((resolve) =>
        setTimeout(
          () => resolve(new Response(JSON.stringify({ status: "ok" }), { status: 200 })),
          100
        )
      )
    ) as typeof fetch;

    render(<HealthCheckButton />);

    const button = screen.getByTestId("health-btn");
    await user.click(button);

    expect(button).toBeDisabled();
    expect(screen.getByTestId("loading-msg")).toBeInTheDocument();
  });

  it("zeigt Erfolgsmeldung nach erfolgreichem Check", async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();

    global.fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ status: "ok" }), { status: 200 }))
    ) as typeof fetch;

    render(<HealthCheckButton onSuccess={mockOnSuccess} />);

    const button = screen.getByTestId("health-btn");
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByTestId("success-msg")).toBeInTheDocument();
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("zeigt Fehlermeldung bei fehlgeschlagenem Check", async () => {
    const user = userEvent.setup();
    const mockOnError = vi.fn();

    global.fetch = vi.fn(() => Promise.reject(new Error("Network error"))) as typeof fetch;

    render(<HealthCheckButton onError={mockOnError} />);

    const button = screen.getByTestId("health-btn");
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByTestId("error-msg")).toBeInTheDocument();
    });

    expect(mockOnError).toHaveBeenCalled();
  });
});
