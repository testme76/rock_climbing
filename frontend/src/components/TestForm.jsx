import { useState } from 'react';
import { saveTestResult } from '../services/api';

const METRICS = [
  { name: 'Max_Hang_Str_Wt_20mm_10sec', label: 'Max Hang Strength (20mm, 10sec)', unit: 'bodyweight_ratio', isRatio: true, hint: 'Extra weight added (lbs or kg)' },
  { name: 'Weighted_Pull_Up_Str_Wt_1RM', label: 'Weighted Pull-Up (1RM)', unit: 'bodyweight_ratio', isRatio: true, hint: 'Extra weight added (lbs or kg)' },
  { name: 'Repeaters_7_3_Bodyweight_20mm_sec', label: '7:3 Repeaters (20mm)', unit: 'sec', hint: 'Enter time in seconds' },
  { name: 'Continuous_Hang_Time_20mm_sec', label: 'Continuous Hang Time (20mm)', unit: 'sec', hint: 'Enter time in seconds' },
  { name: 'Max_Pull_Ups_reps', label: 'Max Pull-Ups', unit: 'reps', hint: 'Enter number of repetitions' },
  { name: 'Max_Push_Ups_reps', label: 'Max Push-Ups', unit: 'reps', hint: 'Enter number of repetitions' },
];

const initialScores = () => Object.fromEntries(METRICS.map(m => [m.name, '']));

function TestForm({ onSuccess }) {
  const [bodyWeight, setBodyWeight] = useState('');
  const [scores, setScores] = useState(initialScores());
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const filled = METRICS.filter(m => scores[m.name] !== '');
    if (filled.length === 0) {
      setError('Enter at least one score before saving.');
      return;
    }
    const hasRatio = filled.some(m => m.isRatio);
    if (hasRatio && !bodyWeight) {
      setError('Enter your body weight to calculate the ratio for weighted exercises.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await Promise.all(filled.map(m => {
        const score = m.isRatio
          ? (parseFloat(bodyWeight) + parseFloat(scores[m.name])) / parseFloat(bodyWeight)
          : parseFloat(scores[m.name]);
        return saveTestResult({ metric_name: m.name, score, unit: m.unit, notes: notes || null });
      }));

      setSuccess(true);
      setScores(initialScores());
      setNotes('');

      if (onSuccess) setTimeout(() => onSuccess(), 1000);
    } catch (err) {
      console.error('Error saving test results:', err);
      setError(err.response?.data?.error || 'Failed to save test results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Add New Test Results</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            Test results saved successfully!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Body Weight */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-1">
              Body Weight <span className="text-gray-400 font-normal">(required for weighted exercises)</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={bodyWeight}
              onChange={(e) => setBodyWeight(e.target.value)}
              placeholder="Your body weight (lbs or kg)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-4 mb-6">
            {METRICS.map(metric => (
              <div key={metric.name}>
                <label className="block text-sm font-semibold mb-1">
                  {metric.label}
                  <span className="text-gray-400 font-normal ml-2">
                    {metric.isRatio ? '(extra weight added)' : `(${metric.unit.replace(/_/g, ' ')})`}
                  </span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={scores[metric.name]}
                  onChange={(e) => setScores({ ...scores, [metric.name]: e.target.value })}
                  placeholder={metric.hint}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {metric.isRatio && scores[metric.name] !== '' && bodyWeight !== '' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Ratio: {((parseFloat(bodyWeight) + parseFloat(scores[metric.name])) / parseFloat(bodyWeight)).toFixed(2)}x bodyweight
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it feel? Any observations?"
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Saving...' : 'Save Results'}
          </button>
        </form>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Tip</h3>
          <p className="text-sm text-blue-800">
            Leave any metric blank to skip it. We recommend testing every 2-4 weeks to see meaningful improvements.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TestForm;
