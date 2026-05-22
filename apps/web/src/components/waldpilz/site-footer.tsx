import waldpilzLogo from "@/components/WALDPILZ_Logo (1).png"
import { getAssetSrc } from "@/lib/asset-src"

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-border bg-card px-4 py-10">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-sm text-foreground md:flex-row">
        <img
          src={getAssetSrc(waldpilzLogo)}
          alt="Waldpilz Logo"
          className="h-10 w-auto"
        />
        <div className="text-center">
          <p>&copy; 2026 - Ostfalia Hochschule Wolfenbuettel</p>
          <p>
            Entwickelt von: Max Weber, Marven Diekelmann, Max Schwarz, Alex Teemann, Lasse
            Wiesen
          </p>
        </div>
        <div className="flex gap-6">
          <a href="#" className="transition-colors hover:text-foreground/70">
            Impressum
          </a>
          <a href="#" className="transition-colors hover:text-foreground/70">
            Datenschutz
          </a>
        </div>
      </div>
    </footer>
  )
}
