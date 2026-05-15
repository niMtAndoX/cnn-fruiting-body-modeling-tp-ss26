interface BenchmarkConfusionBarsProps {
  truePositives: number | null
  falsePositives: number | null
  falseNegatives: number | null
}

interface ConfusionBarItem {
  label: string
  value: number | null
}

export function BenchmarkConfusionBars({
  truePositives,
  falsePositives,
  falseNegatives,
}: BenchmarkConfusionBarsProps) {
  const items: ConfusionBarItem[] = [
    { label: "True Positives", value: truePositives },
    { label: "False Positives", value: falsePositives },
    { label: "False Negatives", value: falseNegatives },
  ]

  const maxValue = Math.max(...items.map((item) => item.value ?? 0), 1)

  return (
    <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
      <h4 className="font-semibold text-foreground">TP / FP / FN Übersicht</h4>

      <div className="space-y-3">
        {items.map((item) => {
          const value = item.value ?? 0
          const width = `${(value / maxValue) * 100}%`

          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-mono text-foreground">
                  {item.value === null ? "–" : item.value}
                </span>
              </div>

              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}