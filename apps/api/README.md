# Waldpilz API

Die FastAPI-basierte Backend-API für die Waldpilz-Erkennung auf Resthölzern.

Die erste Release-Version wird bewusst als API-first Backend ausgeliefert. Die
unterstützte Browser-Oberfläche ist deshalb aktuell die FastAPI-Dokumentation
unter `/docs`.

## Voraussetzungen

Bevor das Backend gestartet werden kann, werden folgende Tools benötigt:

- **Python 3.12** – Die API ist für Python 3.12 entwickelt
- **pip** – Paketmanager für Python (im Regelfall mit Python installiert)
- **virtualenv** oder das eingebaute `venv`-Modul

Optional für Entwicklung:

- **VS Code** mit den Extensions `ms-python.python`, `ms-python.vscode-pylance` und `charliermarsh.ruff`
- **Docker** falls das Backend containerisiert laufen soll

---

## Backend lokal starten

Vor dem ersten Start die Konfiguration anlegen:

macOS / Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### 1. Virtuelle Umgebung erstellen und aktivieren

Im Verzeichnis `apps/api/` ausführen:

macOS / Linux:

```bash
python3.12 -m venv .venv
source .venv/bin/activate
```

Windows PowerShell:

```powershell
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
```

### 2. Dependencies installieren

```bash
pip install -e ".[dev]"
```

Dadurch werden alle nötigen Pakete installiert, inkl. FastAPI, Uvicorn, Pydantic und den Dev-Tools.

### 3. Backend starten

macOS / Linux und Windows PowerShell:

```bash
python -m app.run
```

Die API ist anschließend unter folgenden Adressen erreichbar:

- **API-Basis:** http://127.0.0.1:8000
- **Swagger UI (interaktive API-Dokumentation):** http://127.0.0.1:8000/docs
- **ReDoc (alternative API-Doku):** http://127.0.0.1:8000/redoc
- **OpenAPI-Spec:** http://127.0.0.1:8000/openapi.json

> **Hinweis:** Die Endpunkte sind unter `/api/v1/...` erreichbar, z. B. `/api/v1/health`.

---

## Backend mit Docker starten

Das API-Image wird aus dem Repository-Root gebaut, weil der Dockerfile neben
`apps/api/` auch `scripts/` und `models/` in das Image kopiert.

Wichtig: Die benoetigten Modell-Dateien unter `models/darknet/` muessen vor dem
Build selbst bereitgestellt werden. Sie werden nicht automatisch aus dem
Repository oder aus einem externen Registry-Download erzeugt.

### 1. Docker-Image bauen

Im Repository-Root ausführen:

```bash
docker build -f apps/api/Dockerfile -t waldpilz-api .
```

### 2. Container starten

```bash
docker run --rm -p 8000:8000 waldpilz-api
```

Das Image bringt bereits sinnvolle Standardwerte aus dem Dockerfile mit. Falls
du davon abweichen willst, kannst du einzelne Variablen zur Laufzeit mit
`docker run -e KEY=value ...` überschreiben.

Die Portfreigabe `-p 8000:8000` bedeutet:

- Der Port `8000` auf deinem Rechner wird auf Port `8000` im Container gemappt.
- Die API ist dadurch lokal unter `http://127.0.0.1:8000` erreichbar.

Falls Port `8000` auf deinem Rechner bereits belegt ist, kannst du z. B. auch
`-p 8080:8000` verwenden. Dann bleibt der Container intern auf Port `8000`,
ist lokal aber unter `http://127.0.0.1:8080` erreichbar.

### 3. Container testen

Nach dem Start sind die wichtigsten URLs:

- **Healthcheck:** http://127.0.0.1:8000/api/v1/health
- **Swagger UI:** http://127.0.0.1:8000/docs
- **ReDoc:** http://127.0.0.1:8000/redoc
- **OpenAPI-Spec:** http://127.0.0.1:8000/openapi.json

Beispiel fuer den Healthcheck im Terminal:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

Wenn alles laeuft, sollte die Antwort so aussehen:

```json
{
  "status": "ok"
}
```

---

## Wichtigste Backend-Bereiche

Die Projektstruktur im Backend ist so organisiert:

```
app/
├── main.py                    # Einstiegspunkt der FastAPI-App
├── api/
│   ├── routes/                # HTTP-Endpunkte (health, predict)
│   ├── schemas/               # Request- und Response-Schemas (Pydantic)
│   └── error_handlers.py      # Zentrale Fehlerbehandlung
├── core/
│   ├── config.py              # Zentrale Konfiguration (Settings)
│   ├── dependencies.py        # FastAPI-Dependencies
│   └── logging.py             # Logging-Setup
├── domain/
│   └── prediction/            # Fachlogik für Vorhersagen
│       ├── service.py
│       ├── entities.py
│       └── ports.py
├── infrastructure/
│   └── darknet/               # Technische Darknet-Integration
│       ├── runner.py
│       ├── parser.py
│       └── models.py
└── tests/                     # Unit- und Integrationstests
```

**Wichtigste Dateien:**

- `main.py` – Erstellt die FastAPI-App, bindet Router ein
- `api/routes/health.py` – Healthcheck-Endpunkt
- `api/routes/predict.py` – Prediction-Endpunkt
- `core/config.py` – Zentrale Konfiguration (Env-Variablen, Settings)
- `domain/prediction/service.py` – Fachlogik für die Bilderkennung

---

## API-Endpunkte

### `GET /api/v1/health`

Prüft, ob der Service läuft und erreichbar ist.

**Request:**

Keine Parameter erforderlich.

**Erfolgreiche Response (200 OK):**

```json
{
  "status": "ok"
}
```

**Verwendung:**

Dieser Endpunkt wird genutzt, um die Verfügbarkeit des Backends zu prüfen, z. B. für Monitoring oder Healthchecks in Container-Umgebungen.

---

### `POST /api/v1/predict`

Nimmt ein Bild entgegen und führt die Erkennung von Fruchtkörpern auf dem Bild aus.

**Request:**

- **Content-Type:** `multipart/form-data`
- **Body-Parameter:**
  - `file` (erforderlich): Bilddatei (JPEG oder PNG, max. 20 MB)

**Unterstützte Bildformate:**

- JPEG (`image/jpeg`)
- PNG (`image/png`)

**Maximale Dateigröße:** 20 MB

**Erfolgreiche Response (200 OK) – mit erkannten Objekten:**

```json
{
  "request_id": "db65485c-73f5-478b-b86c-ccef70c62a5f",
  "model_version": "darknet-cnn-v1",
  "detections": [
    {
      "label": "fungus",
      "score": 0.95148888,
      "bbox": {
        "x": 140,
        "y": 25,
        "width": 297,
        "height": 281
      }
    }
  ],
  "inference_time_ms": 787
}
```

**Erfolgreiche Response (200 OK) – keine Objekte erkannt:**

Wenn keine Fruchtkörper erkannt werden, bleibt die Struktur identisch, das `detections`-Array ist jedoch leer:

```json
{
  "request_id": "7f3a9b1c-4e2d-4a8f-b5c6-8d9e2f3a1b4c",
  "model_version": "darknet-cnn-v1",
  "detections": [],
  "inference_time_ms": 412
}
```

**Immer vorhandene Felder:**

Unabhängig davon, ob Objekte erkannt wurden oder nicht, enthält jede erfolgreiche Response folgende Felder:

- `request_id` (string): Eindeutige ID für die Anfrage (UUID v4)
- `model_version` (string): Version des verwendeten Modells
- `detections` (array): Liste der Erkennungen (leer bei keinen Treffern)
- `inference_time_ms` (integer): Dauer der Inferenz in Millisekunden

**Felder innerhalb von `detections` (falls vorhanden):**

Jedes Objekt im `detections`-Array hat folgende Struktur:

- `label` (string): Klassenbezeichnung des erkannten Objekts (z. B. `"fungus"`)
- `score` (float): Konfidenzwert der Erkennung (0.0 bis 1.0)
- `bbox` (object | null): Begrenzungsrahmen mit `x`, `y`, `width`, `height` (in Pixeln)

**Fehlerantworten:**

**400 Bad Request** – Ungültige Eingabe:

```json
{
  "error": "bad_request",
  "message": "Ungültiger Dateityp: image/gif"
}
```

Mögliche Fehlerursachen:

- Ungültiger MIME-Type (nur JPEG und PNG erlaubt)
- Datei zu groß (über 20 MB)
- Leere Datei hochgeladen

**500 Internal Server Error** – Fehler bei der Verarbeitung:

```json
{
  "error": "internal_error",
  "message": "Die Bilderkennung konnte nicht erfolgreich ausgeführt werden."
}
```

---

## Verwendungsbeispiele

### Mit curl – Health-Check

```bash
curl -X GET http://127.0.0.1:8000/api/v1/health
```

**Erwartete Antwort:**

```json
{
  "status": "ok"
}
```

---

### Mit curl – Bild hochladen

```bash
curl -X 'POST' \
  'http://127.0.0.1:8000/api/v1/predict' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@testimage.png;type=image/png'
```

**Erwartete Antwort (mit Erkennungen):**

```json
{
  "request_id": "db65485c-73f5-478b-b86c-ccef70c62a5f",
  "model_version": "darknet-cnn-v1",
  "detections": [
    {
      "label": "fungus",
      "score": 0.95148888,
      "bbox": {
        "x": 140,
        "y": 25,
        "width": 297,
        "height": 281
      }
    }
  ],
  "inference_time_ms": 787
}
```

---

### Mit Python – requests

Installiere zuerst `requests`:

```bash
pip install requests
```

**Beispiel-Skript:**

```python
import requests

# Health-Check
response = requests.get("http://127.0.0.1:8000/api/v1/health")
print(response.json())
# {'status': 'ok'}

# Bild hochladen und Vorhersage erhalten
with open("testimage.png", "rb") as image_file:
    files = {"file": ("testimage.png", image_file, "image/png")}
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/predict",
        files=files
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"Request ID: {result['request_id']}")
        print(f"Modell-Version: {result['model_version']}")
        print(f"Anzahl Erkennungen: {len(result['detections'])}")
        print(f"Inferenz-Zeit: {result['inference_time_ms']} ms")
        
        for detection in result['detections']:
            print(f"\n  - Label: {detection['label']}")
            print(f"    Konfidenz: {detection['score']:.2f}")
            if detection['bbox']:
                bbox = detection['bbox']
                print(f"    Position: ({bbox['x']}, {bbox['y']})")
                print(f"    Größe: {bbox['width']}x{bbox['height']} px")
    else:
        print(f"Fehler: {response.status_code}")
        print(response.json())
```

---

## Tests ausführen

Unit- und Integrationstests können mit pytest ausgeführt werden:

```bash
pytest
```

Für spezifische Test-Typen:

```bash
# Nur Unit-Tests
pytest -m unit

# Nur Integrationstests
pytest -m integration
```

---

## Konfiguration

Die Konfiguration erfolgt über die Datei `.env` im Verzeichnis `apps/api/`.

Eine versionierbare Vorlage liegt unter `apps/api/.env.example`.

Wichtige Einstellungen:

```env
# Anwendung
APP_NAME=waldpilz-api
APP_ENV=dev
DEBUG=true

# API
API_HOST=127.0.0.1
API_PORT=8000
API_PREFIX=/api/v1

# Uploads
MAX_UPLOAD_SIZE_MB=20
ALLOWED_UPLOAD_CONTENT_TYPES=image/jpeg,image/png

# Modell
MODEL_VERSION=darknet-cnn-v1
INFERENCE_TIMEOUT_SECONDS=30
```

Die vollständige Liste der Konfigurationsoptionen findet sich in `app/core/config.py`.

## Deployment und Release

Eine zusammenhängende Anleitung für lokale Freigabe, Docker-Deployment und
Release-Checks findest du in [`docs/release-guide.md`](../../docs/release-guide.md).
