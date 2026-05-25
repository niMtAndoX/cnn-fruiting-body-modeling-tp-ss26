import { cn } from "@/lib/utils"

import type { PredictionFlowStatus } from "../model/prediction"

interface PredictionStatusProps {
  errorMessage?: string | null
  hasImage?: boolean
  status: PredictionFlowStatus
}

function getStatusCopy(status: PredictionFlowStatus, hasImage: boolean, errorMessage?: string | null) {
  switch (status) {
    case "loading":
      return {
        description: "Das Bild wird gerade an das Backend übermittelt und verarbeitet.",
        title: "Analyse läuft",
        tone: "info",
      } as const
    case "success":
      return {
        description: "Die Erkennung war erfolgreich und es wurden Treffer gefunden.",
        title: "Analyse erfolgreich",
        tone: "success",
      } as const
    case "empty":
      return {
        description: "Die Anfrage war erfolgreich, aber im Bild wurde nichts erkannt.",
        title: "Analyse erfolgreich ohne Treffer",
        tone: "success",
      } as const
    case "error":
      return {
        description: errorMessage ?? "Die Analyse konnte nicht abgeschlossen werden.",
        title: "Analyse fehlgeschlagen",
        tone: "error",
      } as const
    case "idle":
    default:
      return hasImage
        ? {
            description: "Das Bild ist bereit und kann jetzt analysiert werden.",
            title: "Bild bereit",
            tone: "idle",
          }
        : {
            description: "Lade ein Bild hoch, um eine Analyse zu starten.",
            title: "Warte auf Analyse",
            tone: "idle",
          }
    }
}

export function PredictionStatus({
  errorMessage = null,
  hasImage = false,
  status,
}: PredictionStatusProps) {
  const copy = getStatusCopy(status, hasImage, errorMessage)

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm shadow-sm",
        copy.tone === "error" && "border-red-400/25 bg-red-950/25 text-red-50",
        copy.tone === "success" && "border-emerald-300/20 bg-emerald-400/10 text-emerald-50",
        copy.tone === "info" && "border-[#d9c6aa]/22 bg-white/8 text-stone-100",
        copy.tone === "idle" && "border-white/10 bg-white/5 text-stone-200/90",
      )}
    >
      <p className="font-semibold tracking-tight">{copy.title}</p>
      <p
        className={cn(
          "mt-1 text-xs leading-5",
          copy.tone === "error" ? "text-red-100/85" : "text-inherit opacity-85",
        )}
      >
        {copy.description}
      </p>
    </div>
  )
}
