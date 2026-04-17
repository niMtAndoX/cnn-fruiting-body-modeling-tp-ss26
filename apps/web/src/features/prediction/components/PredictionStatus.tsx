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
        description: "Das Bild wird gerade an das Backend gesendet und verarbeitet.",
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
            description: "Das Bild ist bereit. Du kannst die Analyse jetzt starten.",
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
        "rounded-md border px-3 py-2 text-sm",
        copy.tone === "error" && "border-destructive/50 bg-destructive/15 text-destructive-foreground",
        copy.tone === "success" && "border-yellow-300/30 bg-yellow-300/10 text-yellow-300",
        copy.tone === "info" && "border-yellow-300/30 bg-yellow-300/10 text-yellow-300",
        copy.tone === "idle" && "border-yellow-300/20 bg-transparent text-yellow-300/80",
      )}
    >
      <p className="font-medium">{copy.title}</p>
      <p className={cn("mt-1 text-xs", copy.tone === "error" ? "text-destructive-foreground/80" : "text-inherit")}>
        {copy.description}
      </p>
    </div>
  )
}
