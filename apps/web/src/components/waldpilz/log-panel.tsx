"use client"

import { Camera, Search, Check } from "lucide-react"
import { LogEntry } from "@/app/page"
import { Spinner } from "@/components/ui/spinner"

interface LogPanelProps {
  logs: LogEntry[]
  isAnalyzing: boolean
}

function LogIcon({ type }: { type: LogEntry["icon"] }) {
  switch (type) {
    case "camera":
      return <Camera className="size-4 flex-shrink-0" />
    case "search":
      return <Search className="size-4 flex-shrink-0" />
    case "check":
      return <Check className="size-4 flex-shrink-0" />
    default:
      return null
  }
}

export function LogPanel({ logs, isAnalyzing }: LogPanelProps) {
  return (
    <div className="aspect-square md:aspect-auto md:min-h-[300px] bg-log-bg rounded-lg p-4 overflow-hidden flex flex-col">
      <h3 className="text-log-text font-semibold mb-3 text-sm">Analyse-Log</h3>
      
      <div className="flex-1 overflow-y-auto space-y-2">
        {logs.length === 0 && !isAnalyzing ? (
          <p className="text-log-text/70 text-sm italic">
            Warte auf Analyse...
          </p>
        ) : (
          <>
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2 text-log-text text-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <LogIcon type={log.icon} />
                <span className="text-log-text/70 font-mono text-xs">
                  [{log.timestamp}]
                </span>
                <span className="flex-1">{log.message}</span>
              </div>
            ))}
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-log-text text-sm">
                <Spinner className="size-4" />
                <span>Verarbeitung...</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
