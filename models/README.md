# Modelle

## Zweck dieses Verzeichnisses

Unter `models/` liegen die Modellartefakte und modellbezogenen Hilfsdaten, die
für Prediction, Benchmark und Deployment der Waldpilz-Anwendung benötigt werden.

Für neue Entwickler ist dieser Ordner besonders wichtig, weil die Anwendung
ohne die Darknet-Dateien zwar starten kann, Prediction und Benchmark aber nicht
sinnvoll funktionieren.

---

## Wichtige Unterordner

```text
models/
├─ darknet/
├─ benchmark/
└─ dataset/
```

### `models/darknet/`

Enthält die aktuell aktiven Darknet-Artefakte für die Anwendung.

### `models/darknet/old_model/`

Enthält ältere Modellstände, die nicht mehr standardmäßig aktiv verwendet
werden, aber für Vergleichszwecke oder Rückfragen weiterhin verfügbar sind.

### `models/benchmark/`

Enthält benchmarkbezogene Daten oder Hilfsdateien.

### `models/dataset/`

Enthält datensatzbezogene Skripte oder Hilfsmittel, zum Beispiel für die
Erzeugung negativer Samples.

---

## Aktiver Modellstand

Die aktuell verwendete Modellversionsbezeichnung lautet:

```text
darknet-cnn-v1.1
```

Wichtig:

- Die **Versionsbezeichnung** wird über `MODEL_VERSION` beziehungsweise im
  Docker-Deployment über `API_MODEL_VERSION` gesteuert.
- Die **tatsächlich geladenen Dateien** liegen im aktiven Zustand direkt unter
  `models/darknet/`.
- Ältere Modellstände unter `models/darknet/old_model/` werden nicht
  automatisch verwendet.

Wenn Frontend oder API eine unerwartete Modellversion anzeigen, sollten diese
Stellen geprüft werden:

- `apps/api/.env`
- `ops/docker/.env`
- `apps/api/Dockerfile`

---

## Erforderliche Dateien unter `models/darknet/`

Für die lokale Inferenz, den Benchmark und das Docker-Deployment werden
mindestens diese Dateien benötigt:

- `Bilderkennung-Pilzwachstum.cfg`
- `Bilderkennung-Pilzwachstum.data`
- `Bilderkennung-Pilzwachstum.names`
- `Bilderkennung-Pilzwachstum_best.weights`

### Rolle der einzelnen Dateien

- `Bilderkennung-Pilzwachstum.cfg`
  - Darknet-Netzkonfiguration
- `Bilderkennung-Pilzwachstum.data`
  - Darknet-Datendatei mit Verweisen auf weitere Artefakte
- `Bilderkennung-Pilzwachstum.names`
  - Klassennamen-Datei
- `Bilderkennung-Pilzwachstum_best.weights`
  - trainierte Gewichte des Modells

Zusätzlich können weitere Dateien im Ordner liegen, zum Beispiel:

- `predictions.jpg`
  - letzte Darknet-Ausgabe bei manueller Inferenz
- `Beispielbilder/`
  - Testmaterial für manuelle Prüfungen

---

## Besonders wichtig: der `names`-Pfad in der `.data`-Datei

Die Datei `Bilderkennung-Pilzwachstum.data` verweist aktuell auf:

```text
names = ./Bilderkennung-Pilzwachstum.names
```

Dieser Eintrag ist wichtig, weil `scripts/inference.sh` vor dem Darknet-Start in
den Ordner `models/darknet/` wechselt und Darknet anschließend mit relativen
Dateinamen startet.

Ein falscher `names`-Pfad kann dazu führen, dass Darknet beim Start abbricht.

Darum sollte bei Modellupdates immer geprüft werden:

1. liegt die `.names`-Datei wirklich im erwarteten Ordner?
2. verweist die `.data`-Datei relativ korrekt darauf?
3. wurden beim Austausch der Modellartefakte keine alten Pfade übernommen?

---

## Welche Prüfungen das Projekt bereits automatisch macht

### Bei `make deploy`

Vor dem Docker-Build wird geprüft:

- dass `models/darknet/` existiert
- dass `.data`, `.cfg` und `.weights` vorhanden sind

Fehlen diese Dateien, bricht das Deployment vor dem Image-Build mit einer klaren
Fehlermeldung ab.

### In `scripts/inference.sh`

Vor der Ausführung von Darknet wird geprüft:

- dass das Bild existiert
- dass der Modellordner existiert
- dass das Darknet-Binary vorhanden und ausführbar ist
- dass `.data`, `.cfg` und `.weights` existieren
- dass die in der `.data`-Datei referenzierte `names`-Datei vorhanden ist

Diese Prüfungen sind bewusst eingebaut, damit typische Modellfehler früh
auffallen und nicht erst als schwer verständlicher Darknet-Absturz auftreten.

---

## Relevante Umgebungsvariablen

Für Spezialfälle können diese Variablen gesetzt oder überschrieben werden:

- `MODEL_DIR`
- `DARKNET_DIR`
- `DARKNET_BIN`
- `DARKNET_DATA_FILE`
- `DARKNET_CFG_FILE`
- `DARKNET_WEIGHTS_FILE`

### Wann sind diese Variablen relevant?

- wenn lokal ein anderes Darknet-Binary getestet werden soll
- wenn ein alternativer Modellordner verwendet werden soll
- wenn eine Modellmigration vorbereitet oder verglichen wird

Im Standardfall sind diese Variablen nicht nötig, weil das Projekt sinnvolle
Defaults verwendet.

---

## Hinweise für Modellupdates

Wenn neue Modellartefakte eingespielt werden, empfiehlt sich dieser Ablauf:

1. Neue Dateien zunächst prüfen und vollständig bereitstellen.
2. Sicherstellen, dass `.cfg`, `.data`, `.names` und `.weights` zueinander passen.
3. Den `names`-Eintrag in der `.data`-Datei prüfen.
4. Die gewünschte Versionsbezeichnung in der Konfiguration aktualisieren.
5. Prediction lokal testen.
6. Benchmark mit repräsentativen Daten ausführen.
7. Erst danach Docker-Deployment oder Release vorbereiten.

### Typische Fehler bei Modellupdates

- nur Gewichte austauschen, aber `.cfg` nicht anpassen
- `MODEL_VERSION` ändern, aber die Compose-Defaults nicht aktualisieren
- alte Pfade aus einer früheren `.data`-Datei übernehmen
- neue Dateien versehentlich in `old_model/` statt in den aktiven Ordner legen

---

## Was neue Entwickler praktisch tun sollten

Wenn du das Projekt frisch aufsetzt, prüfe zuerst:

```bash
ls models/darknet
```

Du solltest mindestens diese Dateien sehen:

```text
Bilderkennung-Pilzwachstum.cfg
Bilderkennung-Pilzwachstum.data
Bilderkennung-Pilzwachstum.names
Bilderkennung-Pilzwachstum_best.weights
```

Wenn diese Dateien fehlen, sind Prediction, Benchmark und Deployment nicht
vollständig funktionsfähig.

---

## Weiterführende Dokumentation

- [`../README.md`](../README.md) für den Gesamtüberblick
- [`../apps/api/README.md`](../apps/api/README.md) für Prediction- und Benchmark-API
- [`../docs/release-guide.md`](../docs/release-guide.md) für Release und Deployment
