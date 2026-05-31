import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface ModelSelectorProps {
  availableModels: string[]
  className?: string
  errorMessage?: string | null
  isLoading?: boolean
  onModelChange: (modelVersion: string) => void
  selectedModelVersion: string | null
}

export function ModelSelector({
  availableModels,
  className,
  errorMessage,
  isLoading = false,
  onModelChange,
  selectedModelVersion,
}: ModelSelectorProps) {
  const isDisabled = isLoading || availableModels.length === 0
  const placeholder = isLoading
    ? "Modelle laden..."
    : errorMessage
      ? "Modelle nicht verfügbar"
      : "Modell wählen"

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="shrink-0 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#627966]">
        Modell
      </span>

      <Select
        value={selectedModelVersion ?? undefined}
        onValueChange={onModelChange}
        disabled={isDisabled}
      >
        <SelectTrigger
          aria-label="Modell auswählen"
          size="sm"
          className="h-10 min-w-[210px] rounded-2xl border-[#314a37]/12 bg-[#fbfaf7]/90 text-[#213126] shadow-[0_12px_30px_rgba(33,49,38,0.06)] backdrop-blur-sm"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="rounded-2xl border-[#314a37]/10 bg-[#fbfaf7] text-[#213126] shadow-[0_18px_42px_rgba(33,49,38,0.10)]">
          {availableModels.map((modelVersion) => (
            <SelectItem
              key={modelVersion}
              value={modelVersion}
              className="rounded-xl focus:bg-[#edf2ea] focus:text-[#213126]"
            >
              {modelVersion}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
