/**
 * Shared API-free OpenStreetMap tile provider and geospatial color scales.
 * The dark dashboard shell is styled by the application; map tiles must not
 * depend on a Carto API key.
 */

export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const TILE_MAX_ZOOM = 19;

/**
 * Maps asset health scores (0-100) to command-center tactical status colors:
 * - >= 80: Emerald (Optimal / Serviceable)
 * - >= 60: Amber / Copper (Degraded / Monitoring)
 * - < 60:  Red (Critical / Intervention Required)
 */
export function healthScoreToColor(score) {
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) return '#94a3b8';
  if (numeric >= 80) return '#10b981';
  if (numeric >= 60) return '#f59e0b';
  return '#ef4444';
}

/**
 * Maps defect priority / severity levels to tactical color indicators:
 * - P1 / Critical / High: Red (#ef4444)
 * - P2 / Scheduled / Medium: Amber / Copper (#f59e0b)
 * - P3 / Routine / Low: Emerald (#10b981)
 */
export function severityToColor(severity) {
  const key = String(severity || '').toLowerCase();
  if (key.includes('p1') || key.includes('critical') || key.includes('high')) {
    return '#ef4444';
  }
  if (key.includes('p2') || key.includes('medium') || key.includes('scheduled')) {
    return '#f59e0b';
  }
  if (key.includes('p3') || key.includes('low') || key.includes('routine')) {
    return '#10b981';
  }
  return '#e07a38'; // Default copper accent for unclassified items
}
