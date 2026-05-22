import { type ImageBenchmarkResult } from "../model/benchmarkTypes"

interface BenchmarkImageResultListProps {
  imageResults: ImageBenchmarkResult[]
}

function formatNumber(value: number | null): string {
  return value === null ? "–" : String(value)
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#697b70]">
        {label}
      </span>
      <span className="mt-1 block font-mono text-sm text-[#213126]">{value}</span>
    </div>
  )
}

export function BenchmarkImageResultList({
  imageResults,
}: BenchmarkImageResultListProps) {
  if (imageResults.length === 0) {
    return (
      <div className="rounded-[28px] border border-[#314a37]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(244,239,231,0.88))] p-5 shadow-[0_18px_50px_rgba(31,49,36,0.06)]">
        <h4 className="text-lg font-semibold tracking-tight text-[#213126]">Detailansicht pro Bild</h4>
        <p className="mt-2 text-sm text-[#687a6d]">Keine Bilddetails vorhanden.</p>
      </div>
    )
  }

  return (
    <div className="rounded-[28px] border border-[#314a37]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(244,239,231,0.88))] p-5 shadow-[0_18px_50px_rgba(31,49,36,0.06)]">
      <div className="flex flex-col gap-2 border-b border-[#314a37]/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#627966]">
            Detailansicht
          </p>
          <h4 className="mt-1 text-lg font-semibold tracking-tight text-[#213126]">
            Ergebnisse pro Bild
          </h4>
        </div>
        <span className="text-sm text-[#687a6d]">{imageResults.length} Eintraege</span>
      </div>

      <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto pr-1">
        {imageResults.map((imageResult) => (
          <div
            key={imageResult.imageId ?? imageResult.error}
            className="rounded-[22px] border border-[#314a37]/10 bg-white/74 p-4 shadow-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-[#213126]">
                  {imageResult.imageId ?? "Unbekanntes Bild"}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#6a7b6f]">
                  {imageResult.error ? "Fehlerhaft" : "Ausgewertet"}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  imageResult.error
                    ? "border border-red-300/25 bg-red-50 text-red-700"
                    : "border border-emerald-800/10 bg-emerald-50 text-emerald-800"
                }`}
              >
                {imageResult.error ? "Fehler" : "OK"}
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-5">
              <StatCell label="Ground Truth" value={formatNumber(imageResult.groundTruthCount)} />
              <StatCell label="Predictions" value={formatNumber(imageResult.predictedCount)} />
              <StatCell label="TP" value={formatNumber(imageResult.truePositives)} />
              <StatCell label="FP" value={formatNumber(imageResult.falsePositives)} />
              <StatCell label="FN" value={formatNumber(imageResult.falseNegatives)} />
            </div>

            {imageResult.error && (
              <p className="mt-4 break-words rounded-2xl border border-red-300/20 bg-red-50/70 px-3 py-3 text-sm text-[#6a5555]">
                {imageResult.error}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
