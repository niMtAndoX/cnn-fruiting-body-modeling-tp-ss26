from pathlib import Path

from app.domain.benchmark.entities import BenchmarkImageContainer, ImageLabelData
from app.infrastructure.benchmark.label_parser import parse_json_data
from app.infrastructure.benchmark.zip_reader import unpack_zip


def get_image_data(zip_name: str) -> BenchmarkImageContainer:
    """Die Zip Datei wird im models/benchmark ordner erwartet. die label json Dateien sollen im gleichen Ordner, 
    wie die Bilder liegen, um naming Konflikte zu vermeiden"""
    temp_folder = unpack_zip(zip_name)

    image_data_list = []

    extensions = {".jpg", ".jpeg", ".png"}

    for p in (p for p in Path(temp_folder).rglob('*') if p.suffix.lower() in extensions):
        json_path = p.with_suffix(".json")

        if json_path.exists():
            data = parse_json_data(json_path, p)
        else:
            data = None

        if data is not None:
            image_data = ImageLabelData(p, data)
            image_data_list.append(image_data)

    images = BenchmarkImageContainer(image_data_list, len(image_data_list))

    if images.total_images == 0:
        return None

    return images
