import { useState } from "react"
import { Check, Copy } from "lucide-react"
import type { PredictionDisplayResult, PredictionFlowStatus } from "../model/prediction"

interface PredictionResultProps {
  errorMessage?: string | null
  result: PredictionDisplayResult | null
  status: PredictionFlowStatus
}

function formatInferenceTime(inferenceTimeMs: number | null): string {
  if (inferenceTimeMs === null) {
    return "Nicht verfügbar"
  }

  return `${inferenceTimeMs.toFixed(0)} ms`
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="ml-2 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Kopieren"
    >
      {copied
        ? <Check className="size-3.5 text-green-500" />
        : <Copy className="size-3.5" />
      }
    </button>
  )
}

function MetadataCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border px-3 py-2 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate">{value}</p>
        <CopyButton value={value} />
      </div>
    </div>
  )
}

function ResultMetadata({ result }: { result: PredictionDisplayResult }) {
  return (
    <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground md:grid-cols-3">
      <MetadataCard label="Request ID" value={result.requestId ?? "Nicht verfügbar"} />
      <MetadataCard label="Model-Version" value={result.modelVersion ?? "Nicht verfügbar"} />
      <MetadataCard label="Inference-Zeit" value={formatInferenceTime(result.inferenceTimeMs)} />
    </div>
  )
}

function buildRawJson(result: PredictionDisplayResult): string {
  return JSON.stringify(
    {
      detections: result.detections,
      requestId: result.requestId,
      modelVersion: result.modelVersion,
      inferenceTimeMs: result.inferenceTimeMs,
    },
    null,
    2,
  )
}

function CopyJsonButton({ result }: { result: PredictionDisplayResult }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    void navigator.clipboard.writeText(buildRawJson(result)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      {copied
        ? <Check className="size-3.5 text-green-500" />
        : <Copy className="size-3.5" />
      }
      {copied ? "Kopiert!" : "Roh-Antwort als JSON kopieren"}
    </button>
  )
}

export function PredictionResult({
  errorMessage = null,
  result,
  status,
}: PredictionResultProps) {
  if (status === "idle" || status === "loading") {
    return null
  }

  if (status === "error") {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
        <h3 className="text-lg font-semibold">Analyse fehlgeschlagen</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {errorMessage ?? "Die Anfrage konnte nicht erfolgreich verarbeitet werden."}
        </p>
      </div>
    )
  }

  if (!result) {
    return null
  }

  if (status === "empty") {
    return (
      <div className="bg-card/90 rounded-lg border border-border p-4 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Keine Pilze erkannt</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Die Analyse war erfolgreich, aber es wurden keine passenden Objekte im Bild gefunden.
          </p>
        </div>
        <ResultMetadata result={result} />
        <CopyJsonButton result={result} />
      </div>
    )
  }

  return (
    <div className="bg-card/90 rounded-lg border border-border p-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Erkannte Pilze</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Treffer, Scores und Metadaten der letzten erfolgreichen Analyse.
        </p>
      </div>

      <div className="space-y-2">
        {result.detections.map((detection, index) => (
          <div
            key={`${detection.label}-${index}`}
            className="flex items-center justify-between rounded border px-3 py-2"
          >
            <span className="font-medium">{detection.label}</span>
            <div className="flex items-center gap-1">
              <span>{(detection.score * 100).toFixed(0)}%</span>
              <CopyButton value={`${detection.label} – ${(detection.score * 100).toFixed(0)}%`} />
            </div>
          </div>
        ))}
      </div>

      <ResultMetadata result={result} />
      <CopyJsonButton result={result} />
    </div>
  )
}
