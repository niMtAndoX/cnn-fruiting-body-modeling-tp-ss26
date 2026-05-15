import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, beforeEach, vi } from "vitest"

import { runBenchmark } from "@/features/benchmark/api/benchmarkApi"
import { useBenchmark } from "@/features/benchmark/hooks/useBenchmark"
import type { BenchmarkResponse } from "@/features/benchmark/model/benchmarkTypes"

vi.mock("@/features/benchmark/api/benchmarkApi", () => ({
  runBenchmark: vi.fn(),
}))

const mockedRunBenchmark = vi.mocked(runBenchmark)

const testArchive = new File(["data"], "test_images.zip", { type: "application/zip" })
const labelArchive = new File(["data"], "labels.zip", { type: "application/zip" })

const successResponse: BenchmarkResponse = {
  requestId: "req-bench-1",
  modelVersion: "detector-2026-04",
  processingTimeMs: 3200,
  precision: 0.91,
  recall: 0.85,
  f1Score: 0.88,
  mAP: 0.87,
  totalImages: 50,
}

describe("useBenchmark", () => {
  beforeEach(() => {
    mockedRunBenchmark.mockReset()
  })

  it("startet im Ruhezustand", () => {
    const { result } = renderHook(() => useBenchmark())

    expect(result.current.status).toBe("idle")
    expect(result.current.isLoading).toBe(false)
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it("setzt isLoading während des Benchmark-Aufrufs", async () => {
    let resolvePromise!: (value: BenchmarkResponse) => void
    mockedRunBenchmark.mockReturnValue(
      new Promise<BenchmarkResponse>((resolve) => {
        resolvePromise = resolve
      }),
    )

    const { result } = renderHook(() => useBenchmark())

    act(() => {
      void result.current.startBenchmark(testArchive, labelArchive)
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.status).toBe("loading")

    await act(async () => {
      resolvePromise(successResponse)
    })
  })

  it("speichert das Ergebnis bei erfolgreichem Benchmark", async () => {
    mockedRunBenchmark.mockResolvedValue(successResponse)

    const { result } = renderHook(() => useBenchmark())

    await act(async () => {
      await result.current.startBenchmark(testArchive, labelArchive)
    })

    expect(mockedRunBenchmark).toHaveBeenCalledWith(testArchive, labelArchive)
    expect(result.current.status).toBe("success")
    expect(result.current.isLoading).toBe(false)
    expect(result.current.result?.requestId).toBe("req-bench-1")
    expect(result.current.result?.precision).toBe(0.91)
    expect(result.current.result?.totalImages).toBe(50)
    expect(result.current.error).toBeNull()
  })

  it("setzt den Fehlerzustand bei einem API-Fehler", async () => {
    mockedRunBenchmark.mockRejectedValue(new Error("Backend nicht erreichbar"))

    const { result } = renderHook(() => useBenchmark())

    await act(async () => {
      await result.current.startBenchmark(testArchive, labelArchive)
    })

    expect(result.current.status).toBe("error")
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe("Backend nicht erreichbar")
    expect(result.current.result).toBeNull()
  })

  it("verhindert einen zweiten Start während ein Benchmark läuft", async () => {
    let resolvePromise!: (value: BenchmarkResponse) => void
    mockedRunBenchmark.mockReturnValue(
      new Promise<BenchmarkResponse>((resolve) => {
        resolvePromise = resolve
      }),
    )

    const { result } = renderHook(() => useBenchmark())

    act(() => {
      void result.current.startBenchmark(testArchive, labelArchive)
    })

    expect(result.current.status).toBe("loading")

    await act(async () => {
      await result.current.startBenchmark(testArchive, labelArchive)
    })

    expect(mockedRunBenchmark).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolvePromise(successResponse)
    })
  })

  it("setzt den Zustand mit reset() zurück", async () => {
    mockedRunBenchmark.mockResolvedValue(successResponse)

    const { result } = renderHook(() => useBenchmark())

    await act(async () => {
      await result.current.startBenchmark(testArchive, labelArchive)
    })

    expect(result.current.status).toBe("success")

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe("idle")
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })
})
