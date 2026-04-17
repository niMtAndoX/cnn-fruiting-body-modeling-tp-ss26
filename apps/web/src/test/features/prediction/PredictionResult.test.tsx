import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PredictionResult } from "@/features/prediction/components/PredictionResult"
import type { PredictionDisplayResult } from "@/features/prediction/model/prediction"

const baseResult: PredictionDisplayResult = {
  boundingBoxes: [{ x: 10, y: 20, width: 30, height: 40 }],
  detections: [{ label: "Ganoderma lucidum", score: 0.87, bbox: { x: 40, y: 30, width: 120, height: 90 } }],
  inferenceTimeMs: 42,
  modelVersion: "v1.2.3",
  requestId: "req-123",
}

describe("PredictionResult", () => {
  it("zeigt erkannte Labels, Scores und Metadaten an", () => {
    render(<PredictionResult result={baseResult} status="success" />)

    expect(screen.getByText("Ganoderma lucidum")).toBeInTheDocument()
    expect(screen.getByText("87%")).toBeInTheDocument()
    expect(screen.getByText("Request ID")).toBeInTheDocument()
    expect(screen.getByText("req-123")).toBeInTheDocument()
    expect(screen.getByText("Model-Version")).toBeInTheDocument()
    expect(screen.getByText("v1.2.3")).toBeInTheDocument()
    expect(screen.getByText("Inference-Zeit")).toBeInTheDocument()
    expect(screen.getByText("42 ms")).toBeInTheDocument()
  })

  it("stellt einen leeren Erfolgsfall benutzerfreundlich dar", () => {
    render(
      <PredictionResult
        result={{ ...baseResult, boundingBoxes: [], detections: [] }}
        status="empty"
      />,
    )

    expect(screen.getByText("Keine Pilze erkannt")).toBeInTheDocument()
    expect(
      screen.getByText(/Die Analyse war erfolgreich, aber es wurden keine passenden Objekte im Bild gefunden\./i),
    ).toBeInTheDocument()
    expect(screen.getByText("req-123")).toBeInTheDocument()
  })

  it("trennt Fehlerzustände vom leeren Erfolgsfall", () => {
    render(<PredictionResult errorMessage="Backend nicht erreichbar" result={null} status="error" />)

    expect(screen.getByText("Analyse fehlgeschlagen")).toBeInTheDocument()
    expect(screen.getByText("Backend nicht erreichbar")).toBeInTheDocument()
    expect(screen.queryByText("Keine Pilze erkannt")).not.toBeInTheDocument()
  })
})
