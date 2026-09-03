import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const bridgeCvUrl = (process.env.BRIDGE_CV_API_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');
const runtimeDirectory = path.join(__dirname, 'runtime');
const videoUploadDirectory = path.join(runtimeDirectory, 'video-uploads');
mkdirSync(videoUploadDirectory, { recursive: true });
const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, videoUploadDirectory),
    filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 2 * 1024 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, callback) => {
    const allowed = new Set(['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v']);
    callback(null, allowed.has(path.extname(file.originalname).toLowerCase()));
  },
});
const videoMissionIds = new Map<string, string>();

const severityRank: Record<string, number> = {
  None: 0,
  Low: 1,
  Medium: 2,
  High: 3,
  'P1 Critical': 4,
};

function highestSeverity(results: any[]) {
  return results.reduce((highest, result) => {
    const candidate = result?.metrics?.severity || 'None';
    return (severityRank[candidate] || 0) > (severityRank[highest] || 0) ? candidate : highest;
  }, 'None');
}

/** Send browser uploads to the resident Python YOLO process without writing them
 * to the Node server's filesystem. */
async function inspectWithBridgeModel(files: Express.Multer.File[], sensitivity?: string) {
  const body = new FormData();
  for (const file of files) {
    // Copy into a plain Uint8Array to satisfy the web Blob API's ArrayBuffer
    // contract across Node's Buffer/SharedArrayBuffer type variations.
    body.append('files', new Blob([Uint8Array.from(file.buffer)], { type: file.mimetype || 'image/jpeg' }), file.originalname);
  }
  const parsedSensitivity = Number(sensitivity);
  const confidence = Number.isFinite(parsedSensitivity)
    ? Math.max(0.05, Math.min(0.95, parsedSensitivity))
    : 0.45;
  body.append('confidence', String(confidence));

  let response: Response;
  try {
    response = await fetch(`${bridgeCvUrl}/api/inspect-batch`, { method: 'POST', body });
  } catch {
    throw new Error(`Bridge CV service is offline. Start it with: npm run cv:start`);
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.detail || `Bridge CV service failed (${response.status})`);
  }
  return payload.results || [];
}

async function startVideoJob(files: Express.Multer.File[], model: string, confidence?: string) {
  const numericConfidence = Number(confidence);
  const payload = {
    video_paths: files.map((file) => file.path),
    model: model === 'bridge' ? 'bridge' : 'pothole',
    // Let Python select calibrated defaults when the frontend has not supplied one:
    // 0.65 for the Hugging Face pothole model, 0.10 for the bridge model.
    ...(Number.isFinite(numericConfidence) ? { confidence: Math.max(0.05, Math.min(0.95, numericConfidence)) } : {}),
    sample_fps: 4,
  };
  let response: Response;
  try {
    response = await fetch(`${bridgeCvUrl}/api/inspect-videos`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Vision service is offline. Start it with: npm run cv:start');
  }
  const responsePayload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(responsePayload?.detail || `Video job failed to start (${response.status})`);
  return responsePayload.job;
}

async function readVideoJob(jobId: string) {
  const response = await fetch(`${bridgeCvUrl}/api/video-jobs/${encodeURIComponent(jobId)}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.detail || `Video job lookup failed (${response.status})`);
  return payload.job;
}

async function visionJson(pathname: string, options?: RequestInit) {
  let response: Response;
  try {
    response = await fetch(`${bridgeCvUrl}${pathname}`, options);
  } catch {
    throw new Error('Vision service is offline. Start it with: npm run cv:start');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.detail || `Vision service failed (${response.status})`);
  return payload;
}

const dashboardOverview = {
  kpis: {
    total_assets: 18,
    total_inspections: 126,
    critical_defects: 5,
    health_score: 82,
    escalation_critical_issues: 2,
    escalation_open_tickets: 7,
    escalation_pending_authority_response: 3,
  },
  recent_activity: [
    {
      id: 'act-1',
      type: 'inspection',
      title: 'Aerial inspection completed for North Ring Road',
      asset: 'North Ring Road',
      user: 'Drone Ops',
      time: '2 hours ago',
      severity: 'high',
    },
    {
      id: 'act-2',
      type: 'work_order',
      title: 'P1 crack repair work order dispatched',
      asset: 'Harbor Avenue',
      user: 'Maintenance',
      time: '5 hours ago',
      severity: 'medium',
    },
    {
      id: 'act-3',
      type: 'review',
      title: 'AI review confirmed 3 potholes in Valley Loop',
      asset: 'Valley Loop',
      user: 'AI QA',
      time: 'Yesterday',
      severity: 'low',
    },
  ],
  assets: [
    {
      id: 'asset-1',
      name: 'North Ring Road',
      code: 'NRR-01',
      health_score: 78,
      total_defects: 4,
      latitude: 37.7749,
      longitude: -122.4194,
    },
    {
      id: 'asset-2',
      name: 'Harbor Avenue',
      code: 'HBR-02',
      health_score: 64,
      total_defects: 8,
      latitude: 37.7849,
      longitude: -122.4094,
    },
    {
      id: 'asset-3',
      name: 'Valley Loop',
      code: 'VLY-07',
      health_score: 88,
      total_defects: 2,
      latitude: 37.7649,
      longitude: -122.4294,
    },
  ],
};

const missions = [
  {
    id: 'MIS-2401',
    asset_id: 'asset-1',
    asset_name: 'North Ring Road',
    drone_model: 'DJI Mavic 3T',
    pilot_name: 'A. Carter',
    flight_altitude_m: 80,
    date: '2026-09-01',
    total_images: 48,
    defects_found: 6,
    severity: 'High',
    status: 'Reviewed',
    images: [],
  },
  {
    id: 'MIS-2398',
    asset_id: 'asset-2',
    asset_name: 'Harbor Avenue',
    drone_model: 'Autel Evo II',
    pilot_name: 'L. Singh',
    flight_altitude_m: 72,
    date: '2026-08-28',
    total_images: 32,
    defects_found: 4,
    severity: 'Medium',
    status: 'Completed',
    images: [],
  },
];

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/cv/health', async (_req, res) => {
  try {
    const response = await fetch(`${bridgeCvUrl}/health`);
    const payload = await response.json();
    res.status(response.ok ? 200 : 503).json(payload);
  } catch {
    res.status(503).json({ status: 'offline', detail: 'Bridge CV service is not running. Use npm run cv:start.' });
  }
});

app.get('/api/dashboard/overview', (_req, res) => {
  res.json(dashboardOverview);
});

app.get('/api/assets', (_req, res) => {
  res.json({ assets: dashboardOverview.assets });
});

app.get('/api/missions', (_req, res) => {
  res.json({ missions });
});

app.post('/api/inspect-videos', videoUpload.array('videos', 5), async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  if (!files.length) return res.status(400).json({ error: 'Upload between 1 and 5 video files.' });
  const assetId = (req.body.asset_id || req.body.assetId || '').toString();
  const asset = dashboardOverview.assets.find((item) => item.id === assetId) || dashboardOverview.assets[0];
  try {
    const job = await startVideoJob(files, (req.body.model || 'pothole').toString(), req.body.confidence);
    const mission = {
      id: `MIS-${Date.now()}`,
      asset_id: asset.id, asset_name: asset.name,
      drone_model: req.body.drone_model || 'Video Inspection',
      pilot_name: req.body.pilot_name || 'System Agent',
      flight_altitude_m: 0, date: new Date().toISOString().slice(0, 10),
      total_images: 0, defects_found: 0, severity: 'None', status: 'Processing', images: [],
      model: job.model, video_names: job.video_names, video_job_id: job.id,
    };
    missions.push(mission);
    videoMissionIds.set(job.id, mission.id);
    return res.status(202).json({ mission, job, asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not start video inspection.';
    return res.status(503).json({ error: message });
  }
});

app.get('/api/video-jobs/:jobId', async (req, res) => {
  try {
    const job = await readVideoJob(req.params.jobId);
    const missionId = videoMissionIds.get(job.id);
    const mission = missions.find((item) => item.id === missionId);
    if (mission) {
      mission.status = job.status === 'completed' ? 'Completed' : job.status === 'failed' ? 'Failed' : 'Processing';
      mission.total_images = job.processed_frames || 0;
      mission.defects_found = job.detections_found || 0;
      mission.severity = highestSeverity(job.results || []);
      mission.images = job.results || [];
    }
    return res.json({ job, mission, results: job.results || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not read video inspection status.';
    return res.status(503).json({ error: message });
  }
});

// The Python sidecar owns the long-running capture/inference workers. Express
// only proxies their state, keeping the rest of this dashboard API unchanged.
app.post('/api/live-streams', async (req, res) => {
  const source = typeof req.body?.source === 'string' ? req.body.source.trim() : '';
  if (!source) return res.status(400).json({ error: 'Provide a stream source (RTSP URL, webcam index, or local file path).' });
  const model = ['pothole', 'bridge', 'both'].includes(req.body?.model) ? req.body.model : 'both';
  const payload = {
    source,
    model,
    ...(Number.isFinite(Number(req.body?.pothole_confidence)) ? { pothole_confidence: Number(req.body.pothole_confidence) } : {}),
    ...(Number.isFinite(Number(req.body?.bridge_confidence)) ? { bridge_confidence: Number(req.body.bridge_confidence) } : {}),
    ...(Number.isFinite(Number(req.body?.inference_fps)) ? { inference_fps: Number(req.body.inference_fps) } : {}),
  };
  try {
    const result = await visionJson('/api/live-streams', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    return res.status(202).json(result);
  } catch (error) {
    return res.status(503).json({ error: error instanceof Error ? error.message : 'Could not start live detection.' });
  }
});

app.get('/api/live-streams', async (_req, res) => {
  try {
    return res.json(await visionJson('/api/live-streams'));
  } catch (error) {
    return res.status(503).json({ error: error instanceof Error ? error.message : 'Could not read live streams.' });
  }
});

app.get('/api/live-streams/:streamId', async (req, res) => {
  try {
    return res.json(await visionJson(`/api/live-streams/${encodeURIComponent(req.params.streamId)}`));
  } catch (error) {
    return res.status(503).json({ error: error instanceof Error ? error.message : 'Could not read live stream.' });
  }
});

app.delete('/api/live-streams/:streamId', async (req, res) => {
  try {
    return res.json(await visionJson(`/api/live-streams/${encodeURIComponent(req.params.streamId)}`, { method: 'DELETE' }));
  } catch (error) {
    return res.status(503).json({ error: error instanceof Error ? error.message : 'Could not stop live stream.' });
  }
});

app.get('/api/detections', async (req, res) => {
  const params = new URLSearchParams();
  if (typeof req.query.limit === 'string') params.set('limit', req.query.limit);
  if (typeof req.query.stream_id === 'string') params.set('stream_id', req.query.stream_id);
  const query = params.size ? `?${params.toString()}` : '';
  try {
    return res.json(await visionJson(`/api/detections${query}`));
  } catch (error) {
    return res.status(503).json({ error: error instanceof Error ? error.message : 'Could not read stored detections.' });
  }
});

app.post('/api/inspect-sample', (req, res) => {
  const { asset_id, assetId, filenames = [] } = req.body || {};
  const asset = dashboardOverview.assets.find((item) => item.id === (asset_id || assetId)) || dashboardOverview.assets[0];
  const mission = {
    id: `MIS-${Date.now()}`,
    asset_id: asset?.id || 'asset-1',
    asset_name: asset?.name || 'North Ring Road',
    drone_model: 'DJI Mavic 3T',
    pilot_name: 'System Agent',
    flight_altitude_m: 80,
    date: new Date().toISOString().slice(0, 10),
    total_images: Array.isArray(filenames) ? filenames.length : 0,
    defects_found: 3,
    severity: 'High',
    status: 'Completed',
    images: [],
  };

  res.json({
    mission,
    results: [],
    asset,
  });
});

app.post('/api/inspect-batch', upload.array('files', 20), async (req, res) => {
  const assetId = (req.body.asset_id || req.body.assetId || '').toString();
  const asset = dashboardOverview.assets.find((item) => item.id === assetId) || dashboardOverview.assets[0];
  const files = Array.isArray(req.files) ? req.files : [];
  if (!files.length) {
    return res.status(400).json({ error: 'Upload at least one bridge inspection image.' });
  }
  try {
    const modelResults = await inspectWithBridgeModel(files, req.body.sensitivity);
    const results = modelResults.map((result: any) => ({
      ...result,
      image_url: result.annotated_image_base64
        ? `data:image/jpeg;base64,${result.annotated_image_base64}`
        : undefined,
      annotated_image_base64: undefined,
    }));
    const totalDefects = results.reduce((sum: number, result: any) => sum + (result.metrics?.defects_found || 0), 0);
    const severity = highestSeverity(results);
    const mission = {
      id: `MIS-${Date.now()}`,
      asset_id: asset?.id || 'asset-1',
      asset_name: asset?.name || 'North Ring Road',
      drone_model: req.body.drone_model || 'DJI Mavic 3T',
      pilot_name: req.body.pilot_name || 'System Agent',
      flight_altitude_m: 80,
      date: new Date().toISOString().slice(0, 10),
      total_images: files.length,
      defects_found: totalDefects,
      severity,
      status: 'Completed',
      images: results,
      model: 'bridge-defect-yolo26m',
    };
    missions.push(mission);
    return res.json({ mission, results, asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bridge inspection failed.';
    return res.status(503).json({ error: message });
  }

  /* Legacy mock implementation retained below only as reference while the
     endpoint now returns real detections from the trained bridge model. */
  /*
  const mission = {
    id: `MIS-${Date.now()}`,
    asset_id: asset?.id || 'asset-1',
    asset_name: asset?.name || 'North Ring Road',
    drone_model: req.body.drone_model || 'DJI Mavic 3T',
    pilot_name: req.body.pilot_name || 'System Agent',
    flight_altitude_m: 80,
    date: new Date().toISOString().slice(0, 10),
    total_images: files.length,
    defects_found: files.length > 0 ? Math.min(5, files.length) : 0,
    severity: files.length > 0 ? 'High' : 'Low',
    status: 'Completed',
    images: [],
  };

  const results = files.map((file, index) => {
    const hasBuffer = file && Buffer.isBuffer(file.buffer) && file.buffer.length > 0
    const imageUrl = hasBuffer
      ? `data:${file.mimetype || 'image/jpeg'};base64,${file.buffer.toString('base64')}`
      : `/dataset/${encodeURIComponent(file.originalname)}`

    return {
      id: `frame-${Date.now()}-${index}`,
      filename: file.originalname,
      file_name: file.originalname,
      metrics: {
        defects_found: index % 2 === 0 ? 1 : 0,
        severity: index % 2 === 0 ? 'High' : 'Low',
        processing_time_ms: 1200 + index * 130,
      },
      image_url: imageUrl,
      bounding_boxes: [
        {
          id: `box-${Date.now()}-${index}`,
          x: 110,
          y: 120,
          width: 120,
          height: 90,
          confidence: '94%',
          label: 'Pothole (94%)',
          status: 'Verified',
        },
      ],
    }
  })

  res.json({
    mission,
    results,
    asset,
  });
  */
});

app.post('/api/missions', (req, res) => {
  const payload = req.body || {};
  const asset = dashboardOverview.assets.find((item) => item.id === payload.asset_id) || dashboardOverview.assets[0];
  const mission = {
    id: `MIS-${Date.now()}`,
    asset_id: asset.id,
    asset_name: asset.name,
    drone_model: payload.drone_model || 'DJI Mavic 3T',
    pilot_name: payload.pilot_name || 'System Agent',
    flight_altitude_m: Number(payload.flight_altitude_m || 80),
    date: new Date().toISOString().slice(0, 10),
    total_images: payload.total_images || 0,
    defects_found: payload.defects_found || 0,
    severity: payload.severity || 'Low',
    status: payload.status || 'Scheduled',
    images: [],
  };

  missions.push(mission);
  res.json({ mission });
});

app.use('/dataset', express.static(path.join(__dirname, 'tests', 'sample_images')));
app.use('/media', express.static(runtimeDirectory));

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'frontend-react/dist')));

// Fallback to React index.html for client-side routing
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'frontend-react/dist/index.html'));
});

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚁 AeroPatch Decision Support System running on http://0.0.0.0:${PORT}`);
});
