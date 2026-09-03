# Bridge Defect Vision Service

This service runs the validated `bridge-defect-yolo26m.pt` model behind the
existing Express dashboard. It detects `bridge_crack`, `efflorescence`,
`exposed_rebar`, `rust`, `scaling`, `spalling`, and `surface_defect` in each
uploaded image. The model is loaded once at startup and inference is serialized
inside the process so one model instance is not concurrently accessed by several
requests.

## Start

From the repository root, open two terminals:

```powershell
npm run cv:start
```

```powershell
npm run dev
```

The Python service is available only locally at `http://127.0.0.1:8001`.
The Node service proxies browser uploads at `POST /api/inspect-batch` to it,
preserving the React frontend's existing request and response shape.

Video inspection uses separate, non-blocking endpoints. The React video
ingestion page selects either the Hugging Face `DanielsStulpe/pothole-detection`
model or the local trained bridge model. It uploads videos to Express, extracts
frames at 4 FPS in the Python worker, applies temporal de-duplication, and
returns only annotated evidence frames. Existing image inspection endpoints and
interfaces remain unchanged.

## Live pothole and bridge detection

The **Live detection source** field on the Inspections page starts an isolated
capture worker plus an inference worker. Use an RTSP URL, `0` for the default
webcam, or a local MP4 path. The capture worker holds only the newest two
frames, so a slow CPU/GPU model never delays a live feed. Select **Potholes +
bridge cracks** to run both models on the same latest frame.

Windows paths copied with single or double quotes are accepted. A missing local
file is rejected before workers start, rather than showing an endless reconnect
message.

Every new, spatially de-duplicated detection is saved to
`runtime/detections.json`; it contains the source, timestamp, model,
severity, bounding boxes and preview image URL. The live APIs are also exposed
through Express:

```text
POST   /api/live-streams
GET    /api/live-streams
GET    /api/live-streams/:streamId
DELETE /api/live-streams/:streamId
GET    /api/detections?limit=100&stream_id=optional-stream-id
```

For a direct API test, use raw PowerShell (do not include Markdown brackets):

```powershell
$body = @{ source = '0'; model = 'both'; inference_fps = 3 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/api/live-streams' -ContentType 'application/json' -Body $body
```

OpenCV can consume RTSP, webcams and local media files directly. A normal
YouTube page/Shorts URL is not a video stream URL, so supply an authorized
RTSP/HLS stream or a downloaded local file instead.

Verify model readiness:

```powershell
Invoke-RestMethod http://localhost:3000/api/cv/health
```

Expected key fields are `model_loaded: true` and the seven bridge classes.

## Configuration

`BRIDGE_CV_API_URL` changes the sidecar URL for the Express process.
`BRIDGE_MODEL_PATH`, `BRIDGE_MODEL_DEVICE` (`cpu` by default), and
`BRIDGE_MODEL_CONFIDENCE` configure the Python process. Keep the default
confidence at `0.45` until it has been calibrated with representative bridge
imagery.

`POTHOLE_VIDEO_CONFIDENCE` defaults to `0.65`; `BRIDGE_VIDEO_CONFIDENCE`
defaults to `0.10` because the trained bridge model's validated crack examples
score lower. Adjust those values only after reviewing representative footage.

To deploy an approved RDD2022-trained pothole model, copy it to
`backend/API/models/pothole-rdd-v1.pt` and restart this service. The local
model is used in preference to the Hugging Face fallback. The reproducible
dataset conversion, GPU-training and threshold-calibration workflow is in
`training/pothole_rdd/README.md`.

`LIVE_INFERENCE_FPS` (default `3`), `LIVE_DEDUP_SECONDS` (default `3`),
`LIVE_OUTPUT_ROOT`, and `DETECTION_LOG_PATH` configure live operation and the
durable JSON event log. Bridge confidence is intentionally low during this
prototype; human review is required before dispatching a real repair order.
