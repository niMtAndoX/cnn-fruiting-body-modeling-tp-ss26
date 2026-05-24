import { Loader2, XCircle } from "lucide-react"
import { type BenchmarkStatus } from "../model/benchmarkTypes"

interface BenchmarkProgressProps {
  status: BenchmarkStatus
  error: string | null
}

export function BenchmarkProgress({ status, error }: BenchmarkProgressProps) {
  if (status === "loading") {
    return (
      <div className="flex items-start gap-4 rounded-[24px] border border-emerald-800/10 bg-[linear-gradient(180deg,rgba(239,247,240,0.95),rgba(231,242,232,0.9))] p-4 shadow-[0_14px_35px_rgba(35,57,39,0.07)]">
        <div className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-white/80 text-[#2d5b3b]">
          <Loader2 className="size-5 animate-spin" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#213126]">Benchmark wird durchgeführt</p>
          <p className="mt-1 text-sm leading-6 text-[#66796d]">
            Bilder werden verarbeitet und mit den Label-Daten abgeglichen. Je nach Datensatz kann
            dieser Schritt einige Minuten dauern.
          </p>
        </div>
      </div>
    )
  }

  if (status === "error" && error) {
    return (
      <div className="flex items-start gap-4 rounded-[24px] border border-red-300/25 bg-[linear-gradient(180deg,rgba(255,244,244,0.95),rgba(248,232,232,0.9))] p-4 shadow-[0_14px_35px_rgba(81,24,24,0.07)]">
        <div className="mt-0.5 flex size-11 items-center justify-center rounded-2xl bg-white/75 text-red-700">
          <XCircle className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-red-800">Benchmark fehlgeschlagen</p>
          <p className="mt-1 text-sm leading-6 text-[#5f4c4c]">{error}</p>
        </div>
      </div>
    )
  }

  return null
}
