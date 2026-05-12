import benchmarks from '../../../backend/data/climbing-benchmarks.json';

const BOULDERING_GRADES = ['V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10'];

// Returns a fractional grade index representing where a value sits in the full grade ladder.
// e.g. 2.7 means "between V5 and V6, 70% of the way through V5's band"
// Returns -Infinity if below all grade bands, or the top of the last band if above.
const getGradeEquivalent = (value, metricBenchmarks) => {
  let gradeEquivalent = -Infinity;

  for (let i = 0; i < BOULDERING_GRADES.length; i++) {
    const band = metricBenchmarks[BOULDERING_GRADES[i]];
    if (!band) continue;

    const { lower_bound, upper_bound } = band;
    const range = upper_bound - lower_bound;

    if (value >= lower_bound) {
      const fraction = range > 0 ? Math.min((value - lower_bound) / range, 1) : 1;
      gradeEquivalent = i + fraction;
    }
  }

  return gradeEquivalent;
};

export const findWeaknesses = (userScores, gender = 'male', climbingType = 'bouldering', targetGrade = 'V5') => {
  const categoryKey = `Bouldering_${gender.charAt(0).toUpperCase() + gender.slice(1)}`;
  const categoryData = benchmarks[categoryKey];

  if (!categoryData) {
    console.error('Invalid category:', categoryKey);
    return [];
  }

  const targetGradeIndex = BOULDERING_GRADES.indexOf(targetGrade);
  const weaknesses = [];

  userScores.forEach(userScore => {
    let benchmarkFound = false;

    Object.keys(categoryData).forEach(metricCategory => {
      const metrics = categoryData[metricCategory];
      const metricBenchmarks = metrics[userScore.metric_name];

      if (!metricBenchmarks || !metricBenchmarks[targetGrade]) return;
      benchmarkFound = true;

      const userValue = parseFloat(userScore.score);
      const targetBand = metricBenchmarks[targetGrade];
      const gradeEquivalent = getGradeEquivalent(userValue, metricBenchmarks);

      // Positive = grades behind target, negative = grades ahead
      const gradeGap = targetGradeIndex - gradeEquivalent;

      const range = targetBand.upper_bound - targetBand.lower_bound;
      const percentile = range > 0
        ? Math.round(((userValue - targetBand.lower_bound) / range) * 100)
        : 100;

      weaknesses.push({
        metric_name: userScore.metric_name,
        user_score: userValue,
        benchmark_low: targetBand.lower_bound,
        benchmark_high: targetBand.upper_bound,
        percentile: Math.max(0, Math.min(100, percentile)),
        grade_equivalent: gradeEquivalent >= 0
          ? BOULDERING_GRADES[Math.floor(gradeEquivalent)]
          : 'Below ' + BOULDERING_GRADES[0],
        grade_gap: gradeGap,
        is_weakness: gradeGap > 0,
        is_exceeding: gradeGap < -0.5,
        severity: Math.max(0, gradeGap),
        unit: userScore.unit,
        category: metricCategory
      });
    });

    if (!benchmarkFound) {
      console.warn(`No benchmark found for metric: ${userScore.metric_name}`);
    }
  });

  // Sort by grade gap descending — most grades behind = most limiting weakness first
  return weaknesses.sort((a, b) => b.grade_gap - a.grade_gap);
};

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

export const formatMetricName = (metricName) => {
  return metricName
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim();
};
