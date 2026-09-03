"""Build a one-class YOLO pothole dataset from local CreateML data and RDD2022.

This tool deliberately does not download data. Download RDD2022 manually from
its official source, review its licence, extract it, then pass --rdd-root.
Only D40/pothole boxes are retained. Images with other road damage but no D40
box can be kept as hard negatives, capped to avoid overwhelming positives.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import shutil
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CREATEML_ROOT = PROJECT_ROOT / "dataset" / "Pothole.v1-raw.createml"
DEFAULT_OUTPUT = Path(__file__).resolve().parent / "data" / "pothole-v2"
CLASS_NAME = "pothole"
SPLITS = ("train", "val", "test")


@dataclass(frozen=True)
class Example:
    image: Path
    boxes: tuple[tuple[float, float, float, float], ...]
    source: str
    source_key: str
    fixed_split: str | None = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="New YOLO dataset directory")
    parser.add_argument("--createml-root", type=Path, default=DEFAULT_CREATEML_ROOT, help="Existing labelled pothole dataset")
    parser.add_argument("--rdd-root", type=Path, help="Extracted RDD2022 root, containing country/train folders")
    parser.add_argument("--max-rdd-negative-ratio", type=float, default=3.0,
                        help="Maximum D40-free RDD images retained per D40-positive image (default: 3)")
    parser.add_argument("--seed", type=int, default=42)
    return parser.parse_args()


def stable_split(key: str, seed: int) -> str:
    value = int(hashlib.sha256(f"{seed}:{key}".encode("utf-8")).hexdigest()[:8], 16) / 0xFFFFFFFF
    if value < 0.70:
        return "train"
    if value < 0.85:
        return "val"
    return "test"


def image_size(path: Path) -> tuple[int, int]:
    with Image.open(path) as image:
        return image.size


def valid_box(x1: float, y1: float, x2: float, y2: float, width: int, height: int) -> tuple[float, float, float, float] | None:
    x1, x2 = sorted((max(0.0, min(float(width), x1)), max(0.0, min(float(width), x2))))
    y1, y2 = sorted((max(0.0, min(float(height), y1)), max(0.0, min(float(height), y2))))
    if x2 - x1 < 2 or y2 - y1 < 2:
        return None
    return x1 / width, y1 / height, x2 / width, y2 / height


def load_createml(root: Path) -> list[Example]:
    examples: list[Example] = []
    split_map = {"train": "train", "valid": "val", "test": "test"}
    for source_split, target_split in split_map.items():
        annotation_path = root / source_split / "_annotations.createml.json"
        if not annotation_path.is_file():
            continue
        for item in json.loads(annotation_path.read_text(encoding="utf-8")):
            image = root / source_split / item["image"]
            if not image.is_file():
                print(f"WARNING: missing CreateML image: {image}", file=sys.stderr)
                continue
            width, height = image_size(image)
            boxes = []
            for annotation in item.get("annotations", []):
                if str(annotation.get("label", "")).strip().lower() != CLASS_NAME:
                    continue
                coordinates = annotation.get("coordinates", {})
                x, y = float(coordinates["x"]), float(coordinates["y"])
                box_width, box_height = float(coordinates["width"]), float(coordinates["height"])
                box = valid_box(x - box_width / 2, y - box_height / 2, x + box_width / 2, y + box_height / 2, width, height)
                if box is not None:
                    boxes.append(box)
            examples.append(Example(image, tuple(boxes), "createml", f"{source_split}/{item['image']}", target_split))
    return examples


def is_pothole_label(label: str) -> bool:
    normalized = label.strip().upper().replace("_", " ")
    return normalized in {"D40", "POTHOLE"} or "POTHOLE" in normalized


def find_rdd_image(xml_path: Path, filename: str | None) -> Path | None:
    images_dir = xml_path.parents[2] / "images"
    candidates = [images_dir / filename] if filename else []
    candidates.extend(images_dir / f"{xml_path.stem}{suffix}" for suffix in (".jpg", ".jpeg", ".png", ".JPG", ".JPEG", ".PNG"))
    return next((candidate for candidate in candidates if candidate.is_file()), None)


def load_rdd(root: Path, negative_ratio: float, seed: int) -> list[Example]:
    positives: list[Example] = []
    negatives: list[Example] = []
    for xml_path in root.rglob("annotations/xmls/*.xml"):
        try:
            tree = ET.parse(xml_path)
            document = tree.getroot()
            filename = document.findtext("filename")
            image = find_rdd_image(xml_path, filename)
            if image is None:
                print(f"WARNING: no matching RDD image for {xml_path}", file=sys.stderr)
                continue
            size = document.find("size")
            width = int(size.findtext("width", "0")) if size is not None else 0
            height = int(size.findtext("height", "0")) if size is not None else 0
            if width <= 0 or height <= 0:
                width, height = image_size(image)
            boxes = []
            for object_node in document.findall("object"):
                if not is_pothole_label(object_node.findtext("name", "")):
                    continue
                box_node = object_node.find("bndbox")
                if box_node is None:
                    continue
                box = valid_box(
                    float(box_node.findtext("xmin", "0")), float(box_node.findtext("ymin", "0")),
                    float(box_node.findtext("xmax", "0")), float(box_node.findtext("ymax", "0")), width, height,
                )
                if box is not None:
                    boxes.append(box)
            example = Example(image, tuple(boxes), "rdd2022", xml_path.relative_to(root).as_posix())
            (positives if boxes else negatives).append(example)
        except (ET.ParseError, OSError, ValueError) as exc:
            print(f"WARNING: could not read {xml_path}: {exc}", file=sys.stderr)
    random.Random(seed).shuffle(negatives)
    kept_negatives = negatives[:round(len(positives) * max(0.0, negative_ratio))]
    print(f"RDD2022: {len(positives)} positive images, {len(kept_negatives)} hard negatives retained", file=sys.stderr)
    return positives + kept_negatives


def yolo_lines(boxes: Iterable[tuple[float, float, float, float]]) -> str:
    rows = []
    for x1, y1, x2, y2 in boxes:
        rows.append(f"0 {(x1 + x2) / 2:.6f} {(y1 + y2) / 2:.6f} {x2 - x1:.6f} {y2 - y1:.6f}")
    return "\n".join(rows) + ("\n" if rows else "")


def build_dataset(output: Path, examples: list[Example], seed: int) -> dict[str, object]:
    if output.exists() and any(output.iterdir()):
        raise FileExistsError(f"Output already exists and is not empty: {output}. Choose a new --output path.")
    for split in SPLITS:
        (output / "images" / split).mkdir(parents=True, exist_ok=True)
        (output / "labels" / split).mkdir(parents=True, exist_ok=True)

    stats: dict[str, Counter[str]] = {split: Counter() for split in SPLITS}
    manifest_examples = []
    for example in examples:
        split = example.fixed_split or stable_split(example.source_key, seed)
        suffix = example.image.suffix.lower() or ".jpg"
        safe_key = hashlib.sha1(example.source_key.encode("utf-8")).hexdigest()[:12]
        stem = f"{example.source}-{safe_key}"
        destination_image = output / "images" / split / f"{stem}{suffix}"
        destination_label = output / "labels" / split / f"{stem}.txt"
        shutil.copy2(example.image, destination_image)
        destination_label.write_text(yolo_lines(example.boxes), encoding="utf-8")
        stats[split]["images"] += 1
        stats[split]["boxes"] += len(example.boxes)
        stats[split][f"{example.source}_images"] += 1
        manifest_examples.append({
            "image": destination_image.relative_to(output).as_posix(),
            "source": example.source,
            "source_key": example.source_key,
            "split": split,
            "potholes": len(example.boxes),
        })

    yaml_text = "\n".join([
        f"path: {output.as_posix()}",
        "train: images/train",
        "val: images/val",
        "test: images/test",
        "names:",
        "  0: pothole",
        "",
    ])
    (output / "pothole.yaml").write_text(yaml_text, encoding="utf-8")
    manifest = {
        "schema_version": 1,
        "class_names": [CLASS_NAME],
        "seed": seed,
        "splits": {split: dict(counter) for split, counter in stats.items()},
        "examples": manifest_examples,
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    return manifest


def main() -> None:
    args = parse_args()
    examples = load_createml(args.createml_root)
    if args.rdd_root:
        if not args.rdd_root.is_dir():
            raise FileNotFoundError(f"RDD2022 root does not exist: {args.rdd_root}")
        examples.extend(load_rdd(args.rdd_root, args.max_rdd_negative_ratio, args.seed))
    if not examples:
        raise RuntimeError("No labelled pothole examples were found")
    manifest = build_dataset(args.output, examples, args.seed)
    print(json.dumps({"output": str(args.output), "splits": manifest["splits"]}, indent=2))


if __name__ == "__main__":
    main()
