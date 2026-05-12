import { useState, useEffect } from 'react';
import { getLatestScores } from '../services/api';
import { findWeaknesses, getGradeRecommendation, formatMetricName } from '../utils/weaknessDetection';
import TrainingPlan from './TrainingPlan';

function Dashboard() {
  const [scores, setScores] = useState([]);
  const [weaknesses, setWeaknesses] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentGrade, setCurrentGrade] = useState('V5');
  const GRADES = ['V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10'];

  const userSettings = {
    gender: 'male',
    climbingType: 'bouldering',
    targetGrade: currentGrade
  };

  useEffect(() => {
    loadScores();
  }, [currentGrade]);

  const loadScores = async () => {
    try {
      setLoading(true);
      const response = await getLatestScores(1);

      if (response.success && response.data.length > 0) {
        const filtered = response.data.filter(s => s.metric_name !== 'Campus_Max_Reach_inches');
        setScores(filtered);

        // Analyze weaknesses
        const weaknessData = findWeaknesses(
          filtered,
          userSettings.gender,
          userSettings.climbingType,
          userSettings.targetGrade
        );

        setWeaknesses(weaknessData);

        // Get grade recommendation
        const gradeRec = getGradeRecommendation(weaknessData);
        setRecommendation(gradeRec);
      }

      setError(null);
    } catch (err) {
      console.error('Error loading scores:', err);
      setError('Failed to load scores. Make sure the backend is running and database is set up.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading your climbing data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">Error</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadScores}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (scores.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">No Test Results Yet</h3>
          <p className="text-gray-600">Add your first test results to see your weakness analysis!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Your Climbing Performance</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-gray-600">Current Grade</label>
          <select
            value={currentGrade}
            onChange={(e) => setCurrentGrade(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {/* Grade Recommendation */}
      {recommendation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <p className="text-lg font-semibold text-blue-900">{recommendation.recommendation}</p>
        </div>
      )}

      {/* Weaknesses Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Weaknesses</h2>
        <div className="grid gap-4">
          {weaknesses
            .filter(w => w.is_weakness)
            .slice(0, 3)
            .map((weakness, index) => (
              <div
                key={weakness.metric_name}
                className="bg-white border-2 border-red-200 rounded-lg p-4 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">
                      #{index + 1} {formatMetricName(weakness.metric_name)}
                    </h3>
                    <p className="text-sm text-gray-600">{weakness.category}</p>
                  </div>
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {weakness.grade_gap.toFixed(1)} grades behind
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-600">Your Score</p>
                    <p className="text-xl font-bold text-red-600">
                      {weakness.user_score} {weakness.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Grade Equivalent</p>
                    <p className="text-sm font-semibold">
                      ~{weakness.grade_equivalent} level
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Target Range</p>
                    <p className="text-sm font-semibold text-orange-600">
                      {weakness.benchmark_low.toFixed(2)} – {weakness.benchmark_high.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${Math.min(weakness.percentile, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}

          {weaknesses.filter(w => w.is_weakness).length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <p className="text-green-800 font-semibold">No weaknesses detected!</p>
              <p className="text-green-600 text-sm">All your metrics are at or above your target grade level.</p>
            </div>
          )}
        </div>
      </div>

      {/* All Metrics Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">All Your Metrics</h2>
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Metric</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Your Score</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Benchmark Range</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {weaknesses.map((item) => (
                <tr key={item.metric_name} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{formatMetricName(item.metric_name)}</p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold">
                      {item.user_score} {item.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {item.benchmark_low.toFixed(2)} - {item.benchmark_high.toFixed(2)} {item.unit}
                  </td>
                  <td className="px-6 py-4">
                    {item.is_weakness ? (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                        Needs Work
                      </span>
                    ) : item.is_exceeding ? (
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
                        Exceeds
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                        Good
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Training Plan */}
      <TrainingPlan
        weaknesses={weaknesses}
        targetGrade={currentGrade}
        gender={userSettings.gender}
      />

      {/* Refresh Button */}
      <div className="mt-8 text-center">
        <button
          onClick={loadScores}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
