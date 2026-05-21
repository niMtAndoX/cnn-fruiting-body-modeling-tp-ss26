from pathlib import Path
import argparse
import uuid


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Benennt negative Sample-Bilder um und erstellt leere YOLO-TXT-Dateien."
    )
    parser.add_argument(
        "folder",
        type=Path,
        help="Pfad zum Ordner mit den Bildern",
    )
    parser.add_argument(
        "name",
        type=str,
        help="Basisname für die Bilder, z. B. negativ_sample",
    )
    parser.add_argument(
        "--start",
        type=int,
        default=1,
        help="Start-ID, Standard: 1",
    )
    parser.add_argument(
        "--digits",
        type=int,
        default=4,
        help="Anzahl Stellen der ID, Standard: 4",
    )

    args = parser.parse_args()

    folder: Path = args.folder
    base_name: str = args.name
    start_id: int = args.start
    digits: int = args.digits

    if not folder.exists():
        raise SystemExit(f"Ordner nicht gefunden: {folder}")

    if not folder.is_dir():
        raise SystemExit(f"Pfad ist kein Ordner: {folder}")

    images = sorted(
        [
            file
            for file in folder.iterdir()
            if file.is_file() and file.suffix.lower() in IMAGE_EXTENSIONS
        ],
        key=lambda path: path.name.lower(),
    )

    if not images:
        raise SystemExit("Keine passenden Bilddateien gefunden.")

    print(f"Gefundene Bilder: {len(images)}")
    print()

    # Sicherheitsprüfung: Zielnamen dürfen noch nicht existieren
    planned_targets = []
    for index, image in enumerate(images, start=start_id):
        new_stem = f"{base_name}_{index:0{digits}d}"
        new_image_path = folder / f"{new_stem}{image.suffix.lower()}"
        new_label_path = folder / f"{new_stem}.txt"

        planned_targets.append((image, new_image_path, new_label_path))

        if new_image_path.exists() and new_image_path != image:
            raise SystemExit(f"Zielbild existiert bereits: {new_image_path}")

        if new_label_path.exists():
            raise SystemExit(f"Ziel-TXT existiert bereits: {new_label_path}")

    # Erst temporär umbenennen, damit es keine Namenskollisionen gibt
    temp_files = []
    for old_image_path, _, _ in planned_targets:
        temp_path = folder / f"__tmp__{uuid.uuid4().hex}{old_image_path.suffix.lower()}"
        old_image_path.rename(temp_path)
        temp_files.append(temp_path)

    # Final benennen und leere TXT-Dateien erstellen
    for temp_path, (_, new_image_path, new_label_path) in zip(temp_files, planned_targets):
        temp_path.rename(new_image_path)
        new_label_path.touch()

        print(f"{new_image_path.name}")
        print(f"{new_label_path.name} erstellt")
        print()

    print("Fertig.")


if __name__ == "__main__":
    main()