"use client"

import { AlertTriangle, Camera, Search, Check, TerminalSquare } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { PredictionStatus } from "@/features/prediction/components/PredictionStatus"
import type { LogEntry, PredictionFlowStatus } from "@/features/prediction/model/prediction"

interface LogPanelProps {
  errorMessage?: string | null
  hasImage?: boolean
  logs: LogEntry[]
  isAnalyzing: boolean
  status: PredictionFlowStatus
}

function LogIcon({ type }: { type: LogEntry["icon"] }) {
  switch (type) {
    case "camera":
      return <Camera className="size-4 shrink-0 text-stone-300" />
    case "search":
      return <Search className="size-4 shrink-0 text-emerald-300" />
    case "check":
      return <Check className="size-4 shrink-0 text-emerald-300" />
    case "error":
      return <AlertTriangle className="size-4 shrink-0 text-red-300" />
    default:
      return null
  }
}

export function LogPanel({
  errorMessage = null,
  hasImage = false,
  logs,
  isAnalyzing,
  status,
}: LogPanelProps) {
  return (
    <div className="flex aspect-square flex-col overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(24,33,27,0.95),rgba(30,42,34,0.92))] shadow-[0_22px_70px_rgba(18,28,23,0.24)] md:aspect-auto md:min-h-[420px]">
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
            Protokoll
          </p>
          <h3 className="mt-1 text-base font-semibold text-stone-50">Analyse-Log</h3>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-stone-300">
          <TerminalSquare className="size-3.5" />
          Live Status
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {logs.length === 0 && !isAnalyzing ? (
          <PredictionStatus status={status} errorMessage={errorMessage} hasImage={hasImage} />
        ) : (
          <>
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-[auto_auto_1fr] items-start gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3 text-sm"
                >
                  <LogIcon type={log.icon} />
                  <span className="pt-0.5 font-mono text-[11px] text-stone-400">[{log.timestamp}]</span>
                  <span className={log.icon === "error" ? "text-red-100" : "text-stone-100"}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>

            {isAnalyzing && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/15 bg-emerald-400/8 px-3 py-3 text-sm text-emerald-50">
                <Spinner className="size-4" />
                <span>Verarbeitung läuft...</span>
              </div>
            )}

            {!isAnalyzing && (
              <PredictionStatus status={status} errorMessage={errorMessage} hasImage={hasImage} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
