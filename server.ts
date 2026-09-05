import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import multer from 'multer';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const bridgeCvUrl = (process.env.BRIDGE_CV_API_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');
const visionStartScript = path.join(__dirname, 'backend', 'API', 'start.ps1');
let visionStartPromise: Promise<boolean> | null = null;

async function visionIsHealthy() {
  try {
    const response = await fetch(`${bridgeCvUrl}/health`, { signal: AbortSignal.timeout(1500) });
    return response.ok;
  } catch {
    return false;
  }
}

/** Launch the local Python vision service only when it is not already running.
 * Set AUTO_START_VISION=false when BRIDGE_CV_API_URL points at a remote service. */
async function ensureVisionService() {
  if (await visionIsHealthy()) return true;
  if (process.env.AUTO_START_VISION === 'false') return false;
  if (!visionStartPromise) {
    visionStartPromise = (async () => {
      try {
        const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', visionStartScript], {
          cwd: __dirname, detached: true, stdio: 'ignore', windowsHide: true,
        });
        child.unref();
      } catch {
        return false;
      }
      for (let attempt = 0; attempt < 45; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (await visionIsHealthy()) return true;
      }
      return false;
    })().finally(() => { visionStartPromise = null; });
  }
  return visionStartPromise;
}
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
const potholeSnapshotDirectory = path.join(runtimeDirectory, 'pothole-snapshots');
mkdirSync(potholeSnapshotDirectory, { recursive: true });

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
  if (!await ensureVisionService()) throw new Error('Vision service could not start. Verify C:\\venvs\\pothole and backend\\API\\start.ps1.');
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
  if (!await ensureVisionService()) throw new Error('Vision service could not start. Verify C:\\venvs\\pothole and backend\\API\\start.ps1.');
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
  if (!await ensureVisionService()) throw new Error('Vision service is unavailable.');
  const response = await fetch(`${bridgeCvUrl}/api/video-jobs/${encodeURIComponent(jobId)}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.detail || `Video job lookup failed (${response.status})`);
  return payload.job;
}

async function visionJson(pathname: string, options?: RequestInit) {
  if (!await ensureVisionService()) throw new Error('Vision service could not start. Verify C:\\venvs\\pothole and backend\\API\\start.ps1.');
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

type ReportSeverity = 'High' | 'Medium' | 'Low';
type Coordinates = { lat: number; lng: number };
type PotholeRecord = {
  id: string;
  coordinates: Coordinates;
  area_sqm: number;
  depth_cm: number;
  severity: ReportSeverity;
  confidence: number;
  snapshot_url: string;
  bounding_box: [number, number, number, number];
  repair_material: string;
  gps_source: 'frame_telemetry' | 'asset_reference';
};

const operationalSettings = {
  department_name: 'Department of Transportation & Municipal Infrastructure',
  city_name: 'Metropolitan City Authority',
  lead_engineer: 'Sarah Lin, PE',
  inspector_license: 'CA-PE #84729 / FAA Part 107 #4910284',
  coordinate_system: 'WGS84 (EPSG:4326) / UTM Zone 10N',
  nms_iou_threshold: 0.35,
  min_defect_area_sqcm: 85,
  auto_ticket_escalation: 'high_only',
  nfz_alert_radius_m: 200,
  auto_escalation_enabled: true,
  critical_issue_auto_ticket: true,
  default_sla_hours: 24,
  notification_channels: ['In-App Notification'],
};
const reportsDB: any[] = [];
const workOrdersDB: any[] = [];
const notificationsDB: any[] = [];
const escalationsDB: any[] = [];

function assetCoordinates(asset: any): Coordinates {
  return {
    lat: Number(asset?.location?.lat ?? asset?.latitude ?? 37.7749),
    lng: Number(asset?.location?.lng ?? asset?.longitude ?? -122.4194),
  };
}

function numberInRange(value: unknown, fallback: number, minimum: number, maximum: number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(maximum, Math.max(minimum, numeric)) : fallback;
}

function potholeSeverity(areaSqm: number, depthCm: number): ReportSeverity {
  if (depthCm >= 5 || areaSqm >= 0.3) return 'High';
  if (depthCm >= 2 || areaSqm >= 0.05) return 'Medium';
  return 'Low';
}

function repairMaterial(severity: ReportSeverity) {
  return severity === 'High' ? 'Hot-mix asphalt emergency patch' : severity === 'Medium'
    ? 'Cold-mix asphalt and tack coat' : 'Surface sealant and monitoring marker';
}

function reportSeverity(potholes: PotholeRecord[]): ReportSeverity {
  const totalArea = potholes.reduce((sum, pothole) => sum + pothole.area_sqm, 0);
  const maxDepth = Math.max(0, ...potholes.map((pothole) => pothole.depth_cm));
  if (potholes.some((pothole) => pothole.severity === 'High') || potholes.length >= 4 || totalArea > 0.5 || maxDepth >= 5) return 'High';
  if (potholes.some((pothole) => pothole.severity === 'Medium')) return 'Medium';
  return 'Low';
}

function normalizePothole(payload: any, asset: any, index: number): PotholeRecord {
  const coordinates = payload?.coordinates || {};
  const fallbackCoordinates = assetCoordinates(asset);
  const area_sqm = numberInRange(payload?.area_sqm, 0.04, 0.001, 50);
  const depth_cm = numberInRange(payload?.depth_cm, 1.5, 0.1, 100);
  const confidence = numberInRange(payload?.confidence, 0.5, 0, 1);
  const box = Array.isArray(payload?.bounding_box) && payload.bounding_box.length === 4
    ? payload.bounding_box.map((value: unknown) => numberInRange(value, 0, 0, 100000)) as [number, number, number, number]
    : [0, 0, 0, 0] as [number, number, number, number];
  const severity = potholeSeverity(area_sqm, depth_cm);
  return {
    id: String(payload?.id || `DEF-${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`),
    coordinates: {
      lat: numberInRange(coordinates.lat, fallbackCoordinates.lat, -90, 90),
      lng: numberInRange(coordinates.lng, fallbackCoordinates.lng, -180, 180),
    },
    area_sqm: Number(area_sqm.toFixed(3)),
    depth_cm: Number(depth_cm.toFixed(1)),
    severity,
    confidence: Number(confidence.toFixed(4)),
    snapshot_url: typeof payload?.snapshot_url === 'string' ? payload.snapshot_url : '',
    bounding_box: box,
    repair_material: repairMaterial(severity),
    gps_source: payload?.gps_source === 'frame_telemetry' ? 'frame_telemetry' : 'asset_reference',
  };
}

async function createPotholeSnapshot(imageUrl: string | undefined, box: any, id: string) {
  if (!imageUrl || !box) return imageUrl || '';
  try {
    const mediaPath = imageUrl.startsWith('/media/')
      ? path.resolve(runtimeDirectory, imageUrl.slice('/media/'.length)) : null;
    if (mediaPath && !mediaPath.startsWith(`${path.resolve(runtimeDirectory)}${path.sep}`)) return imageUrl;
    const source = imageUrl.startsWith('data:image/')
      ? Buffer.from(imageUrl.split(',')[1] || '', 'base64')
      : mediaPath
        ? mediaPath
        : null;
    if (!source) return imageUrl;
    const metadata = await sharp(source).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const left = Math.max(0, Math.min(width - 1, Math.round(Number(box.x) || 0)));
    const top = Math.max(0, Math.min(height - 1, Math.round(Number(box.y) || 0)));
    const cropWidth = Math.max(1, Math.min(width - left, Math.round(Number(box.width) || width)));
    const cropHeight = Math.max(1, Math.min(height - top, Math.round(Number(box.height) || height)));
    const filename = `${id}.jpg`;
    await sharp(source).extract({ left, top, width: cropWidth, height: cropHeight }).jpeg({ quality: 88 }).toFile(path.join(potholeSnapshotDirectory, filename));
    return `/media/pothole-snapshots/${filename}`;
  } catch {
    // Evidence is still retained as the annotated frame when the input cannot be cropped.
    return imageUrl;
  }
}

async function potholesFromMission(mission: any, asset: any): Promise<PotholeRecord[]> {
  const records: PotholeRecord[] = [];
  for (const frame of mission?.images || []) {
    for (const box of frame.bounding_boxes || []) {
      if (!String(box.label || '').toLowerCase().includes('pothole')) continue;
      const areaSqm = numberInRange(box.area_sqm, Math.max(0.01, Number(box.area_ratio || 0) * 6), 0.001, 50);
      const depthCm = numberInRange(box.depth_cm, Math.min(8, 1.2 + areaSqm * 14), 0.1, 100);
      const id = `DEF-${new Date().getFullYear()}-${String(records.length + 1).padStart(3, '0')}`;
      const snapshot = await createPotholeSnapshot(frame.image_url, box, id);
      records.push(normalizePothole({
        id,
        area_sqm: areaSqm,
        depth_cm: depthCm,
        confidence: box.confidence_score ?? (Number(String(box.confidence || '').replace('%', '')) / 100),
        snapshot_url: snapshot,
        bounding_box: [box.y || 0, box.x || 0, (box.y || 0) + (box.height || 0), (box.x || 0) + (box.width || 0)],
        gps_source: 'asset_reference',
      }, asset, records.length));
    }
  }
  return records;
}

function shouldAutoEscalate(severity: ReportSeverity) {
  return operationalSettings.auto_ticket_escalation === 'high_only' ? severity === 'High'
    : operationalSettings.auto_ticket_escalation === 'medium_high' ? severity !== 'Low' : false;
}

function createAutoWorkOrder(report: any, asset: any) {
  const workOrder = {
    id: `WO-${new Date().getFullYear()}-${String(workOrdersDB.length + 1).padStart(4, '0')}`,
    report_id: report.id,
    asset_id: asset.id,
    asset_name: asset.name,
    title: `P1 pothole repair — ${asset.name}`,
    priority: 'P1 - Immediate Repair',
    status: 'Pending Dispatch',
    assigned_team: 'Municipal Rapid Asphalt Unit',
    asset_location: assetCoordinates(asset),
    location: assetCoordinates(asset),
    estimated_cost: report.total_rehabilitation_cost,
    timeline: [{ at: new Date().toISOString(), status: 'Auto-escalated by certified AI inspection report' }],
    created_at: new Date().toISOString(),
  };
  workOrdersDB.push(workOrder);
  report.work_order_id = workOrder.id;
  const coordinates = assetCoordinates(asset);
  const escalation = {
    id: `ESC-${new Date().getFullYear()}-${String(escalationsDB.length + 1).padStart(4, '0')}`,
    ticketId: `ESC-${new Date().getFullYear()}-${String(escalationsDB.length + 1).padStart(4, '0')}`,
    detectionId: report.potholes.find((item: PotholeRecord) => item.severity === 'High')?.id || report.potholes[0]?.id || 'REPORT-LEVEL',
    inspectionId: report.mission_id,
    reportId: report.id,
    assetId: asset.id,
    assetName: asset.name,
    issueType: 'Pothole / Asphalt Cavity',
    severity: 'Critical',
    priority: workOrder.priority,
    status: 'AUTO_GENERATED',
    department: 'Municipal Rapid Asphalt Unit',
    authorityName: 'Municipal Rapid Asphalt Unit',
    authorityResponse: 'Awaiting acknowledgement',
    confidence: `${Math.round(Math.max(0, ...report.potholes.map((item: PotholeRecord) => item.confidence)) * 100)}%`,
    condition: 'High report severity threshold reached',
    risk: 'Immediate road-user safety risk',
    location: { lat: coordinates.lat, lng: coordinates.lng, address: `${asset.name} — asset reference coordinates` },
    notificationStatus: 'SIMULATED_SENT',
    dispatchLog: [{ at: new Date().toISOString(), status: 'Auto-escalated by certified AI inspection report' }],
    workOrderId: workOrder.id,
    createdAt: new Date().toISOString(),
    slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  escalationsDB.unshift(escalation);
  notificationsDB.unshift({ id: randomUUID(), type: 'critical', title: 'CRITICAL ESCALATION: P1 Ticket Auto-Generated', message: `${workOrder.id} is pending dispatch to Municipal Rapid Asphalt Unit.`, read: false, created_at: new Date().toISOString() });
  return workOrder;
}

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

app.post('/api/assets', (req, res) => {
  const payload = req.body || {};
  const name = String(payload.name || '').trim();
  const latitude = Number(payload.lat ?? payload.latitude);
  const longitude = Number(payload.lng ?? payload.longitude);
  if (!name) return res.status(400).json({ error: 'Asset name is required.' });
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Enter a valid latitude (-90 to 90) and longitude (-180 to 180).' });
  }
  const id = `asset-${Date.now()}`;
  const suppliedCode = String(payload.code || '').trim();
  const asset = {
    id,
    name,
    code: suppliedCode || `AST-${String(dashboardOverview.assets.length + 1).padStart(3, '0')}`,
    type: ['Road', 'Bridge', 'Municipal Surface'].includes(payload.type) ? payload.type : 'Road',
    district: String(payload.district || 'Central Metro District').trim(),
    surface_type: String(payload.surface_type || 'Dense Graded Hot-Mix Asphalt').trim(),
    latitude,
    longitude,
    location: { lat: latitude, lng: longitude },
    health_score: 100,
    total_defects: 0,
    created_at: new Date().toISOString(),
  };
  dashboardOverview.assets.push(asset);
  return res.status(201).json({ asset });
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

app.get('/api/reports', (_req, res) => {
  res.json({ reports: reportsDB.map(({ potholes, ...report }) => ({ ...report, pothole_count: potholes.length })) });
});

app.get('/api/reports/:reportId', (req, res) => {
  const report = reportsDB.find((item) => item.id === req.params.reportId);
  if (!report) return res.status(404).json({ error: 'Report not found.' });
  const asset = dashboardOverview.assets.find((item) => item.id === report.asset_id);
  return res.json({ report, asset, potholes: report.potholes, defects: report.potholes, images: report.images || [] });
});

app.post('/api/reports', async (req, res) => {
  const assetId = req.body?.asset_id || req.body?.assetId;
  const missionId = req.body?.mission_id || req.body?.missionId;
  const asset = dashboardOverview.assets.find((item) => item.id === assetId) || dashboardOverview.assets[0];
  const mission = missions.find((item) => item.id === missionId) || missions[missions.length - 1];
  if (!asset || !mission) return res.status(400).json({ error: 'A valid asset and inspection mission are required.' });
  try {
    const supplied = Array.isArray(req.body?.potholes) ? req.body.potholes : null;
    const potholes = supplied
      ? supplied.map((record: any, index: number) => normalizePothole(record, asset, index))
      : await potholesFromMission(mission, asset);
    const overall_severity = reportSeverity(potholes);
    const totalArea = potholes.reduce((sum, pothole) => sum + pothole.area_sqm, 0);
    const report = {
      id: `RPT-${new Date().getFullYear()}-${String(reportsDB.length + 1).padStart(4, '0')}`,
      report_number: `AERO-RPT-${new Date().getFullYear()}-${String(reportsDB.length + 1).padStart(4, '0')}`,
      title: `Pavement inspection — ${asset.name}`,
      asset_id: asset.id,
      asset_name: asset.name,
      mission_id: mission.id,
      generated_date: new Date().toISOString().slice(0, 10),
      inspector: req.body?.inspector || `${operationalSettings.lead_engineer} (${operationalSettings.inspector_license})`,
      overall_severity,
      overall_condition: overall_severity === 'High' ? 'Critical' : overall_severity,
      executive_summary: `${potholes.length} pothole${potholes.length === 1 ? '' : 's'} recorded; ${totalArea.toFixed(2)} m² affected. Overall pavement severity: ${overall_severity.toUpperCase()}.`,
      health_score: overall_severity === 'High' ? 55 : overall_severity === 'Medium' ? 72 : 90,
      defects_summary: { total: potholes.length, p1_high: potholes.filter((item) => item.severity === 'High').length },
      total_rehabilitation_cost: Math.round(potholes.reduce((sum, item) => sum + (item.severity === 'High' ? 2200 : item.severity === 'Medium' ? 950 : 300), 0)),
      recommendations: overall_severity === 'High'
        ? ['Dispatch emergency asphalt repair crew.', 'Verify cavity dimensions on site before repair.', 'Complete post-repair inspection.']
        : ['Schedule repair according to maintenance priority.', 'Maintain photographic and GPS evidence.'],
      potholes,
      images: [...new Set(potholes.map((item) => item.snapshot_url).filter(Boolean))],
      work_order_id: null as string | null,
      created_at: new Date().toISOString(),
    };
    reportsDB.unshift(report);
    const work_order = shouldAutoEscalate(overall_severity) ? createAutoWorkOrder(report, asset) : null;
    return res.status(201).json({ report, potholes, work_order, auto_escalated: Boolean(work_order) });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Could not generate pavement report.' });
  }
});

app.get('/api/maintenance', (_req, res) => res.json({ work_orders: workOrdersDB }));

app.post('/api/maintenance', (req, res) => {
  const asset = dashboardOverview.assets.find((item) => item.id === req.body?.asset_id) || dashboardOverview.assets[0];
  if (!asset || !req.body?.title) return res.status(400).json({ error: 'A work-order title and valid asset are required.' });
  const workOrder = {
    id: `WO-${new Date().getFullYear()}-${String(workOrdersDB.length + 1).padStart(4, '0')}`,
    asset_id: asset.id, asset_name: asset.name, title: String(req.body.title),
    priority: req.body.priority || 'P2 - Scheduled Maintenance', status: 'Pending Dispatch',
    assigned_team: req.body.contractor || 'Municipal Maintenance Unit', repair_method: req.body.repair_method || '',
    asset_location: assetCoordinates(asset), location: assetCoordinates(asset),
    estimated_cost: Number(req.body.estimated_cost || 0), deadline: req.body.deadline || null,
    timeline: [{ at: new Date().toISOString(), status: 'Manually dispatched' }], created_at: new Date().toISOString(),
  };
  workOrdersDB.push(workOrder);
  return res.status(201).json({ work_order: workOrder });
});

app.get('/api/settings', (_req, res) => res.json({ settings: operationalSettings, escalation_settings: operationalSettings, users: [] }));

app.post('/api/settings', (req, res) => {
  const payload = req.body || {};
  Object.assign(operationalSettings, {
    department_name: String(payload.department_name || operationalSettings.department_name),
    city_name: String(payload.city_name || operationalSettings.city_name),
    lead_engineer: String(payload.lead_engineer || operationalSettings.lead_engineer),
    inspector_license: String(payload.inspector_license || operationalSettings.inspector_license),
    coordinate_system: String(payload.coordinate_system || operationalSettings.coordinate_system),
    nms_iou_threshold: numberInRange(payload.nms_iou_threshold, operationalSettings.nms_iou_threshold, 0.1, 0.9),
    min_defect_area_sqcm: numberInRange(payload.min_defect_area_sqcm, operationalSettings.min_defect_area_sqcm, 1, 100000),
    auto_ticket_escalation: ['high_only', 'medium_high', 'manual_only'].includes(payload.auto_ticket_escalation)
      ? payload.auto_ticket_escalation : operationalSettings.auto_ticket_escalation,
    nfz_alert_radius_m: numberInRange(payload.nfz_alert_radius_m, operationalSettings.nfz_alert_radius_m, 100, 1000),
  });
  return res.json({ settings: operationalSettings });
});

app.post('/api/settings/escalation', (req, res) => {
  const payload = req.body || {};
  Object.assign(operationalSettings, {
    auto_escalation_enabled: Boolean(payload.auto_escalation_enabled),
    critical_issue_auto_ticket: Boolean(payload.critical_issue_auto_ticket),
    default_sla_hours: numberInRange(payload.default_sla_hours, operationalSettings.default_sla_hours, 1, 720),
    notification_channels: Array.isArray(payload.notification_channels)
      ? payload.notification_channels.filter((item: unknown) => typeof item === 'string').slice(0, 4)
      : operationalSettings.notification_channels,
  });
  operationalSettings.auto_ticket_escalation = operationalSettings.critical_issue_auto_ticket ? 'high_only' : 'manual_only';
  return res.json({ escalation_settings: operationalSettings });
});

app.get('/api/notifications', (_req, res) => res.json({ notifications: notificationsDB }));
app.post('/api/notifications/mark-read', (_req, res) => {
  notificationsDB.forEach((notification) => { notification.read = true; });
  res.json({ ok: true });
});

function escalationKpis() {
  const open = escalationsDB.filter((item) => !['RESOLVED', 'CLOSED'].includes(item.status));
  return {
    critical_issues: escalationsDB.filter((item) => item.severity === 'Critical').length,
    high_priority: escalationsDB.filter((item) => item.priority?.startsWith('P1')).length,
    open_tickets: open.length,
    resolved: escalationsDB.filter((item) => item.status === 'RESOLVED').length,
    awaiting_response: escalationsDB.filter((item) => item.authorityResponse !== 'Acknowledged').length,
    in_progress: escalationsDB.filter((item) => item.status === 'IN_PROGRESS').length,
    overdue: open.filter((item) => item.slaDeadline && new Date(item.slaDeadline).getTime() < Date.now()).length,
  };
}

app.get('/api/escalations', (_req, res) => res.json({ escalations: escalationsDB, kpis: escalationKpis() }));
app.get('/api/escalations/:ticketId', (req, res) => {
  const escalation = escalationsDB.find((item) => item.id === req.params.ticketId || item.ticketId === req.params.ticketId);
  if (!escalation) return res.status(404).json({ error: 'Escalation ticket not found.' });
  return res.json({ escalation });
});

function updateEscalation(req: express.Request, res: express.Response, apply: (ticket: any) => void) {
  const ticket = escalationsDB.find((item) => item.id === req.params.ticketId || item.ticketId === req.params.ticketId);
  if (!ticket) return res.status(404).json({ error: 'Escalation ticket not found.' });
  apply(ticket);
  return res.json({ escalation: ticket });
}

app.post('/api/escalations/:ticketId/notify/retry', (req, res) => updateEscalation(req, res, (ticket) => {
  ticket.notificationStatus = 'SIMULATED_SENT'; ticket.status = 'NOTIFIED'; ticket.dispatchLog.push({ at: new Date().toISOString(), status: 'Notification retried' });
}));
app.post('/api/escalations/:ticketId/acknowledge', (req, res) => updateEscalation(req, res, (ticket) => {
  ticket.authorityResponse = 'Acknowledged'; ticket.status = 'ACKNOWLEDGED'; ticket.dispatchLog.push({ at: new Date().toISOString(), status: 'Authority acknowledged' });
}));
app.post('/api/escalations/:ticketId/escalate', (req, res) => updateEscalation(req, res, (ticket) => {
  ticket.status = 'ESCALATED'; ticket.dispatchLog.push({ at: new Date().toISOString(), status: 'Manually escalated' });
}));
app.post('/api/escalations/:ticketId/link-work-order', (req, res) => updateEscalation(req, res, (ticket) => {
  ticket.workOrderId = String(req.body?.work_order_id || ticket.workOrderId || ''); ticket.status = 'IN_PROGRESS';
}));
app.post('/api/escalations/:ticketId/resolve', (req, res) => updateEscalation(req, res, (ticket) => {
  ticket.status = 'RESOLVED'; ticket.afterRepairImageUrl = req.body?.after_repair_image_url || null;
}));
app.post('/api/escalations/:ticketId/verify', (req, res) => updateEscalation(req, res, (ticket) => {
  ticket.status = req.body?.resolved ? 'VERIFICATION_REQUIRED' : 'REOPENED'; ticket.verifiedBy = req.body?.verified_by || 'Inspector';
}));
app.post('/api/escalations/:ticketId/close', (req, res) => updateEscalation(req, res, (ticket) => { ticket.status = 'CLOSED'; }));
app.get('/api/authorities', (_req, res) => res.json({ authorities: [{ id: 'rapid-asphalt', name: 'Municipal Rapid Asphalt Unit' }] }));

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
  void ensureVisionService().then((started) => {
    console.log(started ? '🧠 Vision sidecar ready.' : '⚠️ Vision sidecar was not started; inspection requests will report the setup error.');
  });
});
