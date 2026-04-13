import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Upload, Search, CheckCircle, Leaf, Zap, GraduationCap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b-4 border-border bg-card">
        <div>Startseite</div>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-secondary flex items-center justify-center">
              <Leaf className="size-6 text-secondary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Waldpilz.eu</span>
          </div>
          <Link to="/prediction">
            <Button variant="default">Analyse starten</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tighter text-balance">
            Spezialisierte <span className="text-primary">KI-Erkennung</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Identifikation des <strong>Glänzenden Lackporlings</strong> (Ganoderma lucidum). Nutzen Sie modernste Technik zur Bestimmung dieses besonderen Vitalpilzes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/prediction">
              <Button size="lg" className="text-lg px-10 py-7 h-auto">
                Lackporling analysieren
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Project Introduction (Ostfalia & Waldpilz.eu) */}
      <section className="py-16 px-4 bg-secondary/30 border-y-4 border-border">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="size-20 shrink-0 rounded-2xl bg-primary flex items-center justify-center">
              <GraduationCap className="size-12 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-4 text-foreground">Akademische Kooperation</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Dieses spezialisierte KI-Tool ist das Ergebnis eines Team-Projekts an der  <strong>Ostfalia Hochschule Wolfenbüttel</strong>. Im Rahmen des Projekts <strong>Waldpilz.eu</strong> haben wir eine Lösung entwickelt, die eine computergestützte Erkennung des Glänzenden Lackporlings ermöglicht.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-16">Der Analyse-Prozess</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center group">
              <div className="size-20 rounded-2xl bg-card border-4 border-border flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <Upload className="size-10 text-foreground group-hover:text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Foto hochladen</h3>
              <p className="text-muted-foreground">
                Laden Sie eine Nahaufnahme des vermeintlichen Lackporlings hoch.
              </p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="size-20 rounded-2xl bg-card border-4 border-border flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <Search className="size-10 text-foreground group-hover:text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Spezifische Prüfung</h3>
              <p className="text-muted-foreground">
                Die KI gleicht die Merkmale (Farbe, Glanz, Wuchsform) mit Referenzdaten ab.
              </p>
            </div>
            <div className="flex flex-col items-center text-center group">
              <div className="size-20 rounded-2xl bg-card border-4 border-border flex items-center justify-center mb-6 group-hover:bg-primary transition-colors">
                <CheckCircle className="size-10 text-foreground group-hover:text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-3">Ergebnis</h3>
              <p className="text-muted-foreground">
                Sie erhalten eine Einschätzung, ob es sich um den Glänzenden Lackporling handelt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 px-4 bg-card border-t-4 border-border">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-8">Projekt Waldpilz</h2>
          <div className="prose prose-lg mx-auto text-muted-foreground space-y-6">
            <p>
              Waldpilz.eu widmet sich der digitalen Erfassung und dem Schutz unserer heimischen Pilzflora. Dieses studentische Modul nutzt die Kernidee von Waldpilz.eu – <strong>Wissen durch Technologie</strong> – und wendet sie gezielt auf die Erkennung einer einzelnen, markanten Art an.
            </p>
            <div className="bg-destructive/10 border-l-4 border-destructive p-4 text-sm text-destructive font-medium text-left italic">
              Wichtiger Hinweis: Dieses Tool dient Demonstrationszwecken im Rahmen eines Hochschulprojekts. Eine KI kann keine mykologische Begutachtung ersetzen. Pilze zu Heil- oder Speisezwecken müssen immer von Experten freigegeben werden.
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">Haben Sie einen Fund gemacht?</h2>
          <Link to="/prediction">
            <Button size="lg" className="text-lg px-12 py-7 h-auto">
              Lackporling-Check starten
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t-4 border-border bg-card">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <Leaf className="size-5" />
            <span className="font-bold text-foreground">Waldpilz.eu</span>
          </div>
          <p>&copy; 2026 – Entwicklungsteam der Ostfalia Hochschule Wolfenbüttel.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary">Impressum</a>
            <a href="#" className="hover:text-primary">Datenschutz</a>
          </div>
        </div>
      </footer>
    </div>
  )
}