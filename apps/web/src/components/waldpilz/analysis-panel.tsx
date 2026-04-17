"use client"

import { X } from "lucide-react"

interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

interface AnalysisPanelProps {
  imageUrl: string | null
  boundingBoxes: BoundingBox[]
  onClose?: () => void
}

function MushroomPlaceholder() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="size-24 opacity-30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="50" cy="35" rx="35" ry="25" className="fill-foreground/20" />
      <circle cx="40" cy="30" r="4" className="fill-foreground/10" />
      <circle cx="55" cy="25" r="3" className="fill-foreground/10" />
      <circle cx="60" cy="38" r="5" className="fill-foreground/10" />
      <path
        d="M35 50 Q35 80 40 85 L60 85 Q65 80 65 50 Z"
        className="fill-foreground/15"
      />
      <ellipse cx="50" cy="88" rx="30" ry="5" className="fill-foreground/10" />
    </svg>
  )
}

export function AnalysisPanel({ imageUrl, boundingBoxes, onClose }: AnalysisPanelProps) {
  return (
    <div className="relative aspect-square border-2 border-border rounded-lg overflow-hidden bg-muted/30">
      {imageUrl ? (
        <>
          <img
            src={imageUrl}
            alt="Hochgeladenes Bild"
            className="w-full h-full object-contain"
          />
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 text-foreground hover:text-foreground/70 transition-colors z-10 bg-background/80 rounded-full"
              aria-label="Bild entfernen"
            >
              <X className="size-6" />
            </button>
          )}

          <div className="absolute inset-0 pointer-events-none">
            {boundingBoxes.map((box, index) => (
              <div
                key={index}
                className="absolute border-2 rounded-sm"
                style={{
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.width}%`,
                  height: `${box.height}%`,
                  backgroundColor: "rgba(147, 51, 234, 0.3)",
                  borderColor: "rgba(147, 51, 234, 0.8)",
                }}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <MushroomPlaceholder />
        </div>
      )}
    </div>
  )
}