"use client"

import { Activity, AlertCircle, BarChart, CheckCircle2, Home, ScanSearch } from "lucide-react"
import { useCallback, useEffect, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import waldpilzLogo from "../WALDPILZ_Logo (1).png"

import { getHealthStatus } from "@/features/health/api/health"
import { getAssetSrc } from "@/lib/asset-src"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface HealthNotification {
  ok: boolean
  message: string
}

function HeaderIconButton({
  ariaLabel,
  tooltip,
  onClick,
  children,
}: {
  ariaLabel: string
  tooltip: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className="rounded-xl p-2 text-[#274333] transition-colors hover:bg-[#35523f]/8 hover:text-[#7a563a]"
          aria-label={ariaLabel}
          title={tooltip}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={10}
        className="rounded-xl bg-[#213126] px-3 py-1.5 text-xs font-medium text-[#f4efe6] shadow-[0_10px_24px_rgba(18,28,22,0.18)]"
      >
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

export function Header() {
  const navigate = useNavigate()
  const [healthNotification, setHealthNotification] = useState<HealthNotification | null>(null)
  const healthToastStyles = healthNotification?.ok
    ? "border-emerald-300/30 bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 text-white shadow-emerald-950/35"
    : "border-rose-200/50 bg-gradient-to-br from-rose-500 via-red-500 to-red-700 text-white shadow-rose-900/25"
  const HealthToastIcon = healthNotification?.ok ? CheckCircle2 : AlertCircle

  useEffect(() => {
    if (!healthNotification) return
    const timer = setTimeout(() => setHealthNotification(null), 4000)
    return () => clearTimeout(timer)
  }, [healthNotification])

  const handleHealthCheck = useCallback(async () => {
    try {
      const res = await getHealthStatus()
      setHealthNotification({
        ok: res.status === "ok",
        message: res.status === "ok" ? "API erreichbar" : "API nicht erreichbar",
      })
    } catch {
      setHealthNotification({ ok: false, message: "API nicht erreichbar" })
    }
  }, [])

  return (
    <div className="relative z-20">
      <header className="border-b border-[#314a37]/12 bg-[linear-gradient(180deg,rgba(247,244,238,0.96),rgba(238,231,220,0.92))] shadow-[0_10px_36px_rgba(22,31,24,0.08)] backdrop-blur-xl">
        <div className="container relative mx-auto h-20 px-4">
          <div className="flex h-full items-center justify-between">
            <div className="flex flex-1 items-center gap-2">
              <HeaderIconButton
                onClick={() => navigate('/')}
                ariaLabel="Startseite"
                tooltip="Startseite"
              >
                <Home className="size-6" />
              </HeaderIconButton>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2">
              <HeaderIconButton
                onClick={() => navigate('/prediction')}
                ariaLabel="Prediction"
                tooltip="Prediction"
              >
                <ScanSearch className="size-6" />
              </HeaderIconButton>
              <HeaderIconButton
                onClick={() => navigate('/benchmark')}
                ariaLabel="Benchmark"
                tooltip="Benchmark"
              >
                <BarChart className="size-6" />
              </HeaderIconButton>
              <HeaderIconButton
                onClick={handleHealthCheck}
                ariaLabel="Health Check"
                tooltip="Health Check"
              >
                <Activity className="size-6" />
              </HeaderIconButton>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center">
            <div className="rounded-[18px] border border-[#7a563a]/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.58),rgba(121,86,58,0.06))] px-4 py-1 shadow-[0_8px_22px_rgba(28,34,28,0.06)]">
              <img
                src={getAssetSrc(waldpilzLogo)}
                alt="Waldpilz Logo"
                className="h-16 w-auto"
              />
            </div>
          </div>
        </div>
      </header>

      {healthNotification && (
        <div className="absolute inset-x-0 top-full z-50 mt-3">
          <div className="container mx-auto flex justify-end px-4">
            <div
              className={`w-[min(16.5rem,calc(100vw-2rem))] overflow-hidden rounded-xl border px-3 py-2.5 shadow-2xl backdrop-blur-sm ${healthToastStyles}`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-white/18 p-1">
                  <HealthToastIcon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-4">
                    {healthNotification.ok ? "Health Check erfolgreich" : "Health Check fehlgeschlagen"}
                  </p>
                  <p className="text-xs text-white/90">
                    {healthNotification.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
