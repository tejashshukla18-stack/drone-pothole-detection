import { useEffect, useState } from 'react';
import { getDashboardOverview, getAssets, getInsights } from '../api';

export default function Dashboard() {
  const [overview, setOverview] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, assetsRes] = await Promise.all([
          getDashboardOverview(),
          getAssets(),
        ]);

        setOverview(overviewRes.data);
        setAssets(assetsRes.data.assets || []);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">AeroPath AI Dashboard</h1>
      
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-500 text-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Total Assets</h3>
          <p className="text-3xl font-bold">{overview?.kpis?.total_assets || 0}</p>
        </div>
        <div className="bg-green-500 text-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Inspections</h3>
          <p className="text-3xl font-bold">{overview?.kpis?.total_inspections || 0}</p>
        </div>
        <div className="bg-red-500 text-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Critical Defects</h3>
          <p className="text-3xl font-bold">{overview?.kpis?.critical_defects || 0}</p>
        </div>
        <div className="bg-yellow-500 text-white p-6 rounded-lg">
          <h3 className="text-lg font-semibold">Health Score</h3>
          <p className="text-3xl font-bold">{overview?.kpis?.health_score || 0}%</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Assets List</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((asset) => (
          <div key={asset.id} className="border p-4 rounded-lg hover:shadow-lg">
            <h4 className="font-bold text-lg">{asset.name}</h4>
            <p className="text-sm text-gray-600">ID: {asset.code}</p>
            <p className="text-sm text-gray-600">Type: {asset.type}</p>
            <p className="text-sm">
              Status: 
              <span className={`ml-2 px-2 py-1 rounded text-white ${
                asset.status === 'Optimal' ? 'bg-green-500' :
                asset.status === 'Needs Attention' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}>
                {asset.status}
              </span>
            </p>
            <p className="text-sm mt-2">Health Score: {asset.health_score}%</p>
            <p className="text-sm">Defects: {asset.total_defects}</p>
          </div>
        ))}
      </div>
    </div>
  );
}