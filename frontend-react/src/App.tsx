import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Inspections from './pages/Inspections';

function App() {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'inspections'>('dashboard');

  return (
    <div>
      <nav className="bg-gray-800 text-white p-4 flex gap-4">
        <button
          onClick={() => setCurrentPage('dashboard')}
          className={`px-4 py-2 rounded ${currentPage === 'dashboard' ? 'bg-blue-500' : 'hover:bg-gray-700'}`}
        >
          📊 Dashboard
        </button>
        <button
          onClick={() => setCurrentPage('inspections')}
          className={`px-4 py-2 rounded ${currentPage === 'inspections' ? 'bg-blue-500' : 'hover:bg-gray-700'}`}
        >
          🚁 Inspections
        </button>
      </nav>

      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'inspections' && <Inspections />}
    </div>
  );
}

export default App;