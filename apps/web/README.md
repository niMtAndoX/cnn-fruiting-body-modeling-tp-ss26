# Waldpilz Web

Das React-Frontend für die Waldpilz-Erkennung.

Aktueller Stand:
- lokale React-App mit Vite
- zentrales Routing
- Startseite unter `/`
- Prediction-Seite unter `/prediction`
- Not-Found-Seite für unbekannte Routen

## Voraussetzungen

- Node.js 22
- pnpm

## Installation

Im Verzeichnis `apps/web/`:

```bash
pnpm install
```

## Lokale Entwicklung

Dev-Server starten:

```bash
pnpm dev
```

Danach ist die App lokal im Browser erreichbar, in der Regel unter:

```text
http://localhost:5173
```

## Qualitätssicherung

Linting ausführen:

```bash
pnpm lint
```

Tests ausführen:

```bash
pnpm test
```

Linting und Tests zusammen ausführen:

```bash
pnpm check
```

Dev-Server nur nach erfolgreichem Check starten:

```bash
pnpm dev:checked
```

## Verfügbare Routen

- `/` – Startseite
- `/prediction` – Prediction-Seite
- unbekannte Routen – Not-Found-Seite

## Projektstruktur

```text
src/
├─ main.tsx
├─ app/
│  ├─ index.tsx
│  └─ router/
│     └─ index.tsx
├─ pages/
│  ├─ HomePage.tsx
│  ├─ PredictionPage.tsx
│  └─ NotFoundPage.tsx
└─ test/
   ├─ app.test.tsx
   └─ setup.ts
```

## Nächster Schritt

Im nächsten Schritt wird die Prediction-Seite fachlich erweitert, z. B. um:
- Bild-Upload
- Backend-Anbindung
- Starten der Bilderkennung
- Ergebnisanzeige