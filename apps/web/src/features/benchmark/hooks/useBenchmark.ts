import { useCallback, useState } from "react"

import { runBenchmark } from "../api/benchmarkApi"
import { type BenchmarkResponse, type BenchmarkStatus } from "../model/benchmarkTypes"

const BENCHMARK_SESSION_KEY = "benchmark-result"

export function useBenchmark() {
  const [status, setStatus] = useState<BenchmarkStatus>(() => {
    try {
      return sessionStorage.getItem(BENCHMARK_SESSION_KEY) ? "success" : "idle"
    } catch {
      return "idle"
    }
  })
  const [result, setResult] = useState<BenchmarkResponse | null>(() => {
    try {
      const stored = sessionStorage.getItem(BENCHMARK_SESSION_KEY)
      return stored ? (JSON.parse(stored) as BenchmarkResponse) : null
    } catch {
      return null
    }
  })
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStatus("idle")
    setResult(null)
    setError(null)
    try {
      sessionStorage.removeItem(BENCHMARK_SESSION_KEY)
    } catch {
      // ignore
    }
  }, [])

  const startBenchmark = useCallback(
    async (testArchive: File, labelArchive: File) => {
      if (status === "loading") return

      setStatus("loading")
      setResult(null)
      setError(null)

      try {
        const response = await runBenchmark(testArchive, labelArchive)
        setStatus("success")
        setResult(response)
        try {
          sessionStorage.setItem(BENCHMARK_SESSION_KEY, JSON.stringify(response))
        } catch {
          // ignore quota errors
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Der Benchmark ist fehlgeschlagen."
        setStatus("error")
        setError(message)
      }
    },
    [status],
  )

  return {
    startBenchmark,
    isLoading: status === "loading",
    error,
    result,
    status,
    reset,
  }
}
