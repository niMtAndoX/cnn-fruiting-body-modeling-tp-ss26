interface BenchmarkAccuracyGaugeProps {
  value: number | null
}

export function BenchmarkAccuracyGauge({
  value,
}: BenchmarkAccuracyGaugeProps) {
  const percentage =
    value === null ? 0 : Math.max(0, Math.min(100, value * 100))

  return (
    <div className="rounded-xl border-2 border-border bg-card/50 p-6 flex flex-col items-center justify-center">
      <div className="relative w-32 h-32 rounded-full border-8 border-muted flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full border-8 border-green-700"
          style={{
            clipPath: `inset(${100 - percentage}% 0 0 0)`,
          }}
        />

        <span className="text-3xl font-bold text-foreground">
          {value === null ? "–" : `${percentage.toFixed(0)}%`}
        </span>
      </div>

      <span className="mt-4 text-sm uppercase tracking-wide text-muted-foreground">
        Accuracy
      </span>
    </div>
  )
}