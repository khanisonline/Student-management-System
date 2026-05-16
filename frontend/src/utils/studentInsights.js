function toNumber(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function normalizeRiskLevel(riskLevel = '') {
  const normalizedValue = String(riskLevel).trim().toLowerCase();

  if (normalizedValue === 'moderate') {
    return 'Medium';
  }

  if (normalizedValue === 'low' || normalizedValue === 'medium' || normalizedValue === 'high') {
    return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1);
  }

  return riskLevel || 'Unknown';
}

export function getRiskTone(riskLevel = '') {
  const normalizedRiskLevel = normalizeRiskLevel(riskLevel);

  if (normalizedRiskLevel === 'High') {
    return 'danger';
  }

  if (normalizedRiskLevel === 'Medium') {
    return 'warning';
  }

  if (normalizedRiskLevel === 'Low') {
    return 'success';
  }

  return 'neutral';
}

export function buildStudentInsightFallback(dashboard) {
  const averageMarks = toNumber(dashboard?.summary?.averageMarks);
  const attendance = toNumber(dashboard?.summary?.attendancePercent);
  const pendingAssignments = toNumber(dashboard?.summary?.pendingAssignments);
  const marksByCourse = dashboard?.charts?.marksByCourse || [];

  const sortedByScore = [...marksByCourse].sort((left, right) => toNumber(left.value) - toNumber(right.value));
  const weakSubjects = sortedByScore.slice(0, 2).map((item) => item.label).filter(Boolean);
  const strongSubjects = [...sortedByScore].reverse().slice(0, 2).map((item) => item.label).filter(Boolean);

  const riskLevel =
    averageMarks < 40 || attendance < 60
      ? 'High'
      : averageMarks < 70 || attendance < 75 || pendingAssignments > 0
        ? 'Medium'
        : 'Low';

  return {
    overview: {
      performance: averageMarks >= 70 ? 'Good' : averageMarks >= 45 ? 'Stable' : 'Needs attention',
      riskLevel,
      summary: 'Live insight generation is unavailable right now. Showing a calculated academic snapshot.',
    },
    stats: {
      avgMarks: Number(averageMarks.toFixed(1)),
      attendance: Number(attendance.toFixed(1)),
    },
    subjects: {
      weak: weakSubjects,
      strong: strongSubjects,
    },
    recommendations: [
      weakSubjects.length ? `Focus revision time on ${weakSubjects.join(', ')}.` : 'Keep a steady revision plan across all subjects.',
      attendance < 75 ? 'Raise attendance above 75% to improve academic stability.' : 'Maintain your current attendance consistency.',
      pendingAssignments > 0 ? `Complete ${pendingAssignments} pending assignment(s) as early as possible.` : 'Keep submitting assignments on time.',
    ],
    alerts: [
      attendance < 75 ? 'Attendance is below the preferred threshold.' : null,
      averageMarks < 40 ? 'Average marks are in the high-risk zone.' : null,
      pendingAssignments > 0 ? `${pendingAssignments} assignment(s) are still pending.` : null,
    ].filter(Boolean),
    trend: averageMarks >= 70 ? 'Improving' : averageMarks < 40 ? 'Declining' : 'Stable',
  };
}
