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

  const getImages = useCallback(
    async (testArchive: File) => {
      const imgMap = new Map<string, string>();

      const JSZip = ((await import("jszip")).default)
      const zip = new JSZip();

      try{
        const loadedZip = await zip.loadAsync(testArchive);

        for(const [filename, file] of Object.entries(loadedZip.files)){
          if (!file.dir && /\.(png|jpe?g)$/i.test(filename)){
            const blob = await file.async("blob");
            const url = URL.createObjectURL(blob);

            const nameNoType = filename
            .split("/")
            .pop()
            ?.replace(/\.[^/.]+$/, "");

            imgMap.set(nameNoType ? nameNoType : filename, url);
          }
        }
      } catch (e) {
        console.error("Die Bilder konnten nicht aus der ZIP extrahiert werden.", e);
      }
      
      return imgMap;
    }, []
  );

  const [imgMap, setImgMap] = useState<Map<string, string> | null> (new Map<string, string>)

  const startBenchmark = useCallback(
    async (testArchive: File, labelArchive: File) => {
      if (status === "loading") return

      setStatus("loading")
      setResult(null)
      setError(null)

      if (imgMap){
        imgMap.forEach((url) => URL.revokeObjectURL(url))
        setImgMap(null)
      }

      try {
        const response = await runBenchmark(testArchive, labelArchive)
        setStatus("success")
        setResult(response)

        const images = await getImages(testArchive);
        setImgMap(images);

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
    [status, getImages, imgMap],
  )

  return {
    startBenchmark,
    isLoading: status === "loading",
    error,
    result,
    status,
    imgMap,
    reset,
  }
}
