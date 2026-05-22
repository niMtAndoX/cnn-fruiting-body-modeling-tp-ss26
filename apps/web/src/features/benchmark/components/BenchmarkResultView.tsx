import { type BenchmarkResponse, type BenchmarkStatus } from "../model/benchmarkTypes"
import { BenchmarkHeroGauge } from "./BenchmarkHeroGauge"
import { BenchmarkConfusionBars } from "./BenchmarkConfusionBars"
import { BenchmarkImageResultList } from "./BenchmarkImageResultList"
import { BenchmarkMetricCards } from "./BenchmarkMetricCards"
import { BenchmarkReportExportButton } from "./BenchmarkReportExportButton"

interface BenchmarkResultViewProps {
  result: BenchmarkResponse | null
  status: BenchmarkStatus
}

function formatPercent(value: number | null): string {
  if (value === null) return "-"
  return `${(value * 100).toFixed(1)} %`
}

function formatMs(value: number | null): string {
  if (value === null) return "-"
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

function MetaRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-[22px] border border-[#314a37]/10 bg-white/82 px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#586c5f]">{label}</p>
      <p className="mt-2 font-mono text-base font-semibold text-[#213126]">{value ?? "-"}</p>
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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(24,34,28,0.8),rgba(44,58,46,0.72))] px-5 py-5 shadow-[0_20px_60px_rgba(14,22,17,0.2)] sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
            Auswertung
          </p>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Benchmark-Ergebnis
          </h3>
        </div>
        <BenchmarkReportExportButton result={result} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <BenchmarkHeroGauge
          value={result.f1Score}
          description="Beurteilung des Modells durch das Zusammenspiel von Praezision und Recall."
        />

        <BenchmarkMetricCards
          metrics={[
            {
              label: "Precision",
              value: formatPercent(result.precision),
              description: "Korrekte positive Vorhersagen.",
            },
            {
              label: "Recall",
              value: formatPercent(result.recall),
              description: "Erkannte positive Faelle.",
            },
            {
              label: "Accuracy",
              value: formatPercent(accuracy),
              description: "Korrekte Vorhersagen gesamt.",
            },
            {
              label: "mAP",
              value: formatPercent(result.mAP),
              description: "Mittlere Praezision ueber den Lauf.",
            },
          ]}
        />
      </div>

      <BenchmarkConfusionBars
        truePositives={truePositives}
        falsePositives={falsePositives}
        falseNegatives={falseNegatives}
      />

      <div className="rounded-[28px] border border-[#314a37]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(244,239,231,0.88))] p-5 shadow-[0_18px_50px_rgba(31,49,36,0.06)]">
        <h4 className="text-lg font-semibold tracking-tight text-[#213126]">Nicht auswertbare Bilder</h4>

        {failedImageResults.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm text-[#687a6d]">
            {failedImageResults.map((imageResult) => (
              <li
                key={imageResult.imageId ?? imageResult.error}
                className="rounded-[18px] border border-[#314a37]/10 bg-white/70 px-4 py-3"
              >
                <span className="font-medium text-[#213126]">
                  {imageResult.imageId ?? "Unbekanntes Bild"}
                </span>
                {": "}
                {imageResult.error}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[#687a6d]">Keine nicht auswertbaren Bilder vorhanden.</p>
        )}
      </div>

      <BenchmarkImageResultList imageResults={result.imageResults} />
    </div>
  )
}
