#!/usr/bin/env sh
set -eu

export CV_RUNTIME_DIR="${CV_RUNTIME_DIR:-/tmp/aeropatch-runtime}"
export VIDEO_UPLOAD_ROOT="${VIDEO_UPLOAD_ROOT:-$CV_RUNTIME_DIR/video-uploads}"
export VIDEO_RESULTS_ROOT="${VIDEO_RESULTS_ROOT:-$CV_RUNTIME_DIR/video-results}"
export LIVE_OUTPUT_ROOT="${LIVE_OUTPUT_ROOT:-$CV_RUNTIME_DIR/live}"
export DETECTION_LOG_PATH="${DETECTION_LOG_PATH:-$CV_RUNTIME_DIR/detections.json}"
export AUTO_START_VISION=false
mkdir -p "$VIDEO_UPLOAD_ROOT" "$VIDEO_RESULTS_ROOT" "$LIVE_OUTPUT_ROOT"

python3 -m uvicorn main:app --app-dir backend/API --host 127.0.0.1 --port 8001 &
VISION_PID=$!
trap 'kill "$VISION_PID" 2>/dev/null || true' EXIT INT TERM

node dist/server.cjs
