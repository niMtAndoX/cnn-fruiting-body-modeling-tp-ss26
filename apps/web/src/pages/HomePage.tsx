import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Upload, Search, CheckCircle, Leaf, Shield, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-border bg-card">
        <div>Startseite</div>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-secondary flex items-center justify-center">
              <Leaf className="size-6 text-secondary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">Waldpilz</span>
          </div>
          <Link to="/prediction">
            <Button>Zur Analyseseite</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            KI-gestützte Pilzerkennung
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto text-pretty">
            Lade ein Foto hoch und lass unsere KI die Pilze in deinem Bild erkennen und analysieren.
          </p>
          <Link to="/prediction">
            <Button size="lg" className="text-lg px-8 py-6">
              Zur Analyseseite
            </Button>
          </Link>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 px-4 bg-card border-y-4 border-border">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            So funktioniert es
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="size-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Upload className="size-8 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">1. Bild hochladen</h3>
              <p className="text-muted-foreground">
                Ziehe dein Pilzfoto per Drag & Drop in die App oder klicke, um eine Datei auszuwählen.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="size-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Search className="size-8 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">2. KI-Analyse</h3>
              <p className="text-muted-foreground">
                Unsere KI analysiert das Bild und erkennt automatisch alle sichtbaren Pilze.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="size-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <CheckCircle className="size-8 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">3. Ergebnisse</h3>
              <p className="text-muted-foreground">
                Sieh dir die erkannten Pilze mit Markierungen und detaillierten Logs an.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Funktionen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border-4 border-border rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="size-12 rounded-full bg-primary flex items-center justify-center">
                  <Zap className="size-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Schnelle Erkennung</h3>
              </div>
              <p className="text-muted-foreground">
                Die KI-gestützte Analyse liefert innerhalb weniger Sekunden Ergebnisse mit präziser Objekterkennung.
              </p>
            </div>
            <div className="bg-card border-4 border-border rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="size-12 rounded-full bg-primary flex items-center justify-center">
                  <Shield className="size-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Lokale Verarbeitung</h3>
              </div>
              <p className="text-muted-foreground">
                Deine Bilder werden sicher verarbeitet. Die Analyse erfolgt direkt in deinem Browser.
              </p>
            </div>
            <div className="bg-card border-4 border-border rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="size-12 rounded-full bg-primary flex items-center justify-center">
                  <Upload className="size-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Einfache Bedienung</h3>
              </div>
              <p className="text-muted-foreground">
                Drag & Drop oder Klick - lade Bilder so hoch, wie es dir am besten passt.
              </p>
            </div>
            <div className="bg-card border-4 border-border rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="size-12 rounded-full bg-primary flex items-center justify-center">
                  <Leaf className="size-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">Analyseverlauf</h3>
              </div>
              <p className="text-muted-foreground">
                Behalte den Überblick über deine letzten Analysen und greife jederzeit auf frühere Ergebnisse zu.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About the Project */}
      <section className="py-16 px-4 bg-card border-y-4 border-border">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-foreground mb-8">
            Über das Projekt
          </h2>
          <div className="prose prose-lg mx-auto text-muted-foreground space-y-4">
            <p>
              <strong className="text-foreground">Waldpilz</strong> ist ein KI-gestütztes Tool zur Erkennung von Pilzen in Bildern. 
              Das Projekt wurde entwickelt, um Naturliebhabern und Pilzsammlern eine einfache Möglichkeit zu bieten, 
              Pilze in ihren Fotos zu identifizieren.
            </p>
            <p>
              Die Anwendung nutzt moderne Computer-Vision-Technologie, um Pilze in hochgeladenen Bildern zu erkennen 
              und mit Bounding Boxes zu markieren. Jede Analyse wird protokolliert, sodass du den gesamten 
              Erkennungsprozess nachvollziehen kannst.
            </p>
            <p>
              <em className="text-foreground/80">
                Hinweis: Diese App dient nur zu Demonstrationszwecken und ersetzt keine fachkundige Bestimmung. 
                Sammle und verzehre niemals Pilze ohne professionelle Beratung.
              </em>
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            Bereit, Pilze zu erkennen?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Starte jetzt mit der Analyse deiner Pilzfotos.
          </p>
          <Link to="/prediction">
            <Button size="lg" className="text-lg px-8 py-6">
              Zur Analyseseite
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t-4 border-border bg-card">
        <div className="container mx-auto max-w-4xl text-center text-muted-foreground">
          <p>&copy; 2026 Waldpilz. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  )
}
