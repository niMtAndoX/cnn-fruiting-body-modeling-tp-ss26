import { fireEvent, render, screen } from "@testing-library/react"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"

vi.mock("@/features/benchmark/hooks/useBenchmark", () => ({
  useBenchmark: () => ({
    startBenchmark: vi.fn(),
    isLoading: false,
    error: null,
    result: null,
    status: "idle",
    reset: vi.fn(),
  }),
}))

vi.mock("@/components/waldpilz/header", () => ({
  Header: () => <header data-testid="header">Header</header>,
}))

vi.mock("@/components/wald_background.jpg", () => ({ default: "background.jpg" }))

import BenchmarkPage from "@/pages/BenchmarkPage"

function renderBenchmarkPage() {
  const router = createMemoryRouter([{ path: "/", element: <BenchmarkPage /> }], {
    initialEntries: ["/"],
  })
  return render(<RouterProvider router={router} />)
}

describe("BenchmarkPage", () => {
  it("rendert die Seite ohne Fehler", () => {
    renderBenchmarkPage()

    expect(screen.getByTestId("header")).toBeInTheDocument()
  })

  it("zeigt beide Upload-Felder an", () => {
    renderBenchmarkPage()

    expect(screen.getByTestId("test-archive-input")).toBeInTheDocument()
    expect(screen.getByTestId("label-archive-input")).toBeInTheDocument()
  })

  it("Start-Button ist ohne Dateien deaktiviert", () => {
    renderBenchmarkPage()

    const startButton = screen.getByRole("button", { name: /benchmark starten/i })
    expect(startButton).toBeDisabled()
  })

  it("Start-Button wird mit zwei gültigen ZIP-Dateien aktiv", () => {
    renderBenchmarkPage()

    const testInput = screen.getByTestId("test-archive-input")
    const labelInput = screen.getByTestId("label-archive-input")

    fireEvent.change(testInput, {
      target: { files: [new File(["data"], "images.zip", { type: "application/zip" })] },
    })
    fireEvent.change(labelInput, {
      target: { files: [new File(["data"], "labels.zip", { type: "application/zip" })] },
    })

    expect(screen.getByRole("button", { name: /benchmark starten/i })).not.toBeDisabled()
  })
})
