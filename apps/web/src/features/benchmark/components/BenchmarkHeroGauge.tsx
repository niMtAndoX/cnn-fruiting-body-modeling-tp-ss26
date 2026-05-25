interface BenchmarkHeroGaugeProps {
  value: number | null
  description: string
}

export function BenchmarkHeroGauge({
  value,
  description,
}: BenchmarkHeroGaugeProps) {
  const percentage = value === null ? 0 : Math.max(0, Math.min(100, value * 100))

  return (
    <div className="rounded-[28px] border border-[#314a37]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(244,239,231,0.88))] p-6 shadow-[0_18px_50px_rgba(31,49,36,0.06)]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="flex justify-center">
          <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-[10px] border-[#dfe6dd] bg-white/70 shadow-inner">
            <div
              className="absolute inset-0 rounded-full border-[10px] border-emerald-600"
              style={{
                clipPath: `inset(${100 - percentage}% 0 0 0)`,
              }}
            />
            <span className="text-3xl font-semibold tracking-tight text-[#213126]">
              {value === null ? "–" : `${percentage.toFixed(0)}%`}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#627966]">
            Kernmetrik
          </p>
          <h3 className="text-xl font-semibold tracking-tight text-[#213126]">F1-Score</h3>
          <p className="max-w-xl text-sm leading-7 text-[#6a7b6f]">{description}</p>
        </div>
      </div>
    </div>
  )
}
