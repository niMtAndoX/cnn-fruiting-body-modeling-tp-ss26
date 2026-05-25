# Release Guide

## Ziel dieses Dokuments

Dieser Guide beschreibt, wie die Waldpilz-Anwendung für einen Release
vorbereitet, fachlich geprüft und per Docker ausgerollt wird.

Er richtet sich bewusst auch an neue Teammitglieder, die das Projekt nicht
vollständig kennen. Die Schritte sind deshalb konkret formuliert und mit direkt
kopierbaren Befehlen ergänzt.

Weiterführende Dokumentation:

- [`../README.md`](../README.md) für den Gesamtüberblick
- [`../apps/api/README.md`](../apps/api/README.md) für Backend und API
- [`../apps/web/README.md`](../apps/web/README.md) für Frontend und UI
- [`../models/README.md`](../models/README.md) für Modellartefakte

---

## Grundprinzip des Deployments

Die Anwendung wird regulär nicht über manuell zusammengesetzte Einzelbefehle
ausgerollt, sondern über das Root-`Makefile`.

Der empfohlene Standardweg lautet:

```bash
make deploy
```

Dieses Kommando startet intern die Shell-Skripte unter `ops/scripts/` und baut
den Docker-Stack aus:

- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `ops/docker/docker-compose.yaml`

---

## Wichtiger Hinweis für Windows

Wenn du unter Windows deployest oder Release-Prüfungen mit `make` ausführst,
verwende dafür **Git Bash**.

Konkret gilt:

- `make deploy`
- `make test`
- `make up`
- `make down`
- `make logs`
- `make clean`

sollen unter Windows über **Git Bash** ausgeführt werden.

Grund:

- die Projekt-Skripte unter `ops/scripts/` sind POSIX-Shell-Skripte
- das `Makefile` ruft genau diese Skripte auf
- Git Bash ist der vorgesehene und verlässlich getestete Ausführungsweg auf Windows

Nicht empfohlene Wege für das Deployment:

- klassische Eingabeaufforderung
- ungeprüfte Mischformen aus PowerShell und manuellen Shell-Aufrufen

Wenn du auf Windows arbeitest, öffne daher zuerst Git Bash und führe die
Befehle dort aus.

---

## Release-Voraussetzungen

Vor jedem Release oder Deployment sollten folgende Punkte erfüllt sein:

- Docker ist installiert
- Docker Compose V2 ist verfügbar
- die Modellartefakte unter `models/darknet/` sind vollständig
- `ops/docker/.env.example` ist Teil des Release-Stands
- die gewünschte Modellversion ist korrekt konfiguriert
- Backend und Frontend bauen und testen erfolgreich

### Aktuell relevante Deployment-Defaults

Die Standardwerte aus `ops/docker/.env.example` sind derzeit:

```env
COMPOSE_PROJECT_NAME=waldpilz
WEB_PORT=8080
API_APP_ENV=prod
API_DEBUG=false
API_LOG_LEVEL=INFO
API_MAX_UPLOAD_SIZE_MB=20
API_MAX_BENCHMARK_ARCHIVE_SIZE_MB=200
API_ALLOWED_UPLOAD_CONTENT_TYPES=image/jpeg,image/png
API_MODEL_VERSION=darknet-cnn-v1.1
API_INFERENCE_TIMEOUT_SECONDS=30
WEB_CLIENT_MAX_BODY_SIZE=450M
```

Diese Werte sollten vor einem Release bewusst geprüft werden, statt sie nur
stillschweigend zu übernehmen.

---

## Modellartefakte vor dem Release prüfen

Vor jedem Deployment ist sicherzustellen, dass die aktiven Modellartefakte unter
`models/darknet/` vorhanden und konsistent sind.

Mindestens erforderlich:

- `Bilderkennung-Pilzwachstum.cfg`
- `Bilderkennung-Pilzwachstum.data`
- `Bilderkennung-Pilzwachstum.names`
- `Bilderkennung-Pilzwachstum_best.weights`

### Wichtig: `names`-Pfad prüfen

Die Datei `Bilderkennung-Pilzwachstum.data` sollte aktuell auf Folgendes
verweisen:

```text
names = ./Bilderkennung-Pilzwachstum.names
```

Wenn hier ein falscher Pfad hinterlegt ist, kann Darknet im Betrieb abbrechen.

### Praktischer Kurzcheck

```bash
ls models/darknet
cat models/darknet/Bilderkennung-Pilzwachstum.data
```

Weitere Hintergründe stehen in:

- [`../models/README.md`](../models/README.md)

---

## Release-Validierung vor dem Deployment

Die wichtigste gemeinsame Validierung aus dem Repository-Root:

```bash
make test
```

Dieses Kommando führt aktuell aus:

- Anlegen fehlender `.env`-Dateien auf Basis der Beispiele
- Installation der Backend-Abhängigkeiten
- Installation der Frontend-Abhängigkeiten
- Backend-Lint mit Ruff
- Backend-Tests mit pytest
- Frontend-Lint mit ESLint
- Frontend-Tests mit Vitest

### Zusätzliche Prüfungen für Release-Kandidaten

Gerade vor einem echten Release sind diese Zusatzprüfungen sinnvoll:

```bash
cd apps/web
pnpm exec tsc --noEmit
pnpm build
cd ../..
docker compose --env-file ops/docker/.env -f ops/docker/docker-compose.yaml config -q
```

Warum diese Zusatzschritte wichtig sind:

- `tsc --noEmit` findet Typfehler, die ESLint nicht zwangsläufig erkennt
- `pnpm build` prüft den echten Frontend-Build
- `docker compose ... config -q` validiert die Compose-Konfiguration mit den aktuellen Werten

---

## Fachliche Release-Prüfung

Neben den technischen Checks sollte auch der sichtbare Anwendungsfluss geprüft
werden.

### Startseite

- lädt ohne Layoutfehler
- Hauptnavigation funktioniert
- Verlinkung zur Bildanalyse ist korrekt

### Prediction-Seite

- Upload funktioniert
- Bildvorschau wird korrekt angezeigt
- Analyse startet erfolgreich
- Bounding Boxes werden korrekt dargestellt
- Modellversion wird plausibel angezeigt

### Benchmark-Seite

- beide ZIP-Uploads funktionieren
- Hinweis zum Dateinamen-Matching ist sichtbar und verständlich
- Benchmark startet erfolgreich
- Kennzahlen werden angezeigt
- **mAP** wird in der UI korrekt als `mAP` dargestellt
- Detailansicht pro Bild wird plausibel gerendert
- Benchmark-Report lässt sich als PDF herunterladen

### Health Check

- Health Check im Header liefert eine klare Rückmeldung
- `GET /api/v1/health` funktioniert auch über das Frontend-Gateway

---

## Docker-Deployment ausführen

Der reguläre Deployment-Befehl aus dem Repository-Root lautet:

```bash
make deploy
```

### Was `make deploy` automatisch macht

1. Docker prüfen
2. Docker Compose V2 prüfen
3. `ops/docker/.env` aus `ops/docker/.env.example` erzeugen, falls nötig
4. Modellartefakte prüfen
5. Compose-Konfiguration validieren
6. Images bauen
7. Stack starten und auf Healthchecks warten

### Erwartetes Ergebnis

Nach einem erfolgreichen Deployment sollte Folgendes erreichbar sein:

- `http://127.0.0.1:8080`
- `http://127.0.0.1:8080/api/v1/health`
- `http://127.0.0.1:8080/docs`

### Wichtige Betriebsbefehle

```bash
make up
make ps
make logs
make health
make down
make clean
```

### Bedeutung der Befehle

- `make up`
  - startet einen vorhandenen Stack ohne Rebuild
- `make ps`
  - zeigt Status und Health der Container
- `make logs`
  - zeigt die laufenden Logs des Stacks
- `make health`
  - prüft den Health-Endpunkt über das Frontend-Gateway
- `make down`
  - stoppt den Stack
- `make clean`
  - stoppt den Stack und entfernt zusätzlich Volumes

---

## Nach dem Deployment prüfen

Direkt nach dem Ausrollen sollten diese Schritte durchgeführt werden:

### 1. Startseite prüfen

Browser öffnen:

```text
http://127.0.0.1:8080
```

### 2. Health Check prüfen

Im Browser oder per Terminal:

```bash
curl http://127.0.0.1:8080/api/v1/health
```

Erwartete Antwort:

```json
{
  "status": "ok"
}
```

### 3. API-Dokumentation prüfen

```text
http://127.0.0.1:8080/docs
```

### 4. Prediction fachlich prüfen

- Testbild hochladen
- Ergebnis auf Plausibilität prüfen
- Fehlerfall mit ungeeignetem Format gegenprüfen

### 5. Benchmark fachlich prüfen

- Testbilder-ZIP hochladen
- Labels-ZIP hochladen
- Benchmark ausführen
- Kennzahlen prüfen
- PDF-Report exportieren

Gerade der Benchmark sollte bei Releases aktiv geprüft werden, weil er mehrere
Komponenten gleichzeitig beansprucht:

- Archivverarbeitung
- Prediction-Pipeline
- Metrikberechnung
- Frontend-Ergebnisdarstellung
- PDF-Export

---

## Release-Checkliste

- `ops/docker/.env` enthält die beabsichtigten Deployment-Werte
- `API_MODEL_VERSION` verweist auf die gewünschte Modellversion
- die aktiven Dateien unter `models/darknet/` gehören zum vorgesehenen Modellstand
- `Bilderkennung-Pilzwachstum.data` verweist auf eine vorhandene `names`-Datei
- `make test` läuft erfolgreich durch
- `cd apps/web && pnpm exec tsc --noEmit` läuft erfolgreich durch
- `cd apps/web && pnpm build` läuft erfolgreich durch
- `docker compose --env-file ops/docker/.env -f ops/docker/docker-compose.yaml config -q` läuft erfolgreich durch
- `make deploy` startet den Stack erfolgreich
- `http://127.0.0.1:8080` lädt erfolgreich
- `http://127.0.0.1:8080/docs` lädt erfolgreich
- `GET /api/v1/health` liefert `{"status":"ok"}`
- `POST /api/v1/predict` funktioniert mit einem realen Testbild
- `POST /api/v1/benchmark` funktioniert mit passenden ZIP-Dateien
- die UI zeigt **mAP** korrekt an
- der Benchmark-Report lässt sich als PDF herunterladen
- Frontend und Backend kommunizieren im Docker-Stack fehlerfrei
- `make down` räumt den Stack sauber wieder ab

---

## Typische Fehlerquellen

### Falsche Modellversion sichtbar

Mögliche Ursachen:

- `ops/docker/.env` enthält noch einen alten `API_MODEL_VERSION`-Wert
- Container wurden nach einer Konfigurationsänderung nicht neu gebaut
- aktive Modellartefakte und angezeigte Version passen nicht zusammen

### Darknet startet nicht

Mögliche Ursachen:

- fehlende Modellartefakte
- fehlerhafter `names`-Pfad in der `.data`-Datei
- inkonsistente Kombination aus `.cfg`, `.data`, `.names` und `.weights`

### Benchmark funktioniert nicht

Mögliche Ursachen:

- Bilder und Labels passen namentlich nicht zusammen
- ZIP-Dateien sind leer oder ungültig
- Archivgröße überschreitet das konfigurierte Limit
- Modellinferenz schlägt auf einzelnen Bildern fehl

### `make`-Befehle verhalten sich unter Windows unzuverlässig

Mögliche Ursache:

- die Befehle wurden nicht aus Git Bash gestartet

---

## Lokale Nicht-Docker-Workflows

Für Vorabprüfungen oder Entwicklung stehen zusätzlich bereit:

```bash
make backend
make frontend
make dev
```

Auch diese Befehle sollten auf Windows über **Git Bash** ausgeführt werden.
