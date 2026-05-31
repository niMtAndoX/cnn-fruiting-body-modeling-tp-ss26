import { useCallback, useEffect, useState } from "react"

import { runBenchmark } from "../api/benchmarkApi"
import { type BenchmarkResponse, type BenchmarkStatus } from "../model/benchmarkTypes"

import {get as idbGet, set as idbSet, del as idbDel} from 'idb-keyval'

const BENCHMARK_SESSION_KEY = "benchmark-result"
const ZIP_STORAGE_KEY = "benchmark-test-zip" 

function base64ToBlob(base64String: string): Blob{
  const pureBase64 = base64String.replace(/^data:.*;base64,/, "")

  const byteCharacters = atob(pureBase64)

  const byteNumbers = new Array(byteCharacters.length);
  for(let i = 0; i < byteCharacters.length; i++){
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)

  return new Blob([byteArray], {type: 'application/zip'})
}

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
  const [imgMap, setImgMap] = useState<Map<string, string> | null>(new Map())

  const getImages = useCallback(
    async (testArchive: File | Blob) => {
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

  useEffect(() => {
    async function restoreImagesOnReload() {
      if(result && (!imgMap || imgMap.size === 0)){
        try{
          const savedZip = await idbGet<Blob>(ZIP_STORAGE_KEY)

          if(savedZip){
            const restoredImages = await getImages(savedZip);
            setImgMap(restoredImages);
          }
        }catch (e){
          console.error("Fehler beim wiederherstellen der Bilder nach dem Reload.", e);
        }
      }
    }

    restoreImagesOnReload();
  }, [result, getImages, imgMap])

  const reset = useCallback(() => {
    setStatus("idle")
    setResult(null)
    setError(null)

    if(imgMap){
      imgMap.forEach((url) => URL.revokeObjectURL(url));
    }
    setImgMap(new Map())

    try {
      sessionStorage.removeItem(BENCHMARK_SESSION_KEY)
      idbDel(ZIP_STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [imgMap])

  const startBenchmark = useCallback(
    async (
      testArchive: File,
      labelArchive: File,
      modelVersion?: string | null,
    ) => {
      if (status === "loading") return

      setStatus("loading")
      setResult(null)
      setError(null)

      if (imgMap){
        imgMap.forEach((url) => URL.revokeObjectURL(url))
        setImgMap(null)
      }

      try {
        const response = await runBenchmark(testArchive, labelArchive, modelVersion)
        
        if(response.zipFile){
          const zipBlob = base64ToBlob(response.zipFile);

          try {
            await idbSet(ZIP_STORAGE_KEY, zipBlob);
          }catch (e){
            console.error("Zip konnte nicht in IndexDB gesichert werden.", e)
          }

          const images = await getImages(zipBlob);

          setImgMap(images);
        }

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
