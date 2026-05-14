import { type ImageBenchmarkResult } from "../model/benchmarkTypes"

interface BenchmarkImageResultListProps {
  imageResults: ImageBenchmarkResult[]
}

function formatNumber(value: number | null): string {
  return value === null ? "–" : String(value)
}

export function BenchmarkImageResultList({
  imageResults,
}: BenchmarkImageResultListProps) {
  if (imageResults.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card/50 p-4">
        <h4 className="font-semibold text-foreground mb-2">
          Detailansicht pro Bild
        </h4>
        <p className="text-sm text-muted-foreground">
          Keine Bilddetails vorhanden.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card/50 p-4">
      <h4 className="font-semibold text-foreground mb-3">
        Detailansicht pro Bild
      </h4>

      <div className="max-h-80 overflow-y-auto space-y-2">
        {imageResults.map((imageResult) => (
          <div
            key={imageResult.imageId ?? imageResult.error}
            className="rounded-md border border-border bg-background/60 p-3 text-sm"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-medium text-foreground">
                {imageResult.imageId ?? "Unbekanntes Bild"}
              </span>

              <span className="text-xs text-muted-foreground">
                {imageResult.error ? "Fehler" : "Ausgewertet"}
              </span>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-5">
              <div>
                <span className="block text-xs text-muted-foreground">
                  Ground Truth
                </span>
                <span className="font-mono text-foreground">
                  {formatNumber(imageResult.groundTruthCount)}
                </span>
              </div>

              <div>
                <span className="block text-xs text-muted-foreground">
                  Predictions
                </span>
                <span className="font-mono text-foreground">
                  {formatNumber(imageResult.predictedCount)}
                </span>
              </div>

              <div>
                <span className="block text-xs text-muted-foreground">
                  TP
                </span>
                <span className="font-mono text-foreground">
                  {formatNumber(imageResult.truePositives)}
                </span>
              </div>

              <div>
                <span className="block text-xs text-muted-foreground">
                  FP
                </span>
                <span className="font-mono text-foreground">
                  {formatNumber(imageResult.falsePositives)}
                </span>
              </div>

              <div>
                <span className="block text-xs text-muted-foreground">
                  FN
                </span>
                <span className="font-mono text-foreground">
                  {formatNumber(imageResult.falseNegatives)}
                </span>
              </div>
            </div>

            {imageResult.error && (
              <p className="mt-3 text-xs text-muted-foreground break-words">
                {imageResult.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}