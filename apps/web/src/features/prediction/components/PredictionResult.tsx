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

function ResultMetadata({ result }: { result: PredictionDisplayResult }) {
  return (
    <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground md:grid-cols-3">
      <div className="rounded border px-3 py-2">
        <p className="font-medium text-foreground">Request ID</p>
        <p className="truncate">{result.requestId ?? "Nicht verfügbar"}</p>
      </div>
      <div className="rounded border px-3 py-2">
        <p className="font-medium text-foreground">Model-Version</p>
        <p>{result.modelVersion ?? "Nicht verfügbar"}</p>
      </div>
      <div className="rounded border px-3 py-2">
        <p className="font-medium text-foreground">Inference-Zeit</p>
        <p>{formatInferenceTime(result.inferenceTimeMs)}</p>
      </div>
    </div>
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
          <div key={`${detection.label}-${index}`} className="flex items-center justify-between rounded border px-3 py-2">
            <span className="font-medium">{detection.label}</span>
            <span>{(detection.score * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>

      <ResultMetadata result={result} />
    </div>
  )
}
