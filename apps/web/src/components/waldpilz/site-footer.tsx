import waldpilzLogo from "@/components/WALDPILZ_Logo (1).png"
import { getAssetSrc } from "@/lib/asset-src"

export function SiteFooter() {
  return (
    <footer className="border-t border-[#314a37]/12 bg-[linear-gradient(180deg,rgba(244,239,231,0.96),rgba(235,228,216,0.96))] px-4 py-10 text-[#274333]">
      <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-sm md:flex-row">
        <div className="rounded-[20px] border border-[#7a563a]/10 bg-white/50 px-4 py-2 shadow-[0_10px_28px_rgba(28,34,28,0.06)]">
          <img
            src={getAssetSrc(waldpilzLogo)}
            alt="Waldpilz Logo"
            className="h-10 w-auto"
          />
        </div>
        <div className="text-center">
          <p>&copy; 2026 - Ostfalia Hochschule Wolfenbüttel</p>
          <p className="text-[#5f6f63]">
            Entwickelt von: Max Weber, Marven Diekelmann, Max Schwarz, Alex Teemann, Lasse
            Wiesen
          </p>
        </div>
        <div className="flex gap-6">
          <a href="#" className="transition-colors hover:text-[#7a563a]">
            Impressum
          </a>
          <a href="#" className="transition-colors hover:text-[#7a563a]">
            Datenschutz
          </a>
        </div>
      </div>
    </footer>
  )
}
