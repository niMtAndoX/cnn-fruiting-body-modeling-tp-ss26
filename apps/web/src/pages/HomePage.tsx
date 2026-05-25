import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { BarChart, CheckCircle, GraduationCap, Search, Upload } from "lucide-react"
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
      <div className="mb-6 flex size-18 items-center justify-center rounded-[22px] border border-white/14 bg-[linear-gradient(180deg,rgba(244,239,231,0.18),rgba(255,255,255,0.06))] shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:border-[#8b6542]/34 group-hover:bg-[linear-gradient(180deg,rgba(121,86,58,0.28),rgba(47,74,54,0.24))]">
        <Icon className="size-9 text-[#e4cfbf] transition-colors group-hover:text-white" />
      </div>
      <h3 className="mb-3 text-xl font-semibold text-[#e7d2bf]">{title}</h3>
      <p className="max-w-xs text-sm leading-6 text-stone-200/78">{description}</p>
    </Link>
  )
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-foreground">
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${backgroundWald})`, filter: "blur(3px) saturate(0.92)" }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,17,13,0.28),rgba(10,17,13,0.46)_30%,rgba(12,18,14,0.64)_100%)]" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 900px 110% at center, rgba(0, 0, 0, 0.16), transparent), radial-gradient(circle at 18% 0%, rgba(214,230,214,0.14), transparent 34%), radial-gradient(circle at 82% 10%, rgba(112,84,58,0.14), transparent 30%)",
        }}
      />

      <div className="relative z-10">
        <Header />

        <section className="px-4 py-20 md:py-24">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="opacity-0">Startseite</div>
            <h1 className="text-balance text-5xl font-semibold tracking-tight text-white md:text-7xl">
              Lackporlinge auf Fotos{" "}
              <span className="text-[#dcc0a7]">erkennen</span>
            </h1>

            <p className="mx-auto mb-10 mt-6 max-w-2xl text-lg leading-8 text-stone-200/82 md:text-2xl">
              KI-gestützte Analyse für den{" "}
              <strong className="text-[#dcc0a7]">Glänzenden Lackporling</strong> mit ruhiger
              Auswertung und reproduzierbaren Benchmark-Ergebnissen.
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
                  className="h-auto rounded-2xl bg-[linear-gradient(180deg,#345641,#274333)] px-10 py-6 text-lg text-white shadow-[0_18px_40px_rgba(22,38,28,0.28)] hover:bg-[linear-gradient(180deg,#2d4b39,#21362a)]"
                >
                  Bildanalyse starten
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="px-4 py-12">
          <div className="container mx-auto max-w-4xl">
            <div className="rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(18,28,22,0.42),rgba(18,28,22,0.3))] px-6 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-md md:px-8">
              <div className="flex flex-col items-center gap-8 text-center md:flex-row md:items-start md:text-left">
                <div className="flex size-18 shrink-0 items-center justify-center rounded-[24px] bg-[linear-gradient(180deg,rgba(121,86,58,0.94),rgba(71,100,75,0.9))] shadow-[0_16px_36px_rgba(17,31,21,0.28)]">
                  <GraduationCap className="size-10 text-white" />
                </div>
                <div>
                  <h2 className="mb-4 text-3xl font-semibold text-[#e7d2bf]">
                    Akademische Kooperation
                  </h2>
                  <p className="text-base leading-8 text-stone-200/82 md:text-lg">
                    Dieses spezialisierte KI-Tool ist das Ergebnis eines Team-Projekts an der{" "}
                    <strong>Ostfalia Hochschule Wolfenbüttel</strong>. Im Rahmen des Projekts{" "}
                    <strong>Waldpilz.eu</strong> wurde eine Anwendung entwickelt, die die
                    computergestützte Erkennung des Glänzenden Lackporlings ermöglicht.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20">
          <div className="container mx-auto max-w-5xl">
            <h2 className="mb-16 text-center text-3xl font-semibold text-[#e7d2bf]">
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
                description="Die KI gleicht Merkmale wie Farbe, Glanz und Wuchsform mit Referenzdaten ab."
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

        <section className="border-y border-white/12 bg-[rgba(12,18,14,0.32)] px-4 py-16 backdrop-blur-sm">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="mb-8 text-3xl font-semibold text-[#e7d2bf]">Projekt Waldpilz</h2>
            <div className="space-y-6 text-base leading-8 text-stone-200/82 md:text-lg">
              <p>
                Waldpilz.eu widmet sich der digitalen Erfassung und dem Schutz unserer heimischen
                Pilzflora. Dieses studentische Modul überträgt die Idee{" "}
                <strong>Wissen durch Technologie</strong> auf die Erkennung einer einzelnen,
                markanten Art.
              </p>
              <div className="rounded-[20px] border-l-4 border-[#b48a67] bg-[rgba(73,38,30,0.22)] p-4 text-left text-sm font-medium italic text-stone-100/88">
                Wichtiger Hinweis: Dieses Tool dient Demonstrationszwecken im Rahmen eines
                Hochschulprojekts. Eine KI kann keine mykologische Begutachtung ersetzen. Pilze zu
                Heil- oder Speisezwecken müssen immer von Fachleuten freigegeben werden.
              </div>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  )
}
