interface BenchmarkConfusionBarsProps {
  truePositives: number | null
  falsePositives: number | null
  falseNegatives: number | null
}

interface ConfusionBarItem {
  label: string
  shortLabel: string
  value: number | null
  barClassName: string
  accentClassName: string
}

export function BenchmarkConfusionBars({
  truePositives,
  falsePositives,
  falseNegatives,
}: BenchmarkConfusionBarsProps) {
  const items: ConfusionBarItem[] = [
    {
      label: "True Positives",
      shortLabel: "TP",
      value: truePositives,
      barClassName: "bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600",
      accentClassName: "bg-gradient-to-br from-emerald-600 to-teal-600",
    },
    {
      label: "False Positives",
      shortLabel: "FP",
      value: falsePositives,
      barClassName: "bg-gradient-to-r from-amber-700 via-orange-700 to-orange-600",
      accentClassName: "bg-gradient-to-br from-amber-700 to-orange-700",
    },
    {
      label: "False Negatives",
      shortLabel: "FN",
      value: falseNegatives,
      barClassName: "bg-gradient-to-r from-rose-800 via-red-700 to-red-600",
      accentClassName: "bg-gradient-to-br from-rose-700 to-red-700",
    },
  ]

  const total = items.reduce((sum, item) => sum + (item.value ?? 0), 0)
  const safeTotal = Math.max(total, 1)

  return (
    <div className="space-y-4 rounded-[28px] border border-[#314a37]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(244,239,231,0.88))] p-5 shadow-[0_18px_50px_rgba(31,49,36,0.06)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#627966]">
            Fehlerverteilung
          </p>
          <h4 className="mt-1 text-lg font-semibold tracking-tight text-[#213126]">
            TP / FP / FN Uebersicht
          </h4>
        </div>
        <span className="rounded-full border border-[#314a37]/10 bg-white/70 px-3 py-1 text-xs text-[#63776a]">
          Gesamt: {total}
        </span>
      </div>

      <div className="flex h-4 w-full overflow-hidden rounded-full bg-[#dfe6dd]">
        {items.map((item) => {
          const value = item.value ?? 0
          const width = total > 0 ? `${(value / safeTotal) * 100}%` : "0%"

          return (
            <div
              key={item.shortLabel}
              className={`h-full ${item.barClassName}`}
              style={{ width }}
              title={`${item.label}: ${value}`}
            />
          )
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.shortLabel}
            className="rounded-[22px] border border-[#314a37]/10 bg-white/72 p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ring-1 ring-black/10 ${item.accentClassName}`} />
              <span className="text-sm font-medium text-[#213126]">{item.shortLabel}</span>
            </div>

            <p className="mt-3 text-3xl font-semibold tracking-tight text-[#213126]">
              {item.value ?? "–"}
            </p>

            <p className="mt-1 text-sm text-[#6a7b6f]">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
