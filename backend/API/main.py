"""Bridge-defect CV sidecar for the Express/React inspection dashboard.

The sidecar owns the Python/Ultralytics runtime. The Node backend proxies browser
uploads to it and retains the existing /api/inspect-batch response contract.
"""

from __future__ import annotations

import asyncio
import base64
import json
import os
import threading
import time
import uuid
from collections import deque
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal

import cv2
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

MODEL_PATH = Path(os.getenv("BRIDGE_MODEL_PATH", Path(__file__).parent / "models" / "bridge-defect-yolo26m.pt"))
BRIDGE_MODEL_REPO = os.getenv("BRIDGE_MODEL_REPO", "").strip()
BRIDGE_MODEL_FILENAME = os.getenv("BRIDGE_MODEL_FILENAME", "bridge-defect-yolo26m.pt")
POTHOLE_MODEL_PATH = Path(os.getenv("POTHOLE_MODEL_PATH", Path(__file__).parent / "models" / "pothole-rdd-v1.pt"))
DEVICE = os.getenv("BRIDGE_MODEL_DEVICE", "cpu")
DEFAULT_CONFIDENCE = float(os.getenv("BRIDGE_MODEL_CONFIDENCE", "0.45"))
POTHOLE_VIDEO_CONFIDENCE = float(os.getenv("POTHOLE_VIDEO_CONFIDENCE", "0.65"))
BRIDGE_VIDEO_CONFIDENCE = float(os.getenv("BRIDGE_VIDEO_CONFIDENCE", "0.10"))
MAX_BATCH_SIZE = 50
MAX_IMAGE_BYTES = 50 * 1024 * 1024
PROJECT_ROOT = Path(__file__).resolve().parents[2]
VIDEO_UPLOAD_ROOT = Path(os.getenv("VIDEO_UPLOAD_ROOT", PROJECT_ROOT / "runtime" / "video-uploads")).resolve()
VIDEO_RESULTS_ROOT = Path(os.getenv("VIDEO_RESULTS_ROOT", PROJECT_ROOT / "runtime" / "video-results")).resolve()
LIVE_OUTPUT_ROOT = Path(os.getenv("LIVE_OUTPUT_ROOT", PROJECT_ROOT / "runtime" / "live")).resolve()
DETECTION_LOG_PATH = Path(os.getenv("DETECTION_LOG_PATH", PROJECT_ROOT / "runtime" / "detections.json")).resolve()
DEFAULT_VIDEO_SAMPLE_FPS = float(os.getenv("VIDEO_SAMPLE_FPS", "4"))
DEFAULT_LIVE_INFERENCE_FPS = float(os.getenv("LIVE_INFERENCE_FPS", "3"))
LIVE_DEDUP_SECONDS = float(os.getenv("LIVE_DEDUP_SECONDS", "3"))
MAX_VIDEO_FILES = 5
MAX_LIVE_STREAMS = 4

SEVERITY_BY_CLASS = {
    "bridge_crack": "High",
    "exposed_rebar": "P1 Critical",
    "rust": "Medium",
    "spalling": "High",
    "scaling": "Medium",
    "efflorescence": "Low",
    "surface_defect": "Medium",
    "pothole": "High",
}


class VisionModels:
    def __init__(self) -> None:
        self.bridge_model: Any | None = None
        self.bridge_error: str | None = None
        self.pothole_model: Any | None = None
        self.pothole_error: str | None = None
        self.pothole_source: str = "DanielsStulpe/pothole-detection"
        self.bridge_lock = threading.Lock()
        self.pothole_lock = threading.Lock()

    def load(self) -> None:
        try:
            model_path = MODEL_PATH
            if not model_path.is_file() and BRIDGE_MODEL_REPO:
                from huggingface_hub import hf_hub_download
                model_path = Path(hf_hub_download(repo_id=BRIDGE_MODEL_REPO, filename=BRIDGE_MODEL_FILENAME))
            if not model_path.is_file():
                location = f"or set BRIDGE_MODEL_REPO and BRIDGE_MODEL_FILENAME" if not BRIDGE_MODEL_REPO else ""
                raise FileNotFoundError(f"Bridge model not found: {MODEL_PATH} {location}".strip())
            from ultralytics import YOLO
            self.bridge_model = YOLO(str(model_path))
            # Class labels are stored in the trained checkpoint; retain this explicit
            # mapping as a compatible fallback for results serialized by Ultralytics.
            self.bridge_error = None
        except Exception as exc:
            self.bridge_model = None
            self.bridge_error = str(exc)

    def _pothole(self) -> Any:
        """Load the Hugging Face pothole model lazily so bridge inspection boots fast."""
        if self.pothole_model is not None:
            return self.pothole_model
        with self.pothole_lock:
            if self.pothole_model is not None:
                return self.pothole_model
            try:
                from huggingface_hub import hf_hub_download
                from ultralytics import YOLO

                errors: list[str] = []
                # A locally trained RDD2022 model takes precedence when it has
                # been explicitly deployed. Keep the Hugging Face model as the
                # safe fallback until training and threshold calibration finish.
                if POTHOLE_MODEL_PATH.is_file():
                    try:
                        self.pothole_model = YOLO(str(POTHOLE_MODEL_PATH))
                        self.pothole_source = str(POTHOLE_MODEL_PATH)
                        self.pothole_error = None
                        return self.pothole_model
                    except Exception as exc:
                        errors.append(f"local model {POTHOLE_MODEL_PATH}: {exc}")
                for filename in ("yolo26_best.pt", "yolo11_best.pt", "yolov8_best.pt"):
                    try:
                        weights = hf_hub_download(repo_id="DanielsStulpe/pothole-detection", filename=filename)
                        self.pothole_model = YOLO(weights)
                        self.pothole_source = "DanielsStulpe/pothole-detection"
                        self.pothole_error = None
                        return self.pothole_model
                    except Exception as exc:
                        errors.append(f"{filename}: {exc}")
                raise RuntimeError("; ".join(errors))
            except Exception as exc:
                self.pothole_error = str(exc)
                raise RuntimeError(f"Hugging Face pothole model unavailable: {exc}") from exc

    def _model_and_lock(self, model_key: str) -> tuple[Any, threading.Lock]:
        if model_key == "bridge":
            if self.bridge_model is None:
                raise RuntimeError(self.bridge_error or "Bridge model is not loaded")
            return self.bridge_model, self.bridge_lock
        if model_key == "pothole":
            return self._pothole(), self.pothole_lock
        raise ValueError("model must be 'pothole' or 'bridge'")

    def infer(self, image_bytes: bytes, filename: str, confidence: float) -> dict[str, Any]:
        encoded = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(encoded, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Unsupported or corrupt image")
        return self.infer_frame(image, filename, "bridge", confidence)

    def infer_frame(
        self,
        image: np.ndarray,
        filename: str,
        model_key: Literal["pothole", "bridge", "both"],
        confidence: float | dict[str, float],
    ) -> dict[str, Any]:
        """Run one model, or both models, against one OpenCV frame.

        The locks keep independent model instances safe while allowing the capture
        worker to continue replacing its two-frame circular buffer.
        """
        started = time.perf_counter()
        model_keys = ("pothole", "bridge") if model_key == "both" else (model_key,)
        predictions: list[Any] = []
        for current_model_key in model_keys:
            model, model_lock = self._model_and_lock(current_model_key)
            current_confidence = confidence[current_model_key] if isinstance(confidence, dict) else confidence
            # Ultralytics/PyTorch model access is serialized because a model instance
            # is not safely re-entrant on every CPU/GPU configuration.
            with model_lock:
                predictions.append(model.predict(image, conf=current_confidence, device=DEVICE, imgsz=640, verbose=False)[0])
        processing_ms = round((time.perf_counter() - started) * 1000)
        annotated = image.copy()
        detections: list[dict[str, Any]] = []
        for prediction in predictions:
            names = prediction.names
            if prediction.boxes is not None:
                for box in prediction.boxes:
                    x1, y1, x2, y2 = (int(value) for value in box.xyxy[0].tolist())
                    class_id = int(box.cls[0].item())
                    label = str(names.get(class_id, class_id)) if isinstance(names, dict) else str(names[class_id])
                    score = float(box.conf[0].item())
                    width, height = max(0, x2 - x1), max(0, y2 - y1)
                    area_ratio = (width * height) / max(1, image.shape[0] * image.shape[1])
                    severity = severity_for(label, area_ratio)
                    color = severity_color(severity)
                    cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(annotated, f"{label} {score:.0%}", (x1, max(22, y1 - 8)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.60, color, 2, cv2.LINE_AA)
                    detections.append({
                        "id": f"box-{uuid.uuid4().hex[:10]}",
                        "x": x1, "y": y1, "width": width, "height": height,
                        "confidence": f"{score:.0%}", "confidence_score": round(score, 4),
                        "label": label, "severity": severity, "status": "Detected",
                        "area_ratio": round(area_ratio, 6),
                    })
        ok, rendered = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 90])
        if not ok:
            raise RuntimeError("Could not render annotated image")
        highest = max((d["severity"] for d in detections), key=severity_rank, default="None")
        return {
            "id": f"frame-{uuid.uuid4().hex}",
            "filename": filename,
            "file_name": filename,
            "metrics": {"defects_found": len(detections), "severity": highest, "processing_time_ms": processing_ms},
            "bounding_boxes": detections,
            "annotated_image_base64": base64.b64encode(rendered.tobytes()).decode("ascii"),
            "annotated_image_bytes": rendered.tobytes(),
        }


def severity_rank(severity: str) -> int:
    return {"None": 0, "Low": 1, "Medium": 2, "High": 3, "P1 Critical": 4}.get(severity, 0)


def severity_for(label: str, area_ratio: float) -> str:
    base = SEVERITY_BY_CLASS.get(label.lower(), "Medium")
    if area_ratio >= 0.10:
        return "P1 Critical"
    if area_ratio >= 0.04 and severity_rank(base) < severity_rank("High"):
        return "High"
    return base


def severity_color(severity: str) -> tuple[int, int, int]:
    return {"Low": (0, 200, 0), "Medium": (0, 180, 255), "High": (0, 80, 255), "P1 Critical": (0, 0, 220)}.get(severity, (180, 180, 180))


class VideoInspectionRequest(BaseModel):
    video_paths: list[str] = Field(min_length=1, max_length=MAX_VIDEO_FILES)
    model: Literal["pothole", "bridge"] = "pothole"
    confidence: float | None = Field(default=None, ge=0.05, le=0.95)
    sample_fps: float = Field(default=DEFAULT_VIDEO_SAMPLE_FPS, ge=0.25, le=12)


class VideoJobs:
    """Background finite-video processing that never blocks HTTP requests."""
    def __init__(self, models: VisionModels) -> None:
        self.models = models
        self.jobs: dict[str, dict[str, Any]] = {}
        self.lock = threading.RLock()

    def start(self, request: VideoInspectionRequest) -> dict[str, Any]:
        paths = [self._safe_video_path(raw) for raw in request.video_paths]
        confidence = request.confidence
        if confidence is None:
            confidence = BRIDGE_VIDEO_CONFIDENCE if request.model == "bridge" else POTHOLE_VIDEO_CONFIDENCE
        job_id = f"vid-{uuid.uuid4().hex}"
        job = {
            "id": job_id, "status": "queued", "model": request.model,
            "video_names": [path.name for path in paths], "sample_fps": request.sample_fps,
            "confidence": confidence, "total_frames": 0, "sampled_frames": 0,
            "processed_frames": 0, "detections_found": 0, "progress": 0,
            "results": [], "error": None, "created_at": time.time(), "completed_at": None,
        }
        with self.lock:
            self.jobs[job_id] = job
        asyncio.create_task(asyncio.to_thread(self._run, job_id, paths, request.model, confidence, request.sample_fps), name=job_id)
        return self.public(job)

    def get(self, job_id: str) -> dict[str, Any]:
        with self.lock:
            job = self.jobs.get(job_id)
            if job is None:
                raise KeyError(job_id)
            return self.public(job)

    @staticmethod
    def _safe_video_path(value: str) -> Path:
        path = Path(value).resolve()
        if not path.is_file() or VIDEO_UPLOAD_ROOT not in path.parents:
            raise ValueError("Video path is not an uploaded file")
        return path

    @staticmethod
    def _iou(first: dict[str, Any], second: dict[str, Any]) -> float:
        ax1, ay1 = first["x"], first["y"]
        ax2, ay2 = ax1 + first["width"], ay1 + first["height"]
        bx1, by1 = second["x"], second["y"]
        bx2, by2 = bx1 + second["width"], by1 + second["height"]
        intersection = max(0, min(ax2, bx2) - max(ax1, bx1)) * max(0, min(ay2, by2) - max(ay1, by1))
        union = first["width"] * first["height"] + second["width"] * second["height"] - intersection
        return intersection / union if union else 0.0

    def _run(self, job_id: str, paths: list[Path], model_key: str, confidence: float, sample_fps: float) -> None:
        output_dir = VIDEO_RESULTS_ROOT / job_id
        output_dir.mkdir(parents=True, exist_ok=True)
        try:
            metadata: list[tuple[Path, int, float, int]] = []
            for path in paths:
                capture = cv2.VideoCapture(str(path))
                frames = int(capture.get(cv2.CAP_PROP_FRAME_COUNT))
                fps = capture.get(cv2.CAP_PROP_FPS) or 30.0
                capture.release()
                every_n = max(1, round(fps / sample_fps))
                metadata.append((path, frames, fps, every_n))
            with self.lock:
                job = self.jobs[job_id]
                job["status"] = "running"
                job["total_frames"] = sum(frames for _, frames, _, _ in metadata)
                job["sampled_frames"] = sum((frames + every_n - 1) // every_n for _, frames, _, every_n in metadata)

            recent: list[tuple[dict[str, Any], float]] = []
            scanned = 0
            for video_index, (path, frame_total, fps, every_n) in enumerate(metadata):
                capture = cv2.VideoCapture(str(path))
                frame_index = 0
                try:
                    while True:
                        ok, frame = capture.read()
                        if not ok or frame is None:
                            break
                        scanned += 1
                        if frame_index % every_n == 0:
                            result = self.models.infer_frame(frame, path.name, model_key, confidence)
                            boxes = result["bounding_boxes"]
                            timestamp = frame_index / fps
                            # Prevent near-identical consecutive frame results from flooding the review UI.
                            new_boxes = []
                            for box in boxes:
                                duplicate = any(box["label"] == prior["label"] and self._iou(box, prior) >= 0.55 and timestamp - seen_at < 3.0 for prior, seen_at in recent)
                                if not duplicate:
                                    new_boxes.append(box)
                                    recent.append((box, timestamp))
                            recent = [(box, seen_at) for box, seen_at in recent if timestamp - seen_at < 3.0]
                            if new_boxes:
                                relative = Path("video-results") / job_id / f"{video_index:02d}-{frame_index:07d}.jpg"
                                # The model already rendered JPEG bytes, so persist them directly.
                                (VIDEO_RESULTS_ROOT.parent / relative).write_bytes(result["annotated_image_bytes"])
                                result.pop("annotated_image_base64", None)
                                result.pop("annotated_image_bytes", None)
                                result["id"] = f"frame-{job_id}-{video_index}-{frame_index}"
                                result["filename"] = path.name
                                result["frame_index"] = frame_index
                                result["timestamp_seconds"] = round(timestamp, 3)
                                result["image_url"] = f"/media/{relative.as_posix()}"
                                result["bounding_boxes"] = new_boxes
                                result["metrics"]["defects_found"] = len(new_boxes)
                                result["metrics"]["severity"] = max((box["severity"] for box in new_boxes), key=severity_rank)
                                with self.lock:
                                    job["results"].append(result)
                                    job["detections_found"] += len(new_boxes)
                        with self.lock:
                            job["processed_frames"] += 1 if frame_index % every_n == 0 else 0
                            job["progress"] = round(scanned / max(1, job["total_frames"]) * 100, 1)
                        frame_index += 1
                finally:
                    capture.release()
            with self.lock:
                job["status"] = "completed"
                job["progress"] = 100
                job["completed_at"] = time.time()
        except Exception as exc:
            with self.lock:
                job = self.jobs[job_id]
                job["status"] = "failed"
                job["error"] = str(exc)
                job["completed_at"] = time.time()

    @staticmethod
    def public(job: dict[str, Any]) -> dict[str, Any]:
        return {key: value for key, value in job.items() if key != "created_at"}


class LiveDetectionRequest(BaseModel):
    """A continuous source, such as an RTSP camera, webcam index, or media URL."""

    source: str = Field(min_length=1, max_length=2048)
    model: Literal["pothole", "bridge", "both"] = "both"
    pothole_confidence: float | None = Field(default=None, ge=0.05, le=0.95)
    bridge_confidence: float | None = Field(default=None, ge=0.05, le=0.95)
    inference_fps: float = Field(default=DEFAULT_LIVE_INFERENCE_FPS, ge=0.25, le=10)


def utc_now() -> str:
    return datetime.now(UTC).isoformat()


def normalize_live_source(value: str) -> str:
    """Accept a Windows path pasted with optional PowerShell/File Explorer quotes."""
    return value.strip().strip('"').strip("'").strip()


class DetectionEventStore:
    """Durable append-only-style JSON log for live pothole and bridge events."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self.lock = threading.RLock()
        self.events: list[dict[str, Any]] = []
        self._load()

    def _load(self) -> None:
        with self.lock:
            try:
                payload = json.loads(self.path.read_text(encoding="utf-8"))
                self.events = payload.get("events", []) if isinstance(payload, dict) else []
            except (FileNotFoundError, json.JSONDecodeError, OSError):
                self.events = []
            self._write_locked()

    def _write_locked(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = {"schema_version": 1, "updated_at": utc_now(), "events": self.events[-5000:]}
        temporary = self.path.with_suffix(".tmp")
        temporary.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        temporary.replace(self.path)

    def append(self, event: dict[str, Any]) -> None:
        with self.lock:
            self.events.append(event)
            self.events = self.events[-5000:]
            self._write_locked()

    def list(self, limit: int, stream_id: str | None = None) -> list[dict[str, Any]]:
        with self.lock:
            events = self.events if stream_id is None else [event for event in self.events if event["stream_id"] == stream_id]
            return list(reversed(events[-limit:]))


class LiveStream:
    """Two-worker live source: capture never waits for CPU/GPU inference."""

    def __init__(self, stream_id: str, request: LiveDetectionRequest, models: VisionModels, event_store: DetectionEventStore) -> None:
        self.id = stream_id
        self.source = request.source.strip()
        self.model = request.model
        self.models = models
        self.event_store = event_store
        self.inference_fps = request.inference_fps
        self.confidence = {
            "pothole": request.pothole_confidence if request.pothole_confidence is not None else POTHOLE_VIDEO_CONFIDENCE,
            "bridge": request.bridge_confidence if request.bridge_confidence is not None else BRIDGE_VIDEO_CONFIDENCE,
        }
        self.frames: deque[tuple[int, np.ndarray]] = deque(maxlen=2)
        self.lock = threading.RLock()
        self.stop_requested = threading.Event()
        self.capture_finished = threading.Event()
        self.capture_thread: threading.Thread | None = None
        self.inference_thread: threading.Thread | None = None
        self.recent_boxes: list[tuple[dict[str, Any], float]] = []
        self.preview_path = LIVE_OUTPUT_ROOT / f"{self.id}.jpg"
        self.state: dict[str, Any] = {
            "id": self.id,
            "source": self.source,
            "model": self.model,
            "status": "queued",
            "inference_fps": self.inference_fps,
            "confidence": self.confidence,
            "frames_read": 0,
            "frames_inferred": 0,
            "detections_emitted": 0,
            "last_error": None,
            "started_at": utc_now(),
            "ended_at": None,
            "preview_url": f"/media/live/{self.id}.jpg",
            "preview_updated_at": None,
        }

    def start(self) -> None:
        with self.lock:
            self.state["status"] = "running"
        self.capture_thread = threading.Thread(target=self._capture, name=f"capture-{self.id}", daemon=True)
        self.inference_thread = threading.Thread(target=self._infer, name=f"infer-{self.id}", daemon=True)
        self.capture_thread.start()
        self.inference_thread.start()

    def stop(self) -> None:
        self.stop_requested.set()
        self.capture_finished.set()
        with self.lock:
            if self.state["status"] in {"queued", "running"}:
                self.state["status"] = "stopped"
                self.state["ended_at"] = utc_now()

    def public(self) -> dict[str, Any]:
        with self.lock:
            return dict(self.state)

    def _capture_source(self) -> str | int:
        return int(self.source) if self.source.isdigit() else self.source

    def _is_finite_file(self) -> bool:
        try:
            return Path(self.source).is_file()
        except OSError:
            return False

    def _capture(self) -> None:
        backoff = 1.0
        frame_number = 0
        finite_file = self._is_finite_file()
        try:
            while not self.stop_requested.is_set():
                capture = cv2.VideoCapture(self._capture_source())
                capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                if not capture.isOpened():
                    if finite_file:
                        with self.lock:
                            self.state["last_error"] = "OpenCV could not decode this local video. Use an MP4 with H.264/AVC video."
                            self.state["status"] = "failed"
                            self.state["ended_at"] = utc_now()
                        capture.release()
                        return
                    with self.lock:
                        self.state["last_error"] = "Could not open stream; reconnecting"
                    capture.release()
                    self.stop_requested.wait(backoff)
                    backoff = min(backoff * 2, 20.0)
                    continue
                backoff = 1.0
                source_fps = capture.get(cv2.CAP_PROP_FPS) or 30.0
                next_capture_at = time.monotonic()
                while not self.stop_requested.is_set():
                    ok, frame = capture.read()
                    if not ok or frame is None:
                        if finite_file:
                            capture.release()
                            return
                        with self.lock:
                            self.state["last_error"] = "Stream read failed; reconnecting"
                        break
                    frame_number += 1
                    # maxlen=2 deliberately drops stale frames when inference lags.
                    with self.lock:
                        self.frames.append((frame_number, frame))
                        self.state["frames_read"] = frame_number
                        self.state["last_error"] = None
                    # A local MP4 is useful as a camera simulator. Pace it at its
                    # recorded frame rate instead of consuming it at disk speed.
                    if finite_file:
                        next_capture_at += 1 / source_fps
                        self.stop_requested.wait(max(0.0, next_capture_at - time.monotonic()))
                capture.release()
                if not finite_file and not self.stop_requested.is_set():
                    self.stop_requested.wait(backoff)
                    backoff = min(backoff * 2, 20.0)
        except Exception as exc:
            with self.lock:
                self.state["last_error"] = f"Capture error: {exc}"
                self.state["status"] = "failed"
                self.state["ended_at"] = utc_now()
        finally:
            self.capture_finished.set()

    @staticmethod
    def _iou(first: dict[str, Any], second: dict[str, Any]) -> float:
        return VideoJobs._iou(first, second)

    def _new_boxes(self, boxes: list[dict[str, Any]], observed_at: float) -> list[dict[str, Any]]:
        new_boxes: list[dict[str, Any]] = []
        for box in boxes:
            duplicate = any(
                box["label"] == prior["label"] and self._iou(box, prior) >= 0.55 and observed_at - seen_at < LIVE_DEDUP_SECONDS
                for prior, seen_at in self.recent_boxes
            )
            if not duplicate:
                new_boxes.append(box)
                self.recent_boxes.append((box, observed_at))
        self.recent_boxes = [
            (box, seen_at) for box, seen_at in self.recent_boxes if observed_at - seen_at < LIVE_DEDUP_SECONDS
        ]
        return new_boxes

    def _write_preview(self, rendered: bytes) -> None:
        self.preview_path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self.preview_path.with_suffix(".jpg.tmp")
        temporary.write_bytes(rendered)
        temporary.replace(self.preview_path)

    def _infer(self) -> None:
        last_frame_number = -1
        inference_interval = 1 / self.inference_fps
        last_inference_at = 0.0
        try:
            while not self.stop_requested.is_set():
                with self.lock:
                    latest = self.frames[-1] if self.frames else None
                if latest is None or latest[0] == last_frame_number:
                    if self.capture_finished.is_set():
                        break
                    self.stop_requested.wait(0.03)
                    continue
                remaining = inference_interval - (time.monotonic() - last_inference_at)
                if remaining > 0:
                    self.stop_requested.wait(min(remaining, 0.1))
                    continue
                frame_number, frame = latest
                result = self.models.infer_frame(frame, self.source, self.model, self.confidence)
                last_frame_number = frame_number
                last_inference_at = time.monotonic()
                self._write_preview(result["annotated_image_bytes"])
                observed_at = time.monotonic()
                new_boxes = self._new_boxes(result["bounding_boxes"], observed_at)
                with self.lock:
                    self.state["frames_inferred"] += 1
                    self.state["preview_updated_at"] = int(time.time() * 1000)
                if new_boxes:
                    event = {
                        "id": f"evt-{uuid.uuid4().hex}",
                        "detected_at": utc_now(),
                        "stream_id": self.id,
                        "source": self.source,
                        "model": self.model,
                        "frame_number": frame_number,
                        "severity": max((box["severity"] for box in new_boxes), key=severity_rank),
                        "detections": new_boxes,
                        "preview_url": self.state["preview_url"],
                    }
                    self.event_store.append(event)
                    with self.lock:
                        self.state["detections_emitted"] += len(new_boxes)
        except Exception as exc:
            with self.lock:
                self.state["last_error"] = f"Inference error: {exc}"
                self.state["status"] = "failed"
                self.state["ended_at"] = utc_now()
        finally:
            with self.lock:
                if self.state["status"] == "running":
                    self.state["status"] = "stopped" if self.stop_requested.is_set() else "completed"
                    self.state["ended_at"] = utc_now()


class LiveStreams:
    def __init__(self, models: VisionModels, event_store: DetectionEventStore) -> None:
        self.models = models
        self.event_store = event_store
        self.streams: dict[str, LiveStream] = {}
        self.lock = threading.RLock()

    def start(self, request: LiveDetectionRequest) -> dict[str, Any]:
        source = normalize_live_source(request.source)
        if not source:
            raise ValueError("Provide a stream source")
        # Webcam indexes and network streams are opened by OpenCV at runtime.
        # For a local file, fail immediately with an actionable error instead of
        # leaving a background worker stuck in a reconnect loop.
        if not source.isdigit() and "://" not in source:
            local_path = Path(source).expanduser()
            if not local_path.is_file():
                raise ValueError(f"Local video file was not found: {local_path}. Remove surrounding quotes and verify the .mp4 path.")
            source = str(local_path)
        request.source = source
        with self.lock:
            running = sum(stream.public()["status"] in {"queued", "running"} for stream in self.streams.values())
            if running >= MAX_LIVE_STREAMS:
                raise ValueError(f"Only {MAX_LIVE_STREAMS} live streams may run at once")
            stream = LiveStream(f"live-{uuid.uuid4().hex[:12]}", request, self.models, self.event_store)
            self.streams[stream.id] = stream
            stream.start()
            return stream.public()

    def get(self, stream_id: str) -> dict[str, Any]:
        with self.lock:
            stream = self.streams.get(stream_id)
            if stream is None:
                raise KeyError(stream_id)
            return stream.public()

    def list(self) -> list[dict[str, Any]]:
        with self.lock:
            return [stream.public() for stream in self.streams.values()]

    def stop(self, stream_id: str) -> dict[str, Any]:
        with self.lock:
            stream = self.streams.get(stream_id)
            if stream is None:
                raise KeyError(stream_id)
            stream.stop()
            return stream.public()

    def stop_all(self) -> None:
        with self.lock:
            for stream in self.streams.values():
                stream.stop()


vision = VisionModels()
video_jobs = VideoJobs(vision)
detection_events = DetectionEventStore(DETECTION_LOG_PATH)
live_streams = LiveStreams(vision, detection_events)


@asynccontextmanager
async def lifespan(_: FastAPI):
    await asyncio.to_thread(vision.load)
    try:
        yield
    finally:
        live_streams.stop_all()


app = FastAPI(title="Infrastructure Vision API", version="2.0.0", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, Any]:
    # Retain the original top-level bridge-health fields for existing consumers.
    return {"status": "ok" if vision.bridge_model else "degraded", "model_loaded": vision.bridge_model is not None,
            "model_path": str(MODEL_PATH), "error": vision.bridge_error,
            "classes": ["bridge_crack", "efflorescence", "exposed_rebar", "rust", "scaling", "spalling", "surface_defect"], "device": DEVICE,
            "models": {"bridge": {"loaded": vision.bridge_model is not None, "path": str(MODEL_PATH), "error": vision.bridge_error,
                                   "classes": ["bridge_crack", "efflorescence", "exposed_rebar", "rust", "scaling", "spalling", "surface_defect"]},
                       "pothole": {"loaded": vision.pothole_model is not None, "source": vision.pothole_source, "error": vision.pothole_error}}}


@app.post("/api/inspect-batch")
async def inspect_batch(files: list[UploadFile] = File(...), confidence: float = Form(default=DEFAULT_CONFIDENCE, ge=0.05, le=0.95)) -> dict[str, Any]:
    if vision.bridge_model is None:
        raise HTTPException(status_code=503, detail=vision.bridge_error or "Bridge CV model is unavailable")
    if not files or len(files) > MAX_BATCH_SIZE:
        raise HTTPException(status_code=400, detail=f"Upload between 1 and {MAX_BATCH_SIZE} images")
    results = []
    for file in files:
        content = await file.read()
        if len(content) > MAX_IMAGE_BYTES:
            raise HTTPException(status_code=413, detail=f"{file.filename} exceeds 50 MB")
        try:
            results.append(await asyncio.to_thread(vision.infer, content, file.filename or "image.jpg", confidence))
        except ValueError as exc:
            raise HTTPException(status_code=415, detail=f"{file.filename}: {exc}") from exc
        finally:
            await file.close()
    return {"model": "bridge-defect-yolo26m", "results": results}


@app.post("/api/inspect-videos", status_code=202)
async def inspect_videos(request: VideoInspectionRequest) -> dict[str, Any]:
    try:
        return {"job": video_jobs.start(request)}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/video-jobs/{job_id}")
async def video_job(job_id: str) -> dict[str, Any]:
    try:
        return {"job": video_jobs.get(job_id)}
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Video job not found") from exc


@app.post("/api/live-streams", status_code=202)
async def start_live_stream(request: LiveDetectionRequest) -> dict[str, Any]:
    """Start capture and inference workers without holding the HTTP request open."""
    if request.model in {"bridge", "both"} and vision.bridge_model is None:
        raise HTTPException(status_code=503, detail=vision.bridge_error or "Bridge CV model is unavailable")
    try:
        return {"stream": live_streams.start(request)}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/live-streams")
async def list_live_streams() -> dict[str, Any]:
    return {"streams": live_streams.list()}


@app.get("/api/live-streams/{stream_id}")
async def live_stream(stream_id: str) -> dict[str, Any]:
    try:
        return {"stream": live_streams.get(stream_id)}
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Live stream not found") from exc


@app.delete("/api/live-streams/{stream_id}")
async def stop_live_stream(stream_id: str) -> dict[str, Any]:
    try:
        return {"stream": live_streams.stop(stream_id)}
    except KeyError as exc:
        raise HTTPException(status_code=404, detail="Live stream not found") from exc


@app.get("/api/detections")
async def stored_detections(limit: int = 100, stream_id: str | None = None) -> dict[str, Any]:
    return {"events": detection_events.list(max(1, min(limit, 1000)), stream_id)}
