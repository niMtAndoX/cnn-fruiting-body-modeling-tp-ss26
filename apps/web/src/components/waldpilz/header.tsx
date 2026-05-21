"use client"

import { Activity, BarChart, Home, ScanSearch } from "lucide-react"
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
        message: res.status === "ok" ? "Modell/Backend erreichbar" : "Modell/Backend nicht erreichbar",
      })
    } catch {
      setHealthNotification({ ok: false, message: "Modell/Backend nicht erreichbar" })
    }
  }, [])

  return (
    <>
      <header className="bg-card border-b-2 border-border">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-foreground hover:text-foreground/70 transition-colors"
              aria-label="Startseite"
              title="Startseite"
            >
              <Home className="size-6" />
            </button>
            <button
              onClick={() => navigate('/prediction')}
              className="p-2 text-foreground hover:text-foreground/70 transition-colors"
              aria-label="Prediction"
              title="Prediction"
            >
              <ScanSearch className="size-6" />
            </button>
          </div>

          <img
            src={getAssetSrc(waldpilzLogo)}
            alt="Waldpilz Logo"
            className="h-16 w-auto"
          />

          <div className="flex items-center gap-2">
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
      </header>

      {healthNotification && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white font-semibold text-sm ${
            healthNotification.ok ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {healthNotification.message}
        </div>
      )}
    </>
  )
}
