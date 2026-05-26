import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { BenchmarkResultView } from "@/features/benchmark/components/BenchmarkResultView"
import type { BenchmarkResponse } from "@/features/benchmark/model/benchmarkTypes"

vi.mock("@/features/benchmark/components/BenchmarkReportExportButton", () => ({
  BenchmarkReportExportButton: () => <button type="button">Report herunterladen</button>,
}))

const benchmarkResult: BenchmarkResponse = {
  requestId: "benchmark-1",
  modelVersion: "cnn-v1",
  processingTimeMs: 1200,
  precision: 0.8,
  recall: 0.7,
  f1Score: 0.75,
  mAP: 0.65,
  totalImages: 2,
  failedImages: 0,
  imageResults: [
    {
      imageId: "bild_001.jpg",
      groundTruthCount: 1,
      predictedCount: 1,
      truePositives: 1,
      falsePositives: 0,
      falseNegatives: 0,
      error: null,
    },
  ],
}

describe("BenchmarkResultView", () => {
  it("zeigt die Metrik als mAP und nicht als MAP", () => {
    render(<BenchmarkResultView result={benchmarkResult} status="success" imgMap={new Map<string, string>()} />)

    expect(screen.getByText("mAP")).toBeInTheDocument()
    expect(screen.queryByText("MAP")).not.toBeInTheDocument()
  })
})
