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

Enthält die versionierten Darknet-Modellordner der Anwendung, zum Beispiel
`darknet-cnn-v1`, `darknet-cnn-v1.1` oder `darknet-cnn-v1.2`.

### `models/benchmark/`

Enthält benchmarkbezogene Daten oder Hilfsdateien.

### `models/dataset/`

Enthält datensatzbezogene Skripte oder Hilfsmittel, zum Beispiel für die
Erzeugung negativer Samples.

---

## Verfügbare und standardmäßige Modellstände

Die verfügbaren Modellversionen werden direkt aus den Unterordnern unter
`models/darknet/` gelesen. Jeder Ordnername nach dem Schema
`darknet-cnn-v*` entspricht genau einer auswählbaren Modellversion.

Der aktuelle Deployment-Default lautet:

```text
darknet-cnn-v1.1
```

Wichtig:

- Die **Standard-Modellversion** wird über `MODEL_VERSION` beziehungsweise im
  Docker-Deployment über `API_MODEL_VERSION` gesteuert.
- Die **tatsächlich geladenen Dateien** liegen pro Modell in ihrem jeweiligen
  Unterordner, also zum Beispiel unter
  `models/darknet/darknet-cnn-v1.1/`.
- Auf der Prediction- und Benchmark-Seite kann zur Laufzeit zwischen allen
  verfügbaren Modellordnern umgeschaltet werden.
- Im Docker-Build werden alle Unterordner unter `models/darknet/` in den
  Container kopiert.

Wenn Frontend oder API eine unerwartete Modellversion anzeigen, sollten diese
Stellen geprüft werden:

- `models/darknet/`
- `apps/api/.env`
- `ops/docker/.env`
- `apps/api/Dockerfile`

---

## Erforderliche Dateien pro Modellordner

Für die lokale Inferenz, den Benchmark und das Docker-Deployment werden
pro verwendetem Modellordner mindestens diese Dateien benötigt:

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
  - letzte Darknet-Ausgabe für genau diesen Modellordner

---

## Besonders wichtig: der `names`-Pfad in der `.data`-Datei

Die Datei `Bilderkennung-Pilzwachstum.data` verweist aktuell auf:

```text
names = ./Bilderkennung-Pilzwachstum.names
```

Dieser Eintrag ist wichtig, weil `scripts/inference.sh` vor dem Darknet-Start in
den jeweils ausgewählten Modellordner wechselt und Darknet anschließend mit
relativen Dateinamen startet.

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
- dass mindestens ein Modellordner `darknet-cnn-v*` mit `.data`, `.cfg` und
  `.weights` vorhanden ist
- dass der konfigurierte Default-Modellordner existiert, falls
  `API_MODEL_VERSION` oder `MODEL_VERSION` gesetzt ist

Fehlen diese Dateien, bricht das Deployment vor dem Image-Build mit einer
klaren Fehlermeldung ab.

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

- `MODEL_ROOT_DIR`
- `MODEL_DIR`
- `DARKNET_DIR`
- `DARKNET_BIN`
- `DARKNET_DATA_FILE`
- `DARKNET_CFG_FILE`
- `DARKNET_WEIGHTS_FILE`

### Wann sind diese Variablen relevant?

- wenn lokal ein anderes Darknet-Binary getestet werden soll
- wenn das Wurzelverzeichnis der Modellordner angepasst werden soll
- wenn für einen einzelnen Darknet-Aufruf ein alternativer Modellordner
  verwendet werden soll
- wenn eine Modellmigration vorbereitet oder verglichen wird

Im Standardfall sind diese Variablen nicht nötig, weil das Projekt sinnvolle
Defaults verwendet.

---

## Hinweise für Modellupdates

Wenn neue Modellartefakte eingespielt werden, empfiehlt sich dieser Ablauf:

1. Einen neuen Unterordner unter `models/darknet/` anlegen, zum Beispiel
   `models/darknet/darknet-cnn-v1.3/`.
2. Neue Dateien zunächst prüfen und vollständig in diesem Ordner bereitstellen.
3. Sicherstellen, dass `.cfg`, `.data`, `.names` und `.weights` zueinander passen.
4. Den `names`-Eintrag in der `.data`-Datei prüfen.
5. Falls gewünscht, `MODEL_VERSION` beziehungsweise `API_MODEL_VERSION` auf den
   neuen Default anpassen.
6. Prediction lokal testen.
7. Benchmark mit repräsentativen Daten ausführen.
8. Erst danach Docker-Deployment oder Release vorbereiten.

### Typische Fehler bei Modellupdates

- nur Gewichte austauschen, aber `.cfg` nicht anpassen
- `MODEL_VERSION` oder `API_MODEL_VERSION` ändern, obwohl der Ordnername nicht
  exakt dazu passt
- alte Pfade aus einer früheren `.data`-Datei übernehmen
- neue Dateien versehentlich direkt unter `models/darknet/` statt in einen
  versionierten Unterordner legen

---

## Was neue Entwickler praktisch tun sollten

Wenn du das Projekt frisch aufsetzt, prüfe zuerst:

```bash
ls models/darknet
```

Du solltest dort Modellordner wie diese sehen:

```text
darknet-cnn-v1
darknet-cnn-v1.1
darknet-cnn-v1.2
```

Zusätzlich sollte mindestens einer dieser Ordner die vier erforderlichen
Darknet-Dateien enthalten. Wenn keine solchen Modellordner vorhanden sind,
sind Prediction, Benchmark und Deployment nicht vollständig funktionsfähig.

---

## Weiterführende Dokumentation

- [`../README.md`](../README.md) für den Gesamtüberblick
- [`../apps/api/README.md`](../apps/api/README.md) für Prediction- und Benchmark-API
- [`../docs/release-guide.md`](../docs/release-guide.md) für Release und Deployment
