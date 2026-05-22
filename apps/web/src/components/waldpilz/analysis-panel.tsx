"use client"

import { X, ScanSearch } from "lucide-react"
import { BoundingBoxOverlay } from "@/features/prediction/components/BoundingBoxOverlay"
import type { PredictionBoundingBox } from "@/features/prediction/model/prediction"

interface AnalysisPanelProps {
  imageUrl: string | null
  boundingBoxes: PredictionBoundingBox[]
  onClose?: () => void
}

function MushroomPlaceholder() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="size-24 opacity-80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="50" cy="35" rx="35" ry="25" className="fill-[#29402f]/30" />
      <circle cx="40" cy="30" r="4" className="fill-[#29402f]/12" />
      <circle cx="55" cy="25" r="3" className="fill-[#29402f]/12" />
      <circle cx="60" cy="38" r="5" className="fill-[#29402f]/12" />
      <path d="M35 50 Q35 80 40 85 L60 85 Q65 80 65 50 Z" className="fill-[#29402f]/22" />
      <ellipse cx="50" cy="88" rx="30" ry="5" className="fill-[#29402f]/12" />
    </svg>
  )
}

export function AnalysisPanel({ imageUrl, boundingBoxes, onClose }: AnalysisPanelProps) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#314a37]/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(244,239,230,0.88))] shadow-[0_20px_60px_rgba(36,45,35,0.08)]">
      <div className="flex items-center justify-between border-b border-[#314a37]/10 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#627966]">
            Vorschau
          </p>
          <h3 className="mt-1 text-base font-semibold text-[#213126]">Analyseflaeche</h3>
        </div>

        <div className="flex items-center gap-2">
          {imageUrl && (
            <span className="inline-flex items-center rounded-full border border-emerald-800/10 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-900">
              {boundingBoxes.length} Treffer
            </span>
          )}
          {imageUrl && onClose && (
            <button
              onClick={onClose}
              className="flex size-9 items-center justify-center rounded-full border border-[#314a37]/12 bg-white/80 text-[#2a3c2f] transition-colors hover:bg-white"
              aria-label="Bild entfernen"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="relative aspect-square bg-[radial-gradient(circle_at_top,rgba(229,239,228,0.8),rgba(240,235,226,0.9)_52%,rgba(227,220,208,0.88))] md:min-h-[420px]">
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt="Hochgeladenes Bild"
              className="h-full w-full object-contain"
            />
            <BoundingBoxOverlay boxes={boundingBoxes} />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-[22px] bg-white/72 text-[#26402d] shadow-inner">
              <ScanSearch className="size-8" />
            </div>
            <MushroomPlaceholder />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#223127]">Noch kein Bild geladen</p>
              <p className="text-xs leading-5 text-[#67786c]">
                Nach dem Upload erscheint die Bildvorschau hier inklusive Bounding-Box-Overlay.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
