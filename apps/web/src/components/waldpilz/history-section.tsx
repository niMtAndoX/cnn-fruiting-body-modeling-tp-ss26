"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import type { AnalysisResult } from "@/features/prediction/model/prediction"

interface HistorySectionProps {
  history: AnalysisResult[]
  selectedIndex: number | null
  onSelect: (index: number) => void
  onAnalyze: () => void
  isAnalyzing: boolean
  hasImage: boolean
  hasResult: boolean
}

const PLACEHOLDER_COLORS = ["#56755a", "#44624a", "#6d5a49", "#7b6655", "#8d7761"]

function MushroomIcon({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className="size-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="20" cy="15" rx="14" ry="10" fill={color} />
      <rect x="14" y="22" width="12" height="12" rx="2" fill={color} opacity="0.72" />
    </svg>
  )
}

export function HistorySection({
  history,
  selectedIndex,
  onSelect,
  onAnalyze,
  isAnalyzing,
  hasImage,
  hasResult,
}: HistorySectionProps) {
  const displayItems = [...history]
  while (displayItems.length < 5) {
    displayItems.push(null as unknown as AnalysisResult)
  }

  return (
    <div className="space-y-5 rounded-[28px] border border-[#314a37]/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(243,239,231,0.88))] p-5 shadow-[0_18px_55px_rgba(35,43,35,0.07)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f7763]">
            Verlauf
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-[#213126]">
            Letzte Analysen
          </h3>
          <p className="mt-1 text-sm text-[#687a6d]">
            Öffne eines der letzten Bilder erneut oder starte eine neue Analyse mit dem aktuellen Bild.
          </p>
        </div>

        <div className="rounded-full border border-[#314a37]/10 bg-white/70 px-3 py-1 text-xs text-[#617468]">
          {history.length}/5 gespeichert
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {displayItems.map((item, index) => (
          <button
            key={item?.id || `placeholder-${index}`}
            onClick={() => item && onSelect(index)}
            disabled={!item}
            className={cn(
              "group aspect-square overflow-hidden rounded-[22px] border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700/35",
              item
                ? "border-[#314a37]/12 bg-white/80 shadow-sm hover:-translate-y-0.5 hover:border-emerald-800/25 hover:shadow-md"
                : "border-[#314a37]/8 bg-[#f1ece2]/65 opacity-75",
              selectedIndex === index && "border-emerald-700/35 ring-2 ring-emerald-700/20",
            )}
            aria-label={item ? `Analyseergebnis ${index + 1}` : `Platzhalter ${index + 1}`}
          >
            {item ? (
              <div className="relative h-full w-full">
                <img
                  src={item.imageUrl}
                  alt={`Analyseergebnis ${index + 1}`}
                  className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-2 py-2 text-left">
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone-100">
                    Analyse {index + 1}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center p-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-white/60 shadow-inner">
                  <MushroomIcon color={PLACEHOLDER_COLORS[index % 5]} />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 rounded-[24px] border border-[#7a563a]/10 bg-[linear-gradient(180deg,rgba(122,86,58,0.06),rgba(45,91,59,0.08))] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#56685b]">
          {hasImage
            ? "Das gewählte Bild ist bereit für die Analyse."
            : "Wähle ein Bild aus, um die Analyse zu starten."}
        </p>

        <Button
          onClick={onAnalyze}
          disabled={!hasImage || isAnalyzing}
          className="h-12 rounded-2xl bg-[#2d5b3b] px-6 text-base font-semibold text-white shadow-[0_18px_38px_rgba(45,91,59,0.28)] hover:bg-[#254b31] hover:shadow-[0_20px_44px_rgba(45,91,59,0.34)] disabled:opacity-60 sm:min-w-[15rem]"
        >
          {isAnalyzing ? (
            <>
              <Spinner className="size-5" />
              Analysiere...
            </>
          ) : hasResult ? (
            "Erneut analysieren"
          ) : hasImage ? (
            "Analyse starten"
          ) : (
            "Bild auswählen"
          )}
        </Button>
      </div>
    </div>
  )
}
