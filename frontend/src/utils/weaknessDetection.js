// Import benchmark data
import benchmarks from '../../../backend/data/climbing-benchmarks.json';

const BOULDERING_GRADES = ['V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10'];

/**
 * Find weaknesses based on user's scores compared to benchmark data
 * @param {Array} userScores - Array of user's latest scores
 * @param {String} gender - 'male' or 'female'
 * @param {String} targetGrade - Target grade (e.g., 'V5')
 * @returns {Array} - Array of weaknesses sorted by severity
 */
export const findWeaknesses = (userScores, gender = 'male', climbingType = 'bouldering', targetGrade = 'V5') => {
  const categoryKey = `Bouldering_${gender.charAt(0).toUpperCase() + gender.slice(1)}`;
  const categoryData = benchmarks[categoryKey];

  if (!categoryData) {
    console.error('Invalid category:', categoryKey);
    return [];
  }

  const gradeIndex = BOULDERING_GRADES.indexOf(targetGrade);
  const nextGrade = gradeIndex !== -1 && gradeIndex < BOULDERING_GRADES.length - 1
    ? BOULDERING_GRADES[gradeIndex + 1]
    : null;

  const weaknesses = [];

  userScores.forEach(userScore => {
    let benchmarkFound = false;

    Object.keys(categoryData).forEach(metricCategory => {
      const metrics = categoryData[metricCategory];

      if (metrics[userScore.metric_name] && metrics[userScore.metric_name][targetGrade]) {
        benchmarkFound = true;
        const benchmark = metrics[userScore.metric_name][targetGrade];
        const userValue = parseFloat(userScore.score);

        const nextBenchmark = nextGrade && metrics[userScore.metric_name][nextGrade];
        const threshold = nextBenchmark ? nextBenchmark.lower_bound : benchmark.upper_bound;
        const nextUpperBound = nextBenchmark ? nextBenchmark.upper_bound : null;

        const isWeakness = userValue < threshold;
        const isExceeding = nextUpperBound !== null && userValue > nextUpperBound;
        const severity = isWeakness ? threshold - userValue : 0;

        const range = benchmark.upper_bound - benchmark.lower_bound;
        const percentile = range > 0
          ? Math.round(((userValue - benchmark.lower_bound) / range) * 100)
          : 100;

        weaknesses.push({
          metric_name: userScore.metric_name,
          user_score: userValue,
          benchmark_low: benchmark.lower_bound,
          benchmark_high: benchmark.upper_bound,
          percentile,
          is_weakness: isWeakness,
          is_exceeding: isExceeding,
          severity,
          unit: userScore.unit,
          category: metricCategory
        });
      }
    });

    if (!benchmarkFound) {
      console.warn(`No benchmark found for metric: ${userScore.metric_name}`);
    }
  });

  return weaknesses.sort((a, b) => b.severity - a.severity);
};

/**
 * Get grade recommendations based on user's overall performance
 * @param {Array} weaknessData - Weakness analysis data
 * @returns {Object} - Grade recommendations
 */
export const getGradeRecommendation = (weaknessData) => {
  if (!weaknessData || weaknessData.length === 0) {
    return {
      currentLevel: 'Unknown',
      recommendation: 'Add test results to get recommendations'
    };
  }

  const weaknessCount = weaknessData.filter(w => w.is_weakness).length;
  const totalMetrics = weaknessData.length;

  const recommendation = weaknessCount === 0
    ? 'You\'re strong enough for this level!'
    : `You have ${weaknessCount} weakness${weaknessCount > 1 ? 'es' : ''} to work on.`;

  return {
    recommendation,
    weaknessCount,
    totalMetrics
  };
};

/**
 * Format metric name for display
 * @param {String} metricName - Raw metric name from database
 * @returns {String} - Formatted display name
 */
export const formatMetricName = (metricName) => {
  return metricName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim();
};
