import { useState } from 'react';
import { saveTestResult } from '../services/api';

// Common climbing metrics with their units
const METRICS = [
  { name: 'Max_Hang_Str_Wt_20mm_10sec', label: 'Max Hang Strength (20mm, 10sec)', unit: 'bodyweight_ratio' },
  { name: 'Weighted_Pull_Up_Str_Wt_1RM', label: 'Weighted Pull-Up (1RM)', unit: 'bodyweight_ratio' },
  { name: 'Campus_Max_Reach_inches', label: 'Campus Max Reach', unit: 'inches' },
  { name: 'Repeaters_7_3_Bodyweight_20mm_sec', label: '7:3 Repeaters (20mm)', unit: 'sec' },
  { name: 'Continuous_Hang_Time_20mm_sec', label: 'Continuous Hang Time (20mm)', unit: 'sec' },
  { name: 'Max_Pull_Ups_reps', label: 'Max Pull-Ups', unit: 'reps' },
  { name: 'Max_Push_Ups_reps', label: 'Max Push-Ups', unit: 'reps' },
];

function TestForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    metric_name: '',
    score: '',
    unit: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleMetricChange = (e) => {
    const selectedMetric = METRICS.find(m => m.name === e.target.value);
    if (selectedMetric) {
      setFormData({
        ...formData,
        metric_name: selectedMetric.name,
        unit: selectedMetric.unit
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const dataToSend = {
        metric_name: formData.metric_name,
        score: parseFloat(formData.score),
        unit: formData.unit,
        notes: formData.notes || null
      };

      await saveTestResult(dataToSend);

      setSuccess(true);
      setFormData({
        metric_name: '',
        score: '',
        unit: '',
        notes: ''
      });

      // Call parent callback if provided
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1000);
      }
    } catch (err) {
      console.error('Error saving test result:', err);
      setError(err.response?.data?.error || 'Failed to save test result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Add New Test Result</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            ✓ Test result saved successfully!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Metric Selection */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Metric <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.metric_name}
              onChange={handleMetricChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a metric...</option>
              {METRICS.map(metric => (
                <option key={metric.name} value={metric.name}>
                  {metric.label}
                </option>
              ))}
            </select>
          </div>

          {/* Score Input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">
              Score <span className="text-red-500">*</span>
              {formData.unit && (
                <span className="text-gray-500 font-normal ml-2">
                  ({formData.unit.replace('_', ' ')})
                </span>
              )}
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: e.target.value })}
              placeholder="Enter your score"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {formData.metric_name && (
              <p className="text-sm text-gray-500 mt-1">
                {formData.metric_name.includes('bodyweight_ratio') &&
                  'Enter as ratio (e.g., 1.5 = 1.5x bodyweight)'}
                {formData.metric_name.includes('sec') &&
                  'Enter time in seconds'}
                {formData.metric_name.includes('reps') &&
                  'Enter number of repetitions'}
                {formData.metric_name.includes('inches') &&
                  'Enter distance in inches'}
              </p>
            )}
          </div>

          {/* Notes Input */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">
              Notes (optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="How did it feel? Any observations?"
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !formData.metric_name || !formData.score}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Saving...' : 'Save Test Result'}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Tip</h3>
          <p className="text-sm text-blue-800">
            Test regularly to track your progress! We recommend testing every 2-4 weeks to see meaningful improvements.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TestForm;
