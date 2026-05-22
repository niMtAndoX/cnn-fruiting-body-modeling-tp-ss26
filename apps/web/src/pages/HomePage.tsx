import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Upload, Search, CheckCircle, GraduationCap, BarChart } from "lucide-react"
import backgroundWald from "@/components/wald_background.jpg"
import waldpilzLogo from "@/components/WALDPILZ_Logo (1).png"
import waldpilzLogoWhite from "@/components/WALDPILZ_Logo_weiß.png"
import { getAssetSrc } from "@/lib/asset-src"
import { Header } from "@/components/waldpilz/header"

export default function HomePage() {
  return (
    <div className="min-h-screen text-foreground relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-fixed scale-105"
        style={{ backgroundImage: `url(${backgroundWald})`, filter: "blur(4px)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 800px 100% at center, rgba(0, 0, 0, 0.35), transparent)"
        }}
      />
      <div className="relative z-10">
      <Header />

      {/* Kopfzeile */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="opacity-0">Startseite</div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tighter text-balance text-white">
            Lackporlinge auf Fotos <span className="text-yellow-300">erkennen</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            KI-gestützte Analyse für den <strong>Glänzenden Lackporling</strong>.
          </p>
          <div className="flex items-center justify-center gap-3 -mt-4">
            <img
              src={getAssetSrc(waldpilzLogoWhite)}
              alt="Waldpilz Logo"
              className="h-16 w-auto"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/prediction">
              <Button size="lg" className="text-lg px-10 py-7 h-auto">
                Lackporling analysieren
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Projekt Einführung */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="size-20 shrink-0 rounded-2xl bg-primary flex items-center justify-center">
              <GraduationCap className="size-12 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4 text-yellow-300">Akademische Kooperation</h2>
              <p className="text-lg text-gray-200 leading-relaxed">
                Dieses spezialisierte KI-Tool ist das Ergebnis eines Team-Projekts an der  <strong>Ostfalia Hochschule Wolfenbüttel</strong>. Im Rahmen des Projekts <strong>Waldpilz.eu</strong> haben wir eine Lösung entwickelt, die eine computergestützte Erkennung des Glänzenden Lackporlings ermöglicht.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tutorial */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-16 text-yellow-300">Der Analyse-Prozess</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="flex flex-col items-center text-center group">
              <div className="size-20 rounded-2xl bg-card border-4 border-border flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <Upload className="size-10 text-foreground group-hover:text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-yellow-300">Foto hochladen</h3>
              <p className="text-gray-200">
                Laden Sie eine Nahaufnahme des vermeintlichen Lackporlings hoch.
              </p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="size-20 rounded-2xl bg-card border-4 border-border flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <Search className="size-10 text-foreground group-hover:text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-yellow-300">Spezifische Prüfung</h3>
              <p className="text-gray-200">
                Die KI gleicht die Merkmale (Farbe, Glanz, Wuchsform) mit Referenzdaten ab.
              </p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="size-20 rounded-2xl bg-card border-4 border-border flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <CheckCircle className="size-10 text-foreground group-hover:text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-yellow-300">Ergebnis</h3>
              <p className="text-gray-200">
                Sie erhalten eine Einschätzung, ob es sich um den Glänzenden Lackporling handelt.
              </p>
            </div>
            <Link to="/benchmark" className="flex flex-col items-center text-center group">
              <div className="size-20 rounded-2xl bg-card border-4 border-border flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <BarChart className="size-10 text-foreground group-hover:text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-yellow-300">Benchmark</h3>
              <p className="text-gray-200">
                Vergleichen Sie die Modellleistung anhand standardisierter Metriken.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Projekt Informationen*/}
      <section className="py-16 px-4 bg-black/50 border-t-2 border-b-2 border-white/20">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-8 text-yellow-300">Projekt Waldpilz</h2>
          <div className="prose prose-lg mx-auto text-gray-200 space-y-6">
            <p>
              Waldpilz.eu widmet sich der digitalen Erfassung und dem Schutz unserer heimischen Pilzflora. Dieses studentische Modul nutzt die Kernidee von Waldpilz.eu – <strong>Wissen durch Technologie</strong> – und wendet sie gezielt auf die Erkennung einer einzelnen, markanten Art an.
            </p>
            <div className="bg-destructive/20 border-l-4 border-destructive p-4 text-sm text-gray-200 font-medium text-left italic">
              Wichtiger Hinweis: Dieses Tool dient Demonstrationszwecken im Rahmen eines Hochschulprojekts. Eine KI kann keine mykologische Begutachtung ersetzen. Pilze zu Heil- oder Speisezwecken müssen immer von Experten freigegeben werden.
            </div>
          </div>
        </div>
      </section>

      {/* Fußzeile */}
      <footer className="py-10 px-4 border-t-4 border-border bg-card">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
          </div>
          <img
              src={getAssetSrc(waldpilzLogo)}
              alt="Waldpilz Logo"
              className="h-10 w-auto"
            />
          <div className="text-center">
            <p>&copy; 2026 – Ostfalia Hochschule Wolfenbüttel</p>
            <p>Entwickelt von: Max Weber, Marven Diekelmann, Max Schwarz, Alex Teemann, Lasse Wiesen</p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary">Impressum</a>
            <a href="#" className="hover:text-primary">Datenschutz</a>
          </div>
        </div>
      </footer>
      </div>
    </div>
  )
}
