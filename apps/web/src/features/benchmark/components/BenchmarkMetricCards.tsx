interface MetricCard {
  label: string
  value: string
  description: string
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
          className="group relative flex flex-col items-center gap-1 p-4 rounded-lg border-2 border-border bg-card/50"
        >
          <span className="text-2xl font-bold text-foreground">
            {metric.value}
          </span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {metric.label}
          </span>

          <div className="absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 rounded-md bg-popover p-2 text-center text-xs text-popover-foreground shadow-md border border-border pointer-events-none
              opacity-0 scale-95 transition-all duration-150
              group-hover:opacity-100 group-hover:scale-100"
            >
              {metric.description}
              <div className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 bg-popover border-b border-r border-border rotate-45" />
          </div>
        </div>
      ))}
    </div>
  )
}