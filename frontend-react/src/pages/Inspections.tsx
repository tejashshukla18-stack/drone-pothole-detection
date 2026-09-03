import { useState } from 'react';
import { inspectSample, inspectBatch } from '../api';

export default function Inspections() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [selectedAsset, setSelectedAsset] = useState('AST-001');

  const handleInspectSample = async () => {
    setLoading(true);
    try {
      const response = await inspectSample({
        filenames: [
          'thumb (1).jpg',
          'thumb (2).jpg',
          'thumb (3).jpg',
          'thumb (4).jpg',
          'thumb (5).jpg',
        ],
        asset_id: selectedAsset,
        sensitivity: 'balanced',
      });
      setResults(response.data);
      alert('✅ Sample inspection completed!');
    } catch (error) {
      console.error('Inspection error:', error);
      alert('❌ Inspection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setLoading(true);
    const formData = new FormData();

    Array.from(e.target.files).forEach((file) => {
      formData.append('files', file);
    });
    formData.append('asset_id', selectedAsset);
    formData.append('sensitivity', 'balanced');

    try {
      const response = await inspectBatch(formData);
      setResults(response.data);
      alert('✅ Batch inspection completed!');
    } catch (error) {
      console.error('Batch inspection error:', error);
      alert('❌ Batch inspection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Drone Inspections</h1>

      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <label className="block text-sm font-semibold mb-4">Select Asset:</label>
        <input
          type="text"
          value={selectedAsset}
          onChange={(e) => setSelectedAsset(e.target.value)}
          className="w-full border p-2 rounded mb-4"
          placeholder="Asset ID (e.g., AST-001)"
        />

        <button
          onClick={handleInspectSample}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded disabled:bg-gray-400 mr-4"
        >
          {loading ? '⏳ Processing...' : '🚁 Inspect Sample Images'}
        </button>

        <label className="ml-4 inline-block">
          <span className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded cursor-pointer">
            📁 Upload Images
          </span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleBatchUpload}
            disabled={loading}
            className="hidden"
          />
        </label>
      </div>

      {results && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">📊 Inspection Results</h2>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-100 p-4 rounded">
              <p className="text-sm text-gray-600">Total Processed</p>
              <p className="text-2xl font-bold">{results.total_processed}</p>
            </div>
            <div className="bg-red-100 p-4 rounded">
              <p className="text-sm text-gray-600">Total Defects</p>
              <p className="text-2xl font-bold">{results.results[0]?.metrics?.defects_found || 0}</p>
            </div>
            <div className="bg-yellow-100 p-4 rounded">
              <p className="text-sm text-gray-600">Severity</p>
              <p className="text-2xl font-bold">{results.results[0]?.metrics?.severity || 'N/A'}</p>
            </div>
            <div className="bg-green-100 p-4 rounded">
              <p className="text-sm text-gray-600">Priority</p>
              <p className="text-sm font-bold">{results.results[0]?.metrics?.priority?.split(' ')[0]}</p>
            </div>
          </div>

          <h3 className="text-xl font-bold mb-4">📸 Images Processed:</h3>
          <div className="grid grid-cols-2 gap-4">
            {results.results?.map((img: any, idx: number) => (
              <div key={idx} className="border p-4 rounded">
                {img.image_url && (
                  <img
                    src={img.image_url}
                    alt={`Frame ${idx}`}
                    className="w-full h-48 object-cover rounded mb-3"
                  />
                )}
                <p className="font-semibold">{img.filename}</p>
                <p className="text-sm">Defects: {img.metrics.defects_found}</p>
                <p className="text-sm">Processing: {img.metrics.processing_time_ms}ms</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}