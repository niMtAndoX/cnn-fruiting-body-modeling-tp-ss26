"use client"

import { Activity, BarChart, Home, ScanSearch } from "lucide-react"
import { useNavigate } from "react-router-dom"
import waldpilzLogo from "../WALDPILZ_Logo (1).png"

import { getHealthResponseString } from "@/features/health/api/health"
import { getAssetSrc } from "@/lib/asset-src"

export function Header() {
  const navigate = useNavigate()

  return (
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
            onClick={() => getHealthResponseString().then((status) => {
              alert(status);
            })}
            className="p-2 text-foreground hover:text-foreground/70 transition-colors"
            aria-label="Health Check"
            title="Health Check"
          >
            <Activity className="size-6" />
          </button>
        </div>
      </div>
    </header>
  )
}
