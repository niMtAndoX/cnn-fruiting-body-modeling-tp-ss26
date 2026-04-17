import { useCallback, useState } from "react"

import { predict } from "../api/predict"
import {
  createLogEntry,
  createPredictionDisplayResult,
  formatDetectionSummary,
  getPredictionFlowStatus,
  type LogEntry,
  type PredictionDisplayResult,
  type PredictionFlowStatus,
  type SelectedImage,
} from "../model/prediction"

interface CompletedPrediction {
  logs: LogEntry[]
  result: PredictionDisplayResult
  status: Extract<PredictionFlowStatus, "success" | "empty">
}

function getUploadLogs(logs: LogEntry[]): LogEntry[] {
  const lastUploadLog = [...logs].reverse().find((log) => log.icon === "camera")
  return lastUploadLog ? [lastUploadLog] : []
}

export function usePrediction() {
  const [status, setStatus] = useState<PredictionFlowStatus>("idle")
  const [result, setResult] = useState<PredictionDisplayResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])

  const reset = useCallback(() => {
    setStatus("idle")
    setResult(null)
    setErrorMessage(null)
    setLogs([])
  }, [])

  const handleImageSelected = useCallback(() => {
    setStatus("idle")
    setResult(null)
    setErrorMessage(null)
    setLogs([createLogEntry("Bild erfolgreich hochgeladen", "camera")])
  }, [])

  const analyzeImage = useCallback(async (selectedImage: SelectedImage | null): Promise<CompletedPrediction | null> => {
    if (!selectedImage) {
      const message = "Bitte wähle zuerst ein Bild aus."
      const nextLogs = [...getUploadLogs(logs), createLogEntry(message, "error")]
      setStatus("error")
      setResult(null)
      setErrorMessage(message)
      setLogs(nextLogs)
      return null
    }

    const loadingLogs = [
      ...getUploadLogs(logs),
      createLogEntry("Analyse gestartet...", "search"),
      createLogEntry("Bildverarbeitung läuft...", "search"),
    ]

    setStatus("loading")
    setResult(null)
    setErrorMessage(null)
    setLogs(loadingLogs)

    try {
      const response = await predict(selectedImage.file)
      const nextResult = createPredictionDisplayResult(response, selectedImage.dimensions)
      const nextStatus = getPredictionFlowStatus(nextResult)
      const nextLogs = [
        ...loadingLogs,
        createLogEntry("Pilzerkennung aktiv...", "search"),
        createLogEntry(formatDetectionSummary(nextResult.detections.length), "check"),
        createLogEntry("Analyse abgeschlossen!", "check"),
      ]

      setStatus(nextStatus)
      setResult(nextResult)
      setErrorMessage(null)
      setLogs(nextLogs)

      return {
        logs: nextLogs,
        result: nextResult,
        status: nextStatus,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Die Analyse ist fehlgeschlagen."
      const nextLogs = [...loadingLogs, createLogEntry(message, "error")]

      setStatus("error")
      setResult(null)
      setErrorMessage(message)
      setLogs(nextLogs)

      return null
    }
  }, [logs])

  return {
    analyzeImage,
    errorMessage,
    handleImageSelected,
    isAnalyzing: status === "loading",
    logs,
    reset,
    result,
    status,
  }
}
