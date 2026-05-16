# Modelle

Die Darknet-Artefakte fuer Deployment und lokale Inferenz liegen standardmaessig
unter `models/darknet/`.

Fuer ein kundentaugliches `make deploy` muss ein Release-Bundle oder ein
ausgecheckter Projektstand diese Dateien bereits enthalten:

- `Bilderkennung-Pilzwachstum.cfg`
- `Bilderkennung-Pilzwachstum.data`
- `Bilderkennung-Pilzwachstum_best.weights`

Zusaetzlich liegt aktuell auch `Bilderkennung-Pilzwachstum.names` in diesem
Ordner. Falls die `.data`-Datei auf weitere Dateien verweist, muessen diese
ebenfalls im Release-Bundle enthalten sein.

`make deploy` prueft vor dem Docker-Build explizit:

- dass `models/darknet/` existiert
- dass `.data`, `.cfg` und `.weights` vorhanden sind

Fehlen diese Dateien, bricht das Deployment vor dem Image-Build mit einer klaren
Fehlermeldung ab.

`scripts/inference.sh` verwendet dieses Verzeichnis standardmaessig als
`MODEL_DIR`. Im Container setzt das API-Image `MODEL_DIR` und `DARKNET_BIN`
explizit. Fuer lokale Sonderfaelle koennen weiterhin `MODEL_DIR`,
`DARKNET_DIR`, `DARKNET_DATA_FILE`, `DARKNET_CFG_FILE` und
`DARKNET_WEIGHTS_FILE` ueberschrieben werden.

Die `.gitignore` in diesem Ordner ignoriert standardmaessig grosse lokale
Artefakte wie Gewichte, Trainingslisten, Backups und Beispielbilder. Die
textbasierten Konfigurationsdateien koennen dadurch weiterhin versioniert werden.
