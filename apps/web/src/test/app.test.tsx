import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/benchmark/components/BenchmarkResultView", () => ({
  BenchmarkResultView: () => null,
}))

vi.mock("@/features/model-selection/hooks/useModelSelection", () => ({
  useModelSelection: () => ({
    availableModels: ["darknet-cnn-v1"],
    errorMessage: null,
    isLoading: false,
    selectedModelVersion: "darknet-cnn-v1",
    setSelectedModelVersion: vi.fn(),
  }),
}))

import { routes } from "../app/router";

function renderAtRoute(path: string) {
  const router = createMemoryRouter(routes, {
    initialEntries: [path],
  });

  return render(<RouterProvider router={router} />);
}

describe("App routing", () => {
  it("zeigt die Startseite unter /", () => {
    renderAtRoute("/");

    expect(screen.getByText("Startseite")).toBeInTheDocument();
  });

  it("zeigt die Prediction-Seite unter /prediction", () => {
    renderAtRoute("/prediction");

    expect(screen.getByText("Prediction Page")).toBeInTheDocument();
  });

  it("zeigt die Not-Found-Seite bei unbekannter Route", () => {
    renderAtRoute("/irgendwas");

    expect(screen.getByText("404 - Seite nicht gefunden")).toBeInTheDocument();
  });
});
