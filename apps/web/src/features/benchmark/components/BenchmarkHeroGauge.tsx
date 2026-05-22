interface BenchmarkHeroGaugeProps {
  value: number | null
  description: string
}

export function BenchmarkHeroGauge({
  value, description
}: BenchmarkHeroGaugeProps) {
  const percentage =
    value === null ? 0 : Math.max(0, Math.min(100, value * 100))

  return (
    <div className="group relative rounded-xl border-2 border-border bg-card/50 p-6 flex flex-col items-center justify-center">
      <div className="relative w-32 h-32 rounded-full border-8 border-muted flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full border-8 border-emerald-600"
          style={{
            clipPath: `inset(${100 - percentage}% 0 0 0)`,
          }}
        />

        <span className="text-3xl font-bold text-foreground">
          {value === null ? "–" : `${percentage.toFixed(0)}%`}
        </span>
      </div>

      <span className="mt-4 text-sm uppercase tracking-wide text-muted-foreground">
        F1-Score
      </span>

      <div className="absolute bottom-full left-1/2 z-10 mb-2 w-48 -translate-x-1/2 rounded-md bg-popover p-2 text-center text-xs text-popover-foreground shadow-md border border-border pointer-events-none
          opacity-0 scale-95 transition-all duration-150
          group-hover:opacity-100 group-hover:scale-100"
      >
        {description}
        <div className="absolute top-full left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 bg-popover border-b border-r border-border rotate-45" />
      </div>
    </div>
  )
}
