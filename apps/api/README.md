# Waldpilz API

## Zweck des Backends

Die API unter `apps/api/` ist das fachliche und technische Rückgrat der
Waldpilz-Anwendung.

Sie ist verantwortlich für:

- Annahme und Validierung von Uploads
- Start der Darknet-Inferenz
- Aufbereitung der Prediction-Antworten
- Ausführung kompletter Benchmark-Läufe
- Berechnung und Rückgabe von Kennzahlen
- Bereitstellung einer stabilen HTTP-Schnittstelle für das Frontend

Die eigentliche Browser-Oberfläche liegt im React-Frontend unter `apps/web/`.

Zusätzlich stellt die API für Entwicklung und manuelle Tests eine OpenAPI-Doku
unter `/docs`, `/redoc` und `/openapi.json` bereit.

---

## Technologie-Stack

Das Backend basiert auf:

- Python 3.12
- FastAPI
- Pydantic Settings
- Uvicorn
- Pillow
- pytest
- Ruff

Die Modellinferenz selbst läuft nicht nativ in Python, sondern über das
Shell-Skript `scripts/inference.sh`, das Darknet mit den Modellartefakten aus
dem pro Request ausgewählten Unterordner unter `models/darknet/` startet.

---

## Voraussetzungen

Bevor das Backend lokal gestartet werden kann, sollten folgende Werkzeuge
installiert sein:

- **Python 3.12**
- **pip**
- **venv** oder **virtualenv**

Optional, aber empfohlen:

- **VS Code**
- `ms-python.python`
- `ms-python.vscode-pylance`
- `charliermarsh.ruff`
- **Docker**, wenn das Backend containerisiert getestet werden soll

---

## Projektstruktur im Backend

Die Backend-Struktur ist so aufgebaut, dass HTTP-Schicht, Fachlogik und
technische Integration sauber getrennt bleiben.

```text
app/
├─ main.py                         # erstellt die FastAPI-App
├─ run.py                          # lokaler Startpunkt
├─ api/
│  ├─ router.py                    # bindet alle Router zusammen
│  ├─ routes/
│  │  ├─ health.py                 # GET /api/v1/health
│  │  ├─ models.py                 # GET /api/v1/models
│  │  ├─ predict.py                # POST /api/v1/predict
│  │  └─ benchmark.py              # POST /api/v1/benchmark
│  ├─ schemas/                     # Request-/Response-Schemas
│  └─ error_handlers.py            # zentrale Fehlerbehandlung
├─ core/
│  ├─ config.py                    # Settings und Env-Parsing
│  ├─ dependencies.py              # FastAPI-Dependencies
│  └─ logging.py                   # Logging-Setup
├─ domain/
│  ├─ prediction/                  # Fachlogik Prediction
│  └─ benchmark/                   # Fachlogik Benchmark
├─ infrastructure/
│  └─ darknet/                     # technische Darknet-Anbindung
└─ tests/                          # Unit- und Integrationstests
```

### Warum diese Trennung wichtig ist

- HTTP-spezifische Details bleiben in `app/api/`.
- Fachlogik für Prediction und Benchmark bleibt in `domain/`.
- Technische Details der Modellintegration bleiben in `infrastructure/`.
- Konfiguration und Dependency Injection bleiben zentral in `core/`.

Für neue Entwickler ist das wichtig, weil Änderungen dadurch leichter gezielt
an der richtigen Stelle vorgenommen werden können.

---

## Backend lokal starten

### 1. `.env` anlegen

Im Verzeichnis `apps/api/`:

macOS / Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

### 2. Virtuelle Umgebung erstellen und aktivieren

Im Verzeichnis `apps/api/`:

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

### 3. Abhängigkeiten installieren

```bash
pip install -e ".[dev]"
```

Damit werden sowohl Laufzeit- als auch Entwicklungsabhängigkeiten installiert.

### 4. Backend starten

```bash
python -m app.run
```

Danach ist die API erreichbar unter:

- `http://127.0.0.1:8000/api/v1`
- `http://127.0.0.1:8000/docs`
- `http://127.0.0.1:8000/redoc`
- `http://127.0.0.1:8000/openapi.json`

Wichtiger Hinweis:

- Die FastAPI-Dokumentation läuft unter `/docs`.
- Die eigentlichen API-Endpunkte liegen unter `/api/v1/...`.

Beispiel:

- `GET /api/v1/health`

---

## CORS und Zusammenspiel mit dem Frontend

Wenn das Frontend lokal über `pnpm dev` läuft, arbeitet es typischerweise unter:

- `http://localhost:5173`
- `http://127.0.0.1:5173`

Diese Origins müssen in `CORS_ALLOW_ORIGINS` erlaubt sein. Die
`apps/api/.env.example` enthält dafür bereits einen sinnvollen Default.

---

## Modell und Inferenz verstehen

Das Backend startet Darknet nicht direkt im Python-Code, sondern über
`scripts/inference.sh`.

Das ist wichtig, weil damit:

- die Darknet-Binary zentral gekapselt ist
- Modellpfade an einer Stelle zusammenlaufen
- Fehler früh und verständlich geprüft werden können

### Erwartete Modellartefakte

Unter `models/darknet/` müssen ein oder mehrere Unterordner nach dem Schema
`darknet-cnn-v*` vorliegen. Jeder verwendbare Modellordner muss mindestens
diese Dateien enthalten:

- `Bilderkennung-Pilzwachstum.cfg`
- `Bilderkennung-Pilzwachstum.data`
- `Bilderkennung-Pilzwachstum.names`
- `Bilderkennung-Pilzwachstum_best.weights`

### Wichtiger Hinweis zur `.data`-Datei

Die `.data`-Datei verweist aktuell auf:

```text
names = ./Bilderkennung-Pilzwachstum.names
```

Dieser Pfad muss korrekt bleiben. Ein falscher `names`-Pfad kann dazu führen,
dass Darknet beim Start abbricht.

### Verfügbare und standardmäßige Modellversion

Die Unterordner unter `models/darknet/` definieren die verfügbaren
Modellversionen, zum Beispiel:

```text
darknet-cnn-v1
darknet-cnn-v1.1
darknet-cnn-v1.2
```

Wichtig:

- `MODEL_VERSION` definiert den bevorzugten Default der API.
- Im Docker-Deployment wird dieser Default üblicherweise über
  `ops/docker/.env` als `API_MODEL_VERSION` gesetzt.
- Das Frontend kann über die Prediction- und Benchmark-Seite zur Laufzeit eine
  andere verfügbare Modellversion auswählen.
- Wenn ein Request `model_version` mitsendet, verwendet die API den gleichnamigen
  Unterordner unter `models/darknet/`.

---

## Wichtige Konfiguration in `apps/api/.env`

Die Konfiguration wird in `app/core/config.py` definiert und über
`apps/api/.env` geladen.

Eine Vorlage liegt unter:

- `apps/api/.env.example`

### Typische Einstellungen

```env
APP_NAME=waldpilz-api
APP_ENV=dev
DEBUG=true

API_HOST=127.0.0.1
API_PORT=8000
API_PREFIX=/api/v1

LOG_LEVEL=INFO

CORS_ALLOW_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

MAX_UPLOAD_SIZE_MB=20
ALLOWED_UPLOAD_CONTENT_TYPES=image/jpeg,image/png

MODEL_VERSION=darknet-cnn-v1.1
INFERENCE_TIMEOUT_SECONDS=30

MAX_BENCHMARK_ARCHIVE_SIZE_MB=2000
MAX_BENCHMARK_IMAGES=500
BENCHMARK_IOU_THRESHOLD=0.5
```

### Bedeutung ausgewählter Variablen

- `MAX_UPLOAD_SIZE_MB`
  - maximale Größe für einen Einzelbild-Upload
- `ALLOWED_UPLOAD_CONTENT_TYPES`
  - erlaubte MIME-Types für Prediction-Uploads
- `MODEL_VERSION`
  - bevorzugte Default-Modellversion, wenn kein Request eine `model_version` vorgibt
- `INFERENCE_TIMEOUT_SECONDS`
  - Zeitlimit für `scripts/inference.sh`
- `MAX_BENCHMARK_ARCHIVE_SIZE_MB`
  - maximale Größe eines Benchmark-Archivs
- `MAX_BENCHMARK_IMAGES`
  - Obergrenze für die Anzahl der Benchmark-Bilder
- `BENCHMARK_IOU_THRESHOLD`
  - IoU-Schwelle für das Matching von Prediction und Ground Truth

Hinweis:

- Im Docker-Deployment ist `MAX_BENCHMARK_ARCHIVE_SIZE_MB` standardmäßig kleiner
  gesetzt als in der lokalen Backend-`.env.example`.

---

## Qualitätssicherung

### Linting

```bash
python -m ruff check .
```

### Tests

```bash
python -m pytest
```

### Nur Unit-Tests

```bash
python -m pytest -m unit
```

### Nur Integrationstests

```bash
python -m pytest -m integration
```

Wenn du das gesamte Projekt auf einmal prüfen willst, ist aus dem
Repository-Root dieses Kommando sinnvoll:

```bash
make test
```

---

## API-Endpunkte

### `GET /api/v1/health`

Prüft, ob der Service erreichbar ist.

#### Request

Keine Parameter erforderlich.

#### Erfolgreiche Response

```json
{
  "status": "ok"
}
```

#### Typische Verwendung

- Health Checks im Docker-Stack
- Monitoring
- schneller Funktionscheck aus Frontend oder Terminal

---

### `GET /api/v1/models`

Liefert die verfügbaren Modellversionen aus `models/darknet/darknet-cnn-v*`
sowie die aktuell konfigurierte Default-Version zurück.

#### Erfolgreiche Response

```json
{
  "available_models": [
    "darknet-cnn-v1",
    "darknet-cnn-v1.1",
    "darknet-cnn-v1.2"
  ],
  "default_model_version": "darknet-cnn-v1.1"
}
```

---

### `POST /api/v1/predict`

Führt eine Modellvorhersage auf einem einzelnen Bild aus.

#### Request

- `Content-Type: multipart/form-data`
- Pflichtfeld: `file`
- optional: `model_version`

#### Erlaubte Dateitypen

- `image/jpeg`
- `image/png`

#### Standardlimit

- maximal `20 MB`

#### Beispiel-Request mit `curl`

```bash
curl -X POST \
  "http://127.0.0.1:8000/api/v1/predict" \
  -H "accept: application/json" \
  -F "file=@testimage.png;type=image/png" \
  -F "model_version=darknet-cnn-v1.2"
```

#### Erfolgreiche Response mit Erkennungen

```json
{
  "request_id": "db65485c-73f5-478b-b86c-ccef70c62a5f",
  "model_version": "darknet-cnn-v1.1",
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

#### Erfolgreiche Response ohne Erkennungen

```json
{
  "request_id": "7f3a9b1c-4e2d-4a8f-b5c6-8d9e2f3a1b4c",
  "model_version": "darknet-cnn-v1.1",
  "detections": [],
  "inference_time_ms": 412
}
```

#### Bedeutung der Response-Felder

- `request_id`
  - eindeutige ID der Anfrage
- `model_version`
  - Versionsbezeichnung des verwendeten Modells
- `detections`
  - Liste aller erkannten Objekte
- `inference_time_ms`
  - reine Inferenzzeit in Millisekunden

#### Mögliche Fehler

Beispiel für einen fachlichen Fehler:

```json
{
  "error": "bad_request",
  "message": "Ungültiger Dateityp: image/gif"
}
```

Typische Ursachen:

- ungültiger MIME-Type
- Datei zu groß
- leere Datei

---

### `POST /api/v1/benchmark`

Dieser Endpunkt ist für das Projekt besonders wichtig. Er führt einen kompletten
Benchmark-Lauf gegen einen annotierten Datensatz aus.

Dabei werden zwei ZIP-Archive hochgeladen:

- `test_archive`
  - ZIP mit Testbildern
- `label_archive`
  - ZIP mit Ground-Truth-Labels im YOLO-Format

Die API führt anschließend für jedes Bild eine Prediction aus, vergleicht die
Vorhersagen mit den Labels und berechnet zusammenfassende Kennzahlen.

#### Request

- `Content-Type: multipart/form-data`
- Pflichtfeld `test_archive`
- Pflichtfeld `label_archive`
- optional `model_version`

#### Beispiel-Request mit `curl`

```bash
curl -X POST \
  "http://127.0.0.1:8000/api/v1/benchmark" \
  -H "accept: application/json" \
  -F "test_archive=@testbilder.zip;type=application/zip" \
  -F "label_archive=@labels.zip;type=application/zip" \
  -F "model_version=darknet-cnn-v1.2"
```

#### Erwartete Struktur der ZIP-Dateien

Das Matching erfolgt über den Dateinamen.

Beispiel:

```text
testbilder.zip
├─ bild_001.jpg
├─ bild_002.jpg
└─ bild_003.png

labels.zip
├─ bild_001.txt
├─ bild_002.txt
└─ bild_003.txt
```

Wichtig:

- `bild_001.jpg` muss zu `bild_001.txt` passen
- `bild_002.jpg` muss zu `bild_002.txt` passen
- `bild_003.png` muss zu `bild_003.txt` passen

Wenn diese Zuordnung nicht stimmt, ist das Benchmark-Ergebnis fachlich nicht
zuverlässig.

#### YOLO-Label-Format

Jede Zeile in einer Label-Datei hat dieses Format:

```text
<class_id> <x_center> <y_center> <width> <height>
```

Beispiel:

```text
0 0.5 0.5 0.4 0.4
```

Bedeutung:

- `class_id`
  - numerische Klassen-ID
- `x_center`
  - normalisierte X-Mittelpunktkoordinate
- `y_center`
  - normalisierte Y-Mittelpunktkoordinate
- `width`
  - normalisierte Box-Breite
- `height`
  - normalisierte Box-Höhe

#### Erfolgreiche Response

```json
{
  "request_id": "8fd17d72-3d31-4d87-956c-f8595dc5503f",
  "model_version": "darknet-cnn-v1.1",
  "processing_time_ms": 1840,
  "average_inference_time_ms": 412.5,
  "true_positives": 3,
  "false_positives": 1,
  "false_negatives": 1,
  "precision": 0.75,
  "recall": 0.75,
  "f1_score": 0.75,
  "accuracy": 0.6,
  "mean_iou": 0.82,
  "map": 0.71,
  "total_images": 4,
  "failed_images": 0,
  "per_label": [
    {
      "label": "fungus",
      "true_positives": 3,
      "false_positives": 1,
      "false_negatives": 1,
      "precision": 0.75,
      "recall": 0.75,
      "f1_score": 0.75,
      "accuracy": 0.6,
      "mean_iou": 0.82
    }
  ],
  "image_results": [
    {
      "image_id": "bild_001",
      "ground_truth_count": 1,
      "predicted_count": 1,
      "true_positives": 1,
      "false_positives": 0,
      "false_negatives": 0,
      "inference_time_ms": 398,
      "error": null
    }
  ]
}
```

#### Bedeutung der wichtigsten Benchmark-Felder

- `processing_time_ms`
  - gesamte Laufzeit des Benchmark-Laufs
- `average_inference_time_ms`
  - durchschnittliche Modell-Inferenzzeit pro erfolgreich verarbeitetem Bild
- `true_positives`
  - korrekt erkannte Objekte
- `false_positives`
  - Vorhersagen ohne gültiges Match
- `false_negatives`
  - Ground-Truth-Objekte ohne passende Vorhersage
- `precision`
  - Anteil korrekter Treffer an allen Vorhersagen
- `recall`
  - Anteil erkannter Objekte an allen Ground-Truth-Objekten
- `f1_score`
  - harmonisches Mittel aus Precision und Recall
- `accuracy`
  - objektbezogene Trefferquote nach `TP / (TP + FP + FN)`
- `mean_iou`
  - durchschnittliche IoU der gematchten Objekte
- `map`
  - API-Feldname für die Mean Average Precision, in der UI als **mAP** dargestellt
- `total_images`
  - Anzahl aller Bilder im Benchmark-Lauf
- `failed_images`
  - Anzahl der Bilder, die nicht erfolgreich ausgewertet werden konnten
- `per_label`
  - aggregierte Kennzahlen pro Label
- `image_results`
  - Detailauswertung pro Bild

#### Bedeutung der Felder in `image_results`

- `image_id`
  - Bildkennung oder Dateiname ohne fachliche Kennzahl
- `ground_truth_count`
  - Anzahl der Ground-Truth-Objekte im Bild
- `predicted_count`
  - Anzahl der vorhergesagten Objekte
- `true_positives`
  - korrekt gematchte Objekte
- `false_positives`
  - zusätzliche Vorhersagen ohne Match
- `false_negatives`
  - verpasste Ground-Truth-Objekte
- `inference_time_ms`
  - Inferenzzeit für dieses Bild
- `error`
  - Fehlermeldung, falls das Bild nicht verarbeitet werden konnte

#### Typische fachliche Fehlerursachen

- Testbilder-Archiv ist leer
- Label-Archiv ist leer
- eines der Archive ist kein gültiges ZIP-Archiv
- Dateinamen von Bild und Label passen nicht zusammen
- Archivgröße überschreitet das konfigurierte Limit
- es sind keine unterstützten Bilder im Testarchiv enthalten

#### Beispiel für eine Fehlerantwort

```json
{
  "error": "bad_request",
  "message": "Das Testbilder-Archiv ist kein gültiges ZIP-Archiv."
}
```

#### Wann kommt ein interner Fehler?

Ein `500 Internal Server Error` deutet darauf hin, dass die Verarbeitung trotz
fachlich plausibler Eingabe nicht erfolgreich abgeschlossen werden konnte.

Beispiel:

```json
{
  "error": "internal_error",
  "message": "Der Benchmark konnte nicht erfolgreich ausgeführt werden."
}
```

---

## Verwendungsbeispiele

### Health Check mit `curl`

```bash
curl -X GET "http://127.0.0.1:8000/api/v1/health"
```

### Prediction mit `curl`

```bash
curl -X POST \
  "http://127.0.0.1:8000/api/v1/predict" \
  -H "accept: application/json" \
  -F "file=@testimage.png;type=image/png"
```

### Benchmark mit `curl`

```bash
curl -X POST \
  "http://127.0.0.1:8000/api/v1/benchmark" \
  -H "accept: application/json" \
  -F "test_archive=@testbilder.zip;type=application/zip" \
  -F "label_archive=@labels.zip;type=application/zip"
```

### Prediction mit Python `requests`

Installiere zunächst `requests`:

```bash
pip install requests
```

Beispiel:

```python
import requests

with open("testimage.png", "rb") as image_file:
    files = {"file": ("testimage.png", image_file, "image/png")}
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/predict",
        files=files,
        timeout=60,
    )

response.raise_for_status()
result = response.json()

print("Request ID:", result["request_id"])
print("Modellversion:", result["model_version"])
print("Inferenzzeit:", result["inference_time_ms"], "ms")
print("Erkennungen:", len(result["detections"]))
```

---

## Backend mit Docker starten

Das API-Image wird aus dem Repository-Root gebaut, weil der Docker-Build neben
`apps/api/` auch `scripts/` und `models/` in das Image kopiert.

### 1. Modellartefakte prüfen

Vor dem Build müssen die gewünschten Modellordner unter `models/darknet/`
vorhanden sein.
Details dazu stehen in:

- [`../../models/README.md`](../../models/README.md)

### 2. Docker-Image bauen

Im Repository-Root:

```bash
docker build -f apps/api/Dockerfile -t waldpilz-api .
```

### 3. Container starten

```bash
docker run --rm -p 8000:8000 waldpilz-api
```

### 4. Erreichbarkeit prüfen

```bash
curl http://127.0.0.1:8000/api/v1/health
```

Erwartete Antwort:

```json
{
  "status": "ok"
}
```

---

## Gemeinsames Deployment mit dem Frontend

Für den regulären Betrieb der Gesamtlösung:

```bash
make deploy
```

Danach ist die Anwendung standardmäßig erreichbar unter:

- `http://127.0.0.1:8080`
- `http://127.0.0.1:8080/api/v1/health`
- `http://127.0.0.1:8080/docs`

Im Deployment gilt:

- das Backend läuft in einem eigenen Container
- das Frontend läuft in einem eigenen Nginx-Container
- das Frontend spricht dieselbe Origin an
- Nginx leitet `/api/v1` intern an die API weiter

### Wichtiger Hinweis für Windows

Wenn du `make deploy` oder andere `make`-Kommandos auf Windows nutzt, führe sie
über **Git Bash** aus. Die Deploy- und Hilfsskripte des Projekts sind
POSIX-Shell-Skripte und sind genau für diesen Ausführungsweg vorgesehen.

---

## Weiterführende Dokumentation

- [`../../README.md`](../../README.md) für den Projektüberblick
- [`../../models/README.md`](../../models/README.md) für Modellartefakte
- [`../../docs/release-guide.md`](../../docs/release-guide.md) für Release und Deployment
