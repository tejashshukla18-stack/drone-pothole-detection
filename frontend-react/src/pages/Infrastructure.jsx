import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AssetToolbar from '../components/assets/AssetToolbar.jsx'
import AssetGrid from '../components/assets/AssetGrid.jsx'
import AssetDetailDrawer from '../components/assets/AssetDetailDrawer.jsx'
import RegisterAssetModal from '../components/assets/RegisterAssetModal.jsx'
import { fetchAssets } from '../api/assets.js'

const INITIAL_FILTERS = { query: '', type: 'ALL', status: 'ALL' }

export default function Infrastructure() {
  const navigate = useNavigate()

  const [status, setStatus] = useState('loading') // loading | success | error
  const [assets, setAssets] = useState([])
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [selectedAssetId, setSelectedAssetId] = useState(null)
  const [isRegisterOpen, setRegisterOpen] = useState(false)

  const loadAssets = useCallback(async () => {
    setStatus('loading')
    try {
      const data = await fetchAssets()
      setAssets(data)
      setStatus('success')
    } catch (err) {
      console.error('Error fetching assets:', err)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    loadAssets()
  }, [loadAssets])

  const filteredAssets = useMemo(() => {
    const query = filters.query.trim().toLowerCase()
    return assets.filter((asset) => {
      const matchesQuery =
        !query ||
        asset.name.toLowerCase().includes(query) ||
        asset.code.toLowerCase().includes(query) ||
        asset.district.toLowerCase().includes(query)
      const matchesType = filters.type === 'ALL' || asset.type === filters.type
      const matchesStatus = filters.status === 'ALL' || asset.status === filters.status
      return matchesQuery && matchesType && matchesStatus
    })
  }, [assets, filters])

  function handleInspect(assetId) {
    setSelectedAssetId(null)
    navigate(`/inspections?assetId=${encodeURIComponent(assetId)}`)
  }

  function handleRegistered() {
    loadAssets()
  }

  return (
    <div className="flex flex-col gap-4">
      <AssetToolbar
        filters={filters}
        onFiltersChange={setFilters}
        onRegisterClick={() => setRegisterOpen(true)}
      />

      <AssetGrid
        status={status}
        assets={assets}
        filteredAssets={filteredAssets}
        onOpen={setSelectedAssetId}
        onInspect={handleInspect}
        onRegisterClick={() => setRegisterOpen(true)}
        onRetry={loadAssets}
      />

      {selectedAssetId && (
        <AssetDetailDrawer
          assetId={selectedAssetId}
          onClose={() => setSelectedAssetId(null)}
          onInspect={handleInspect}
        />
      )}

      <RegisterAssetModal
        isOpen={isRegisterOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={handleRegistered}
      />
    </div>
  )
}
