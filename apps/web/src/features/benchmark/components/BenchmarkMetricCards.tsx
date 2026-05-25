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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="flex h-full min-h-[10.5rem] flex-col justify-between rounded-[24px] border border-[#314a37]/10 bg-white/78 p-5 shadow-[0_12px_35px_rgba(31,49,36,0.05)]"
        >
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#5e7364]">
              {metric.label}
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-[#213126]">
              {metric.value}
            </p>
          </div>
          <p className="mt-4 text-sm leading-6 text-[#6b7b70]">{metric.description}</p>
        </div>
      ))}
    </div>
  )
}
