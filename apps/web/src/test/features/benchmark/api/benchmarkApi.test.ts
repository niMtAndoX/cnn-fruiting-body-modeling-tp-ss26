import { describe, expect, it, vi, beforeEach } from "vitest"

import { BenchmarkRequestError, runBenchmark } from "@/features/benchmark/api/benchmarkApi"
import { HttpClientError } from "@/shared/api/httpClient"

vi.mock("@/shared/api/httpClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api/httpClient")>()
  return {
    ...actual,
    request: vi.fn(),
  }
})

import { request } from "@/shared/api/httpClient"

const mockedRequest = vi.mocked(request)

const zipFile = (name: string) => new File(["data"], name, { type: "application/zip" })
const nonZipFile = (name: string) => new File(["data"], name, { type: "image/png" })

describe("runBenchmark", () => {
  beforeEach(() => {
    mockedRequest.mockReset()
  })

  it("lehnt ein Nicht-ZIP-Testarchiv ab", async () => {
    await expect(runBenchmark(nonZipFile("images.png"), zipFile("labels.zip"))).rejects.toThrow(
      BenchmarkRequestError,
    )
    expect(mockedRequest).not.toHaveBeenCalled()
  })

  it("lehnt ein Nicht-ZIP-Label-Archiv ab", async () => {
    await expect(runBenchmark(zipFile("images.zip"), nonZipFile("labels.txt"))).rejects.toThrow(
      BenchmarkRequestError,
    )
    expect(mockedRequest).not.toHaveBeenCalled()
  })

  it("wandelt HttpClientError in BenchmarkRequestError um", async () => {
    mockedRequest.mockRejectedValue(new HttpClientError("Backend nicht erreichbar"))

    await expect(runBenchmark(zipFile("images.zip"), zipFile("labels.zip"))).rejects.toThrow(
      BenchmarkRequestError,
    )
  })

  it("gibt eine normalisierte BenchmarkResponse bei Erfolg zurück", async () => {
    mockedRequest.mockResolvedValue({
      request_id: "req-001",
      model_version: "v1.0",
      processing_time_ms: 1500,
      precision: 0.9,
      recall: 0.8,
      f1_score: 0.85,
      map: 0.83,
      total_images: 100,
    })

    const result = await runBenchmark(zipFile("images.zip"), zipFile("labels.zip"))

    expect(result.requestId).toBe("req-001")
    expect(result.modelVersion).toBe("v1.0")
    expect(result.processingTimeMs).toBe(1500)
    expect(result.precision).toBe(0.9)
    expect(result.recall).toBe(0.8)
    expect(result.f1Score).toBe(0.85)
    expect(result.mAP).toBe(0.83)
    expect(result.totalImages).toBe(100)
  })

  it("sendet test_archive und label_archive als FormData", async () => {
    mockedRequest.mockResolvedValue({})

    const testArchive = zipFile("images.zip")
    const labelArchive = zipFile("labels.zip")

    await runBenchmark(testArchive, labelArchive, "darknet-cnn-v1.2")

    expect(mockedRequest).toHaveBeenCalledWith(
      "benchmark",
      expect.objectContaining({ method: "POST" }),
    )

    const callArgs = mockedRequest.mock.calls[0][1] as RequestInit
    const formData = callArgs.body as FormData
    expect(formData.get("test_archive")).toBe(testArchive)
    expect(formData.get("label_archive")).toBe(labelArchive)
    expect(formData.get("model_version")).toBe("darknet-cnn-v1.2")
  })

  it("akzeptiert ZIP-Dateien anhand der Dateiendung", async () => {
    mockedRequest.mockResolvedValue({})

    const testArchive = new File(["data"], "images.zip", { type: "application/octet-stream" })
    const labelArchive = new File(["data"], "labels.zip", { type: "application/octet-stream" })

    await expect(runBenchmark(testArchive, labelArchive)).resolves.not.toThrow()
  })
})
