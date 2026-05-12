import { useState } from 'react';
import Dashboard from './components/Dashboard';
import TestForm from './components/TestForm';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTestSuccess = () => {
    // Refresh dashboard after adding new test
    setRefreshKey(prev => prev + 1);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold">🧗 Rock Climbing Tracker</h1>
          <p className="text-blue-100 mt-1">Track your progress, identify weaknesses, improve your climbing</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-2 border-b-2 font-semibold transition ${
                activeTab === 'dashboard'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('add-test')}
              className={`py-4 px-2 border-b-2 font-semibold transition ${
                activeTab === 'add-test'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ➕ Add Test
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-8">
        {activeTab === 'dashboard' && <Dashboard key={refreshKey} />}
        {activeTab === 'add-test' && <TestForm onSuccess={handleTestSuccess} />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-gray-600">
          <p>Built with React, Express, and PostgreSQL</p>
          <p className="text-sm mt-2">Track your climbing metrics and identify areas for improvement</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
