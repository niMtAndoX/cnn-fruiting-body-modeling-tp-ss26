import json
from pathlib import Path
from typing import Any

def parse_json_data(json_path: Path, image_path: Path) -> dict[str, Any]:

    try:
        with open(json_path, 'r', encoding="utf-8") as f:
            full_json = json.load(f)

        label_list = []

        for l in full_json["mark"]:
            label_list.append({
                "label": l["name"],
                "bbox": {
                    "x": l["rect"]["int_x"],
                    "y": l["rect"]["int_y"],
                    "width": l["rect"]["int_w"],
                    "height": l["rect"]["int_h"]
                }
            })

        relevant_json_data = {
            "filename": image_path.name,
            "objects": label_list
        }

        return json.dumps(relevant_json_data, indent=4)

    except (KeyError, json.JSONDecodeError, TypeError) as e:
        print(f"{json_path.name} hat ein ungültiges Format: Key fehlt oder ungültiges Format -> {e}")
        return None
    except Exception as e:
        print(f"Unerwarteter Fehler in {json_path.name}: {e}")
        return None