"use client"

import { Home, User } from "lucide-react"

function MushroomEyeLogo() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="size-12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Mushroom cap */}
      <ellipse cx="32" cy="24" rx="20" ry="14" className="fill-secondary" />
      {/* Mushroom stem */}
      <rect x="26" y="32" width="12" height="16" rx="2" className="fill-secondary" />
      {/* Eye shape overlay */}
      <ellipse cx="32" cy="24" rx="12" ry="8" className="fill-card" />
      {/* Pupil */}
      <circle cx="32" cy="24" r="4" className="fill-secondary" />
      {/* Eye highlight */}
      <circle cx="34" cy="22" r="1.5" className="fill-card" />
    </svg>
  )
}

export function Header() {
  return (
    <header className="bg-card border-b-2 border-border">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Home icon */}
        <button
          className="p-2 text-foreground hover:text-foreground/70 transition-colors"
          aria-label="Startseite"
        >
          <Home className="size-6" />
        </button>

        {/* Logo and title */}
        <div className="flex flex-col items-center">
          <MushroomEyeLogo />
          <span className="text-lg font-bold text-foreground mt-1">Waldpilz</span>
        </div>

        {/* User profile icon */}
        <button
          className="p-2 text-foreground hover:text-foreground/70 transition-colors"
          aria-label="Benutzerprofil"
        >
          <User className="size-6" />
        </button>
      </div>
    </header>
  )
}
