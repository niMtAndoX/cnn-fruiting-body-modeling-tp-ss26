"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { AnalysisResult } from "@/app/page"
import { cn } from "@/lib/utils"

interface HistorySectionProps {
  history: AnalysisResult[]
  selectedIndex: number | null
  onSelect: (index: number) => void
  onAnalyze: () => void
  isAnalyzing: boolean
  hasImage: boolean
}

const PLACEHOLDER_COLORS = ["#016401", "#074710", "#2B1A17", "#4A2C2A", "#654422"]

function MushroomIcon({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className="size-full"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Mushroom cap */}
      <ellipse cx="20" cy="15" rx="14" ry="10" fill={color} />
      {/* Mushroom stem */}
      <rect x="14" y="22" width="12" height="12" rx="2" fill={color} opacity="0.7" />
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
}: HistorySectionProps) {
  // Fill remaining slots with placeholders
  const displayItems = [...history]
  while (displayItems.length < 5) {
    displayItems.push(null as unknown as AnalysisResult)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-foreground font-semibold">Letzte 5 Bilder</h3>

      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {displayItems.map((item, index) => (
          <button
            key={item?.id || `placeholder-${index}`}
            onClick={() => item && onSelect(index)}
            disabled={!item}
            className={cn(
              "aspect-square border-2 rounded-lg overflow-hidden transition-all",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              item
                ? "border-border hover:border-primary cursor-pointer"
                : "border-border/50 cursor-default opacity-50",
              selectedIndex === index && "border-primary ring-2 ring-primary/30"
            )}
            aria-label={item ? `Analyseergebnis ${index + 1}` : `Platzhalter ${index + 1}`}
          >
            {item ? (
              <img
                src={item.imageUrl}
                alt={`Analyseergebnis ${index + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted/50 flex items-center justify-center p-2">
                <MushroomIcon color={PLACEHOLDER_COLORS[index % 5]} />
              </div>
            )}
          </button>
        ))}
      </div>

      <Button
        onClick={onAnalyze}
        disabled={!hasImage || isAnalyzing}
        className="w-full h-12 text-lg bg-primary text-primary-foreground hover:bg-accent disabled:opacity-50"
      >
        {isAnalyzing ? (
          <>
            <Spinner className="size-5" />
            Analysiere...
          </>
        ) : (
          "Jetzt analysieren!"
        )}
      </Button>
    </div>
  )
}
