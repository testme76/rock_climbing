// Import benchmark data
import benchmarks from '../../../backend/data/climbing-benchmarks.json';

/**
 * Find weaknesses based on user's scores compared to benchmark data
 * @param {Array} userScores - Array of user's latest scores
 * @param {String} gender - 'male' or 'female'
 * @param {String} climbingType - 'bouldering' or 'sport_climbing'
 * @param {String} targetGrade - Target grade (e.g., 'V5', '5.11a/b')
 * @returns {Array} - Array of weaknesses sorted by severity
 */
export const findWeaknesses = (userScores, gender = 'male', climbingType = 'bouldering', targetGrade = 'V5') => {
  // Build category key (e.g., 'Bouldering_Male')
  const categoryKey = `${climbingType === 'bouldering' ? 'Bouldering' : 'Sport_Climbing'}_${gender.charAt(0).toUpperCase() + gender.slice(1)}`;

  const categoryData = benchmarks[categoryKey];

  if (!categoryData) {
    console.error('Invalid category:', categoryKey);
    return [];
  }

  const weaknesses = [];

  // Iterate through user's scores
  userScores.forEach(userScore => {
    // Find the benchmark for this metric
    let benchmarkFound = false;

    // Search through all metric categories
    Object.keys(categoryData).forEach(metricCategory => {
      const metrics = categoryData[metricCategory];

      if (metrics[userScore.metric_name] && metrics[userScore.metric_name][targetGrade]) {
        benchmarkFound = true;
        const benchmark = metrics[userScore.metric_name][targetGrade];
        const userValue = parseFloat(userScore.score);

        // Calculate where user falls in the benchmark range
        const range = benchmark.upper_bound - benchmark.lower_bound;
        const userPosition = userValue - benchmark.lower_bound;
        const percentile = (userPosition / range) * 100;

        // Determine if this is a weakness (below 50th percentile)
        const isWeakness = percentile < 50;
        const belowMidpoint = benchmark.lower_bound + (range / 2) - userValue;

        weaknesses.push({
          metric_name: userScore.metric_name,
          user_score: userValue,
          benchmark_low: benchmark.lower_bound,
          benchmark_high: benchmark.upper_bound,
          benchmark_mid: benchmark.lower_bound + (range / 2),
          percentile: Math.round(percentile),
          is_weakness: isWeakness,
          severity: belowMidpoint > 0 ? belowMidpoint : 0,
          unit: userScore.unit,
          category: metricCategory
        });
      }
    });

    if (!benchmarkFound) {
      console.warn(`No benchmark found for metric: ${userScore.metric_name}`);
    }
  });

  // Sort by severity (most severe first)
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

  // Calculate average percentile
  const avgPercentile = weaknessData.reduce((sum, w) => sum + w.percentile, 0) / weaknessData.length;

  // Count weaknesses
  const weaknessCount = weaknessData.filter(w => w.is_weakness).length;
  const totalMetrics = weaknessData.length;
  const weaknessRatio = weaknessCount / totalMetrics;

  let recommendation = '';

  if (avgPercentile >= 75 && weaknessRatio < 0.3) {
    recommendation = 'You\'re performing well! Consider moving up a grade.';
  } else if (avgPercentile >= 50 && weaknessRatio < 0.5) {
    recommendation = 'You\'re at the right level. Focus on addressing weaknesses.';
  } else {
    recommendation = 'Work on your weak areas before progressing to the next grade.';
  }

  return {
    currentLevel: `${Math.round(avgPercentile)}th percentile`,
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
