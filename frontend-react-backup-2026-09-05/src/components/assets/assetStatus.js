// Shared helpers for translating an asset's health/status into consistent
// Tailwind classes across the card grid and detail drawer.

export function getAssetImages(asset) {
  if (!asset) return []
  if (asset.images && asset.images.length > 0) return asset.images
  if (asset.image) return [asset.image]
  return []
}

export function getStatusTone(asset) {
  const hasImage = getAssetImages(asset).length > 0
  if (!hasImage) return 'uninspected'
  if (asset.status === 'Optimal') return 'optimal'
  if (asset.status === 'Needs Attention') return 'attention'
  return 'critical'
}

export const STATUS_BADGE_CLASSES = {
  optimal: 'bg-p3/15 text-p3',
  attention: 'bg-p2/15 text-p2',
  critical: 'bg-p1/15 text-p1',
  uninspected: 'bg-border text-text-secondary',
}

export function getHealthDisplay(asset) {
  const hasImage = getAssetImages(asset).length > 0
  return hasImage ? `${asset.health_score}/100` : 'Uninspected'
}

export function getScorePillClasses(healthScore) {
  return healthScore < 70 ? 'bg-p1/15 text-p1' : 'bg-p3/15 text-p3'
}
