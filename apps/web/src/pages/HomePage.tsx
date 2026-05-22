import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Upload, Search, CheckCircle, GraduationCap, BarChart } from "lucide-react"
import backgroundWald from "@/components/wald_background.jpg"
import waldpilzLogoWhite from "@/components/WALDPILZ_Logo_weiß.png"
import { getAssetSrc } from "@/lib/asset-src"
import { Header } from "@/components/waldpilz/header"
import { SiteFooter } from "@/components/waldpilz/site-footer"

function ProcessLink({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: string
  icon: typeof Upload
  title: string
  description: string
}) {
  return (
    <Link to={to} className="group flex flex-col items-center text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-[22px] border-[3px] border-white/20 bg-[linear-gradient(180deg,rgba(246,242,233,0.9),rgba(231,223,210,0.78))] shadow-[0_18px_44px_rgba(0,0,0,0.18)] transition-all duration-200 group-hover:-translate-y-1 group-hover:border-[#43634b] group-hover:bg-[linear-gradient(180deg,rgba(72,110,81,0.96),rgba(49,77,57,0.96))]">
        <Icon className="size-10 text-[#2d4131] transition-colors group-hover:text-white" />
      </div>
      <h3 className="mb-3 text-xl font-bold text-yellow-300">{title}</h3>
      <p className="max-w-xs text-gray-200">{description}</p>
    </Link>
  )
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${backgroundWald})`, filter: "blur(4px) saturate(0.92)" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 900px 110% at center, rgba(0, 0, 0, 0.34), transparent), linear-gradient(180deg, rgba(7, 10, 8, 0.18), rgba(7, 10, 8, 0.48))",
        }}
      />

      <div className="relative z-10">
        <Header />

        <section className="px-4 py-20">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="opacity-0">Startseite</div>
            <h1 className="text-balance text-5xl font-extrabold tracking-tighter text-white md:text-7xl">
              Lackporlinge auf Fotos{" "}
              <span className="text-yellow-300">erkennen</span>
            </h1>

            <p className="mx-auto mb-10 mt-6 max-w-2xl text-xl leading-relaxed text-gray-200 md:text-2xl">
              KI-gestützte Analyse für den <strong>Glänzenden Lackporling</strong>.
            </p>

            <div className="mb-6 flex items-center justify-center gap-3 -mt-2">
              <img
                src={getAssetSrc(waldpilzLogoWhite)}
                alt="Waldpilz Logo"
                className="h-16 w-auto"
              />
            </div>

            <div className="flex items-center justify-center">
              <Link to="/prediction">
                <Button
                  size="lg"
                  className="h-auto rounded-2xl bg-[linear-gradient(180deg,#8c633f,#734d2f)] px-10 py-7 text-lg text-white shadow-[0_18px_40px_rgba(52,33,18,0.28)] hover:bg-[linear-gradient(180deg,#7f5938,#674529)]"
                >
                  Lackporling analysieren
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 py-14">
          <div className="container mx-auto max-w-4xl">
            <div className="rounded-[30px] border border-white/14 bg-black/28 px-6 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.2)] backdrop-blur-md md:px-8">
              <div className="flex flex-col items-center gap-8 text-center md:flex-row md:items-start md:text-left">
                <div className="flex size-20 shrink-0 items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,rgba(74,114,84,0.95),rgba(50,78,57,0.95))] shadow-[0_16px_36px_rgba(17,31,21,0.28)]">
                  <GraduationCap className="size-11 text-white" />
                </div>
                <div>
                  <h2 className="mb-4 text-3xl font-bold text-yellow-300">
                    Akademische Kooperation
                  </h2>
                  <p className="text-lg leading-relaxed text-gray-200">
                    Dieses spezialisierte KI-Tool ist das Ergebnis eines Team-Projekts an der{" "}
                    <strong>Ostfalia Hochschule Wolfenbüttel</strong>. Im Rahmen des Projekts{" "}
                    <strong>Waldpilz.eu</strong> haben wir eine Lösung entwickelt, die eine
                    computergestützte Erkennung des Glänzenden Lackporlings ermöglicht.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20">
          <div className="container mx-auto max-w-5xl">
            <h2 className="mb-16 text-center text-3xl font-bold text-yellow-300">
              Der Analyse-Prozess
            </h2>
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
              <ProcessLink
                to="/prediction"
                icon={Upload}
                title="Foto hochladen"
                description="Laden Sie eine Nahaufnahme des vermeintlichen Lackporlings hoch."
              />
              <ProcessLink
                to="/prediction"
                icon={Search}
                title="Spezifische Prüfung"
                description="Die KI gleicht die Merkmale (Farbe, Glanz, Wuchsform) mit Referenzdaten ab."
              />
              <ProcessLink
                to="/prediction"
                icon={CheckCircle}
                title="Ergebnis"
                description="Sie erhalten eine Einschätzung, ob es sich um den Glänzenden Lackporling handelt."
              />
              <ProcessLink
                to="/benchmark"
                icon={BarChart}
                title="Benchmark"
                description="Vergleichen Sie die Modellleistung anhand standardisierter Metriken."
              />
            </div>
          </div>
        </section>

        <section className="border-y-2 border-white/20 bg-black/50 px-4 py-16">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="mb-8 text-3xl font-bold text-yellow-300">Projekt Waldpilz</h2>
            <div className="space-y-6 text-lg text-gray-200">
              <p>
                Waldpilz.eu widmet sich der digitalen Erfassung und dem Schutz unserer heimischen
                Pilzflora. Dieses studentische Modul nutzt die Kernidee von Waldpilz.eu -{" "}
                <strong>Wissen durch Technologie</strong> - und wendet sie gezielt auf die
                Erkennung einer einzelnen, markanten Art an.
              </p>
              <div className="rounded-[20px] border-l-4 border-[#b45b48] bg-[rgba(73,38,30,0.36)] p-4 text-left text-sm font-medium italic text-gray-200">
                Wichtiger Hinweis: Dieses Tool dient Demonstrationszwecken im Rahmen eines
                Hochschulprojekts. Eine KI kann keine mykologische Begutachtung ersetzen. Pilze zu
                Heil- oder Speisezwecken müssen immer von Experten freigegeben werden.
              </div>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  )
}
