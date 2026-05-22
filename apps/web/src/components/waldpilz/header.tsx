"use client"

import { Activity, AlertCircle, BarChart, CheckCircle2, Home, ScanSearch } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import waldpilzLogo from "../WALDPILZ_Logo (1).png"

import { getHealthStatus } from "@/features/health/api/health"
import { getAssetSrc } from "@/lib/asset-src"

interface HealthNotification {
  ok: boolean
  message: string
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
      <header className="bg-card border-b-2 border-border">
        <div className="container relative mx-auto h-20 px-4">
          <div className="flex h-full items-center justify-between">
            <div className="flex flex-1 items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className="p-2 text-foreground hover:text-foreground/70 transition-colors"
                aria-label="Startseite"
                title="Startseite"
              >
                <Home className="size-6" />
              </button>
            </div>

            <div className="flex flex-1 items-center justify-end gap-2">
              <button
                onClick={() => navigate('/prediction')}
                className="p-2 text-foreground hover:text-foreground/70 transition-colors"
                aria-label="Analyse"
                title="Analyse"
              >
                <ScanSearch className="size-6" />
              </button>
              <button
                onClick={() => navigate('/benchmark')}
                className="p-2 text-foreground hover:text-foreground/70 transition-colors"
                aria-label="Benchmark"
                title="Benchmark"
              >
                <BarChart className="size-6" />
              </button>
              <button
                onClick={handleHealthCheck}
                className="p-2 text-foreground hover:text-foreground/70 transition-colors"
                aria-label="Health Check"
                title="Health Check"
              >
                <Activity className="size-6" />
              </button>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-1/2 flex -translate-x-1/2 items-center">
            <img
              src={getAssetSrc(waldpilzLogo)}
              alt="Waldpilz Logo"
              className="h-16 w-auto"
            />
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
