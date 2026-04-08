# Modelle

Die projektlokalen Darknet-Artefakte liegen standardmaessig unter `models/darknet/`.

Fuer die Inferenz werden dort diese Dateien erwartet:

- `Bilderkennung-Pilzwachstum.cfg`
- `Bilderkennung-Pilzwachstum.data`
- `Bilderkennung-Pilzwachstum.names`
- `Bilderkennung-Pilzwachstum_best.weights`

Optional koennen unter `models/darknet/Beispielbilder/` lokale Testbilder liegen.

`scripts/inference.sh` verwendet dieses Verzeichnis standardmaessig als `MODEL_DIR`.
Der Darknet-Build wird bevorzugt unter `vendor/darknet/build` gesucht und faellt
ansonsten auf `~/src/darknet/build` zurueck. Beides kann bei Bedarf ueber
`MODEL_DIR`, `DARKNET_DIR`, `DARKNET_DATA_FILE`, `DARKNET_CFG_FILE` und
`DARKNET_WEIGHTS_FILE` ueberschrieben werden.

Die `.gitignore` in diesem Ordner ignoriert standardmaessig grosse lokale
Artefakte wie Gewichte, Trainingslisten, Backups und Beispielbilder. Die
textbasierten Konfigurationsdateien koennen dadurch weiterhin versioniert werden.
