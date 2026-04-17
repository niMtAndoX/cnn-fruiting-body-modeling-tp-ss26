"use client"

import { Home, Activity } from "lucide-react"
import { useNavigate } from "react-router-dom"
import waldpilzLogo from "../WALDPILZ_Logo (1).png"

import { getHealthResponseString } from "@/features/health/api/health"

export function Header() {
  const navigate = useNavigate()

  return (
    <header className="bg-card border-b-2 border-border">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between">
        {/* Homebutton */}
        <button
          onClick={() => navigate('/')}
          className="p-2 text-foreground hover:text-foreground/70 transition-colors"
          aria-label="Startseite"
        >
          <Home className="size-6" />
        </button>

        {/* Logo */}
        <div className="flex flex-col items-center">
          <img
            src={waldpilzLogo}
            alt="Waldpilz Logo"
            className="h-16 w-auto"
          />
        </div>

        {/* Health Check button */}
        <button
          onClick={() => getHealthResponseString().then((status) => {
            alert(status);
          })}
          className="p-2 text-foreground hover:text-foreground/70 transition-colors"
          aria-label="Health Check"
        >
          <Activity className="size-6" />
        </button>
      </div>
    </header>
  )
}
