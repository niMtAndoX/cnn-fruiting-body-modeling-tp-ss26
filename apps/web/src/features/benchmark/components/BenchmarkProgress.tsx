import { Loader2, XCircle } from "lucide-react"
import { type BenchmarkStatus } from "../model/benchmarkTypes"

interface BenchmarkProgressProps {
  status: BenchmarkStatus
  error: string | null
}

export function BenchmarkProgress({ status, error }: BenchmarkProgressProps) {
  if (status === "loading") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/30">
        <Loader2 className="size-5 text-primary animate-spin shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Benchmark wird durchgeführt...</p>
          <p className="text-xs text-muted-foreground">Bilder werden verarbeitet. Dies kann einige Minuten dauern.</p>
        </div>
      </div>
    )
  }

  if (status === "error" && error) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10">
        <XCircle className="size-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-destructive">Benchmark fehlgeschlagen</p>
          <p className="text-sm text-foreground mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return null
}
