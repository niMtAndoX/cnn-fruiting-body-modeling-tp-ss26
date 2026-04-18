"use client"

import { AlertTriangle, Camera, Search, Check } from "lucide-react"
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
      return <Camera className="size-4 flex-shrink-0 text-yellow-300" />
    case "search":
      return <Search className="size-4 flex-shrink-0 text-yellow-300" />
    case "check":
      return <Check className="size-4 flex-shrink-0 text-yellow-300" />
    case "error":
      return <AlertTriangle className="size-4 flex-shrink-0 text-red-300" />
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
    <div className="aspect-square md:aspect-auto md:min-h-[300px] bg-[#594134] rounded-lg p-4 overflow-hidden flex flex-col">
      <h3 className="text-yellow-300 font-semibold mb-3 text-sm">Analyse-Log</h3>
      
      <div className="flex-1 overflow-y-auto space-y-2">
        {logs.length === 0 && !isAnalyzing ? (
          <PredictionStatus status={status} errorMessage={errorMessage} hasImage={hasImage} />
        ) : (
          <>
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2 text-log-text text-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <LogIcon type={log.icon} />
                <span className="text-yellow-300/70 font-mono text-xs">
                  [{log.timestamp}]
                </span>
                <span className={`flex-1 ${log.icon === "error" ? "text-red-200" : "text-yellow-300"}`}>
                  {log.message}
                </span>
              </div>
            ))}
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-yellow-300 text-sm ">
                <Spinner className="size-4" />
                <span>Verarbeitung...</span>
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
