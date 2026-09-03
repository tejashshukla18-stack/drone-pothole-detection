"""Choose a deployment confidence threshold from an untouched YOLO test split."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from ultralytics import YOLO


IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--weights", type=Path, required=True)
    parser.add_argument("--images", type=Path, required=True, help="Held-out test images directory")
    parser.add_argument("--labels", type=Path, required=True, help="Matching YOLO labels directory")
    parser.add_argument("--device", default="0")
    parser.add_argument("--imgsz", type=int, default=960)
    parser.add_argument("--iou", type=float, default=0.5, help="IoU required for a true positive")
    parser.add_argument("--output", type=Path, default=Path("threshold-report.json"))
    return parser.parse_args()


def iou(first: tuple[float, float, float, float], second: tuple[float, float, float, float]) -> float:
    ax1, ay1, ax2, ay2 = first
    bx1, by1, bx2, by2 = second
    intersection = max(0.0, min(ax2, bx2) - max(ax1, bx1)) * max(0.0, min(ay2, by2) - max(ay1, by1))
    union = (ax2 - ax1) * (ay2 - ay1) + (bx2 - bx1) * (by2 - by1) - intersection
    return intersection / union if union else 0.0


def ground_truth(label_path: Path, width: int, height: int) -> list[tuple[float, float, float, float]]:
    if not label_path.is_file():
        return []
    boxes = []
    for line in label_path.read_text(encoding="utf-8").splitlines():
        parts = line.split()
        if len(parts) != 5 or parts[0] != "0":
            continue
        _, cx, cy, box_width, box_height = (float(value) for value in parts)
        cx, cy, box_width, box_height = cx * width, cy * height, box_width * width, box_height * height
        boxes.append((cx - box_width / 2, cy - box_height / 2, cx + box_width / 2, cy + box_height / 2))
    return boxes


def score(records: list[dict[str, Any]], threshold: float, minimum_iou: float) -> dict[str, float | int]:
    true_positive = false_positive = false_negative = 0
    for record in records:
        matched: set[int] = set()
        predictions = [prediction for prediction in record["predictions"] if prediction[0] >= threshold]
        for _, prediction_box in predictions:
            match_index = next((index for index, target in enumerate(record["targets"])
                                if index not in matched and iou(prediction_box, target) >= minimum_iou), None)
            if match_index is None:
                false_positive += 1
            else:
                true_positive += 1
                matched.add(match_index)
        false_negative += len(record["targets"]) - len(matched)
    precision = true_positive / max(1, true_positive + false_positive)
    recall = true_positive / max(1, true_positive + false_negative)
    f1 = 2 * precision * recall / max(1e-12, precision + recall)
    return {"threshold": threshold, "precision": round(precision, 4), "recall": round(recall, 4), "f1": round(f1, 4),
            "true_positive": true_positive, "false_positive": false_positive, "false_negative": false_negative}


def main() -> None:
    args = parse_args()
    images = sorted(path for path in args.images.iterdir() if path.suffix.lower() in IMAGE_SUFFIXES)
    if not images:
        raise FileNotFoundError(f"No images found in {args.images}")
    model = YOLO(str(args.weights))
    records = []
    for index, image_path in enumerate(images, start=1):
        result = model.predict(str(image_path), conf=0.05, imgsz=args.imgsz, device=args.device, verbose=False)[0]
        height, width = result.orig_shape
        predictions = []
        if result.boxes is not None:
            for box in result.boxes:
                if int(box.cls[0].item()) != 0:
                    continue
                x1, y1, x2, y2 = (float(value) for value in box.xyxy[0].tolist())
                predictions.append((float(box.conf[0].item()), (x1, y1, x2, y2)))
        records.append({"targets": ground_truth(args.labels / f"{image_path.stem}.txt", width, height), "predictions": predictions})
        if index % 100 == 0:
            print(f"Predicted {index}/{len(images)} images")
    scores = [score(records, round(threshold / 100, 2), args.iou) for threshold in range(5, 96, 5)]
    best = max(scores, key=lambda item: (item["f1"], item["precision"]))
    report = {"weights": str(args.weights), "images": len(images), "iou": args.iou, "recommended_confidence": best["threshold"],
              "best": best, "thresholds": scores}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
