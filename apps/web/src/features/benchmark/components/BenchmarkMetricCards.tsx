interface MetricCard {
  label: string
  value: string
}

interface BenchmarkMetricCardsProps {
  metrics: MetricCard[]
}

export function BenchmarkMetricCards({ metrics }: BenchmarkMetricCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="flex flex-col items-center gap-1 p-4 rounded-lg border-2 border-border bg-card/50"
        >
          <span className="text-2xl font-bold text-foreground">
            {metric.value}
          </span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {metric.label}
          </span>
        </div>
      ))}
    </div>
  )
}