import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { BenchmarkReportExportButton } from "../../../features/benchmark/components/BenchmarkReportExportButton"
import type { BenchmarkResponse } from "../../../features/benchmark/model/benchmarkTypes"
import { exportBenchmarkReport } from "../../../features/benchmark/utils/reportExport"

vi.mock("../../../features/benchmark/utils/reportExport", () => ({
  exportBenchmarkReport: vi.fn(),
}))

const benchmarkResult: BenchmarkResponse = {
  requestId: "test-request-1",
  modelVersion: "darknet-cnn-v1",
  processingTimeMs: 1234,
  precision: 0.8,
  recall: 0.7,
  f1Score: 0.75,
  mAP: 0.65,
  totalImages: 3,
  failedImages: 0,
  imageResults: [
    {
      imageId: "image-1",
      groundTruthCount: 1,
      predictedCount: 1,
      truePositives: 1,
      falsePositives: 0,
      falseNegatives: 0,
      error: null,
    },
  ],
}

describe("BenchmarkReportExportButton", () => {
  it("zeigt den Export-Button an", () => {
    render(<BenchmarkReportExportButton result={benchmarkResult} />)

    expect(
      screen.getByRole("button", { name: /report herunterladen/i }),
    ).toBeInTheDocument()
  })

  it("ruft die Export-Funktion mit dem Benchmark-Ergebnis auf", async () => {
    const user = userEvent.setup()

    render(<BenchmarkReportExportButton result={benchmarkResult} />)

    await user.click(
      screen.getByRole("button", { name: /report herunterladen/i }),
    )

    expect(exportBenchmarkReport).toHaveBeenCalledTimes(1)
    expect(exportBenchmarkReport).toHaveBeenCalledWith(benchmarkResult)
  })
})