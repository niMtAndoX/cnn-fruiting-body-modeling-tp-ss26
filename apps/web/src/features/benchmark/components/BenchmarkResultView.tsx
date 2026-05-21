import { type BenchmarkResponse, type BenchmarkStatus } from "../model/benchmarkTypes"
import { BenchmarkAccuracyGauge } from "./BenchmarkAccuracyGauge"
import { BenchmarkConfusionBars } from "./BenchmarkConfusionBars"
import { BenchmarkImageResultList } from "./BenchmarkImageResultList"
import { BenchmarkMetricCards } from "./BenchmarkMetricCards"
import { BenchmarkReportExportButton } from "./BenchmarkReportExportButton"

interface BenchmarkResultViewProps {
  result: BenchmarkResponse | null
  status: BenchmarkStatus
}

function formatPercent(value: number | null): string {
  if (value === null) return "–"
  return `${(value * 100).toFixed(1)} %`
}

function formatMs(value: number | null): string {
  if (value === null) return "–"
  return `${value} ms`
}

function sumImageResultValues(
  result: BenchmarkResponse,
  key: "truePositives" | "falsePositives" | "falseNegatives",
): number | null {
  if (result.imageResults.length === 0) return null

  return result.imageResults.reduce((sum, imageResult) => {
    return sum + (imageResult[key] ?? 0)
  }, 0)
}

interface MetaRowProps {
  label: string
  value: string | null
}

function MetaRow({ label, value }: MetaRowProps) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value ?? "–"}</span>
    </div>
  )
}

export function BenchmarkResultView({ result, status }: BenchmarkResultViewProps) {
  if (status !== "success" || !result) return null

  const truePositives = sumImageResultValues(result, "truePositives")
  const falsePositives = sumImageResultValues(result, "falsePositives")
  const falseNegatives = sumImageResultValues(result, "falseNegatives")

  const accuracy =
    truePositives !== null &&
    falsePositives !== null &&
    falseNegatives !== null &&
    truePositives + falsePositives + falseNegatives > 0
      ? truePositives / (truePositives + falsePositives + falseNegatives)
      : null

  const processedImages =
    result.totalImages !== null && result.failedImages !== null
      ? result.totalImages - result.failedImages
      : null

  const failedImageResults = result.imageResults.filter((imageResult) => imageResult.error)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-bold text-foreground">Benchmark-Ergebnis</h3>
        <BenchmarkReportExportButton result={result} />
      </div>

      <BenchmarkAccuracyGauge value={accuracy} />

      <BenchmarkMetricCards
        metrics={[
          { label: "Precision", value: formatPercent(result.precision) },
          { label: "Recall", value: formatPercent(result.recall) },
          { label: "F1-Score", value: formatPercent(result.f1Score) },
          { label: "mAP", value: formatPercent(result.mAP) },
        ]}
      />

      <BenchmarkConfusionBars
        truePositives={truePositives}
        falsePositives={falsePositives}
        falseNegatives={falseNegatives}
      />

      <div className="rounded-lg border border-border bg-card/50 p-4 divide-y divide-border">
        <MetaRow
          label="Bilder gesamt"
          value={result.totalImages === null ? null : String(result.totalImages)}
        />
        <MetaRow
          label="Verarbeitete Bilder"
          value={processedImages === null ? null : String(processedImages)}
        />
        <MetaRow
          label="Fehlerhafte Bilder"
          value={result.failedImages === null ? null : String(result.failedImages)}
        />
        <MetaRow label="Verarbeitungszeit" value={formatMs(result.processingTimeMs)} />
        <MetaRow label="Model-Version" value={result.modelVersion} />
        <MetaRow label="Request ID" value={result.requestId} />
      </div>

      <div className="rounded-lg border border-border bg-card/50 p-4">
        <h4 className="font-semibold text-foreground mb-2">Nicht auswertbare Bilder</h4>

        {failedImageResults.length > 0 ? (
          <ul className="space-y-1 text-sm text-muted-foreground">
            {failedImageResults.map((imageResult) => (
              <li key={imageResult.imageId ?? imageResult.error}>
                {imageResult.imageId ?? "Unbekanntes Bild"}: {imageResult.error}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Keine nicht auswertbaren Bilder vorhanden.
          </p>
        )}
      </div>

      <BenchmarkImageResultList imageResults={result.imageResults} />
    </div>
  )
}