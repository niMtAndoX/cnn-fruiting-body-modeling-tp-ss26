import { useCallback, useState } from "react"

import { runBenchmark } from "../api/benchmarkApi"
import { type BenchmarkResponse, type BenchmarkStatus } from "../model/benchmarkTypes"

export function useBenchmark() {
  const [status, setStatus] = useState<BenchmarkStatus>("idle")
  const [result, setResult] = useState<BenchmarkResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStatus("idle")
    setResult(null)
    setError(null)
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
