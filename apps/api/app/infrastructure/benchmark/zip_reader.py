from pathlib import Path
import shutil

import os

def unpack_zip(zip_file: str) -> str:
    """Entpackt die zip in einen temp Ordner und gibt den Pfad zurück"""
    dir = os.path.dirname(os.path.abspath(__file__))
    temp_folder = os.path.join(dir, "temp")

    if not os.path.exists(temp_folder):
        os.makedirs(temp_folder)

    root_dir = get_root_path()
    zip_path = root_dir / "models" / "benchmark" / zip_file

    shutil.unpack_archive(str(zip_path), str(temp_folder))

    return temp_folder


def get_root_path():
    current = Path(__file__).resolve().parent
    
    for path in [current] + list(current.parents):
        if (path / "Makefile").exists():
            return path
            
    raise FileNotFoundError("Could not find a Makefile in any parent directory!")