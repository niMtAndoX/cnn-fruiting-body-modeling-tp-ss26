import { type BenchmarkResponse, type BenchmarkStatus } from "../model/benchmarkTypes"

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

interface MetricCardProps {
  label: string
  value: string
}

function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="flex flex-col items-center gap-1 p-4 rounded-lg border-2 border-border bg-card/50">
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  )
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

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-foreground">Benchmark-Ergebnis</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Precision" value={formatPercent(result.precision)} />
        <MetricCard label="Recall" value={formatPercent(result.recall)} />
        <MetricCard label="F1-Score" value={formatPercent(result.f1Score)} />
        <MetricCard label="mAP" value={formatPercent(result.mAP)} />
      </div>

      <div className="rounded-lg border border-border bg-card/50 p-4 divide-y divide-border">
        {result.totalImages !== null && (
          <MetaRow label="Verarbeitete Bilder" value={String(result.totalImages)} />
        )}
        <MetaRow label="Verarbeitungszeit" value={formatMs(result.processingTimeMs)} />
        <MetaRow label="Model-Version" value={result.modelVersion} />
        <MetaRow label="Request ID" value={result.requestId} />
      </div>
    </div>
  )
}
