interface BenchmarkConfusionBarsProps {
  truePositives: number | null
  falsePositives: number | null
  falseNegatives: number | null
}

interface ConfusionBarItem {
  label: string
  shortLabel: string
  value: number | null
  colorClassName: string
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
      colorClassName: "bg-emerald-600",
    },
    {
      label: "False Positives",
      shortLabel: "FP",
      value: falsePositives,
      colorClassName: "bg-orange-500",
    },
    {
      label: "False Negatives",
      shortLabel: "FN",
      value: falseNegatives,
      colorClassName: "bg-red-600",
    },
  ]

  const total = items.reduce((sum, item) => sum + (item.value ?? 0), 0)
  const safeTotal = Math.max(total, 1)

  return (
    <div className="rounded-lg border border-border bg-card/50 p-4 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h4 className="font-semibold text-foreground">TP / FP / FN Übersicht</h4>
        <span className="text-sm text-muted-foreground">Gesamt: {total}</span>
      </div>

      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {items.map((item) => {
          const value = item.value ?? 0
          const width = total > 0 ? `${(value / safeTotal) * 100}%` : "0%"

          return (
            <div
              key={item.shortLabel}
              className={`h-full ${item.colorClassName}`}
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
            className="rounded-md border border-border bg-background/40 p-3"
          >
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${item.colorClassName}`} />
              <span className="text-sm font-medium text-foreground">
                {item.shortLabel}
              </span>
            </div>

            <p className="mt-2 text-2xl font-bold text-foreground">
              {item.value ?? "–"}
            </p>

            <p className="text-xs text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}