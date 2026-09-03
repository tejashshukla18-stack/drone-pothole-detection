"""Train a one-class RDD2022 pothole detector in a GPU runtime."""

from __future__ import annotations

import argparse
from pathlib import Path

from ultralytics import YOLO


def parse_args() -> argparse.Namespace:
    root = Path(__file__).resolve().parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=root / "data" / "pothole-v2" / "pothole.yaml")
    parser.add_argument("--weights", default="yolo26s.pt", help="Start with pretrained YOLO weights")
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--imgsz", type=int, default=960)
    parser.add_argument("--batch", type=int, default=-1, help="-1 lets Ultralytics choose a safe GPU batch size")
    parser.add_argument("--device", default="0", help="Use GPU 0 in Kaggle/Colab; never use CPU for full RDD2022 training")
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--project", type=Path, default=root / "runs")
    parser.add_argument("--name", default="pothole-rdd-v1")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.data.is_file():
        raise FileNotFoundError(f"Dataset YAML not found: {args.data}. Run prepare_pothole_dataset.py first.")
    model = YOLO(args.weights)
    model.train(
        data=str(args.data),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        workers=args.workers,
        project=str(args.project),
        name=args.name,
        seed=42,
        patience=20,
        pretrained=True,
        cos_lr=True,
        close_mosaic=10,
        degrees=3.0,
        translate=0.08,
        scale=0.35,
        fliplr=0.5,
        hsv_h=0.01,
        hsv_s=0.35,
        hsv_v=0.25,
    )


if __name__ == "__main__":
    main()
