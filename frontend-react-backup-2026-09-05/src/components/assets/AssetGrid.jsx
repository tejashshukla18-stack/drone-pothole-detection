import AssetCard from './AssetCard.jsx'
import EmptyState from '../ui/EmptyState.jsx'
import ErrorState from '../ui/ErrorState.jsx'
import Spinner from '../ui/Spinner.jsx'

export default function AssetGrid({
  status,
  assets,
  filteredAssets,
  onOpen,
  onInspect,
  onRegisterClick,
  onRetry,
}) {
  if (status === 'loading') {
    return <Spinner label="Loading infrastructure assets..." />
  }

  if (status === 'error') {
    return (
      <ErrorState
        title="Couldn't load infrastructure assets"
        message="There was a problem reaching the asset registry. Check your connection and try again."
        onRetry={onRetry}
      />
    )
  }

  // No assets registered at all.
  if (assets.length === 0) {
    return (
      <EmptyState
        icon="fa-solid fa-road-barrier"
        title="No Infrastructure Assets Registered"
        message="Register roads, bridges, expressways, or municipal pavements to monitor defect health and dispatch work orders."
        action={
          <button
            type="button"
            onClick={onRegisterClick}
            className="inline-flex items-center gap-2 rounded-sm bg-accent-blue px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent-blue-hover"
          >
            <i className="fa-solid fa-circle-plus" /> Register First Asset
          </button>
        }
      />
    )
  }

  // Assets exist, but the current search/filter combination matched none.
  if (filteredAssets.length === 0) {
    return (
      <EmptyState
        icon="fa-solid fa-filter-circle-xmark"
        title="No Matching Assets"
        message="Try adjusting your search term or filters to find what you're looking for."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {filteredAssets.map((asset) => (
        <AssetCard key={asset.id} asset={asset} onOpen={onOpen} onInspect={onInspect} />
      ))}
    </div>
  )
}
