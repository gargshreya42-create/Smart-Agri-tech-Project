// Rule-based soil health scoring. Nutrient ranges follow commonly used Indian soil-fertility
// ratings (available N / P / K in kg/ha). This is guidance only — not a laboratory diagnosis.

const PARAMETERS = {
  ph: { label: 'pH', weight: 20, optimal: [6.0, 7.5], zeroAt: [4.5, 9.0] },
  nitrogen: { label: 'Nitrogen', weight: 20, optimal: [300, 560], zeroAt: [0, 1000] },
  phosphorus: { label: 'Phosphorus', weight: 15, optimal: [15, 45], zeroAt: [0, 100] },
  potassium: { label: 'Potassium', weight: 15, optimal: [150, 400], zeroAt: [0, 800] },
  moisture: { label: 'Moisture', weight: 15, optimal: [35, 65], zeroAt: [5, 95] },
  organicMatter: { label: 'Organic matter', weight: 15, optimal: [2.5, 6], zeroAt: [0, 15] },
};

const ADVICE = {
  ph: {
    low: 'Soil is acidic. Apply agricultural lime or dolomite as per a local soil-test recommendation and add well-decomposed compost.',
    high: 'Soil is alkaline. Gypsum, elemental sulphur and plenty of organic matter can help; avoid over-liming and use acid-forming fertilisers carefully.',
  },
  nitrogen: {
    low: 'Available nitrogen is low. Apply nitrogen in split doses (urea or organic manure) and include a legume in your crop rotation.',
    high: 'Nitrogen is high. Reduce nitrogen fertiliser to avoid soft growth, pest pressure and nutrient loss.',
  },
  phosphorus: {
    low: 'Phosphorus is low. Apply DAP or SSP as a basal dose and mix in compost or vermicompost.',
    high: 'Phosphorus is high. Skip phosphatic fertiliser this season.',
  },
  potassium: {
    low: 'Potassium is low. Apply muriate of potash (MOP) or compost/wood ash; potassium supports grain filling and disease resistance.',
    high: 'Potassium is high. Hold back potash fertiliser for now.',
  },
  moisture: {
    low: 'Soil moisture is low. Irrigate soon and use mulch to cut evaporation.',
    high: 'Soil is very wet. Improve drainage, delay irrigation and watch for root rot.',
  },
  organicMatter: {
    low: 'Organic matter is low. Add farmyard manure or compost, grow a green-manure crop (dhaincha or sunhemp) and keep crop residue in the field.',
    high: 'Organic matter is very high. Check that nutrients are well balanced.',
  },
};

const DISCLAIMER =
  'These insights are rule-based guidance from the values you entered. They are not a laboratory diagnosis — confirm fertiliser doses with a soil-testing lab or your local agriculture office.';

function statusFromScore(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Moderate';
  if (score >= 30) return 'Poor';
  return 'Critical';
}

// 100 inside the optimal band, falling linearly to 0 at the "zeroAt" bounds.
function scoreValue(value, { optimal: [low, high], zeroAt: [zeroLow, zeroHigh] }) {
  if (value >= low && value <= high) return 100;
  if (value < low) return Math.max(0, Math.round((100 * (value - zeroLow)) / (low - zeroLow)));
  return Math.max(0, Math.round((100 * (zeroHigh - value)) / (zeroHigh - high)));
}

function analyse(values) {
  const parameters = {};
  const recommendations = [];
  let weighted = 0;
  let totalWeight = 0;

  Object.entries(PARAMETERS).forEach(([key, config]) => {
    const value = Number(values[key]);
    const score = scoreValue(value, config);
    const status = statusFromScore(score);
    parameters[key] = { value, score, status };
    weighted += score * config.weight;
    totalWeight += config.weight;

    const [low, high] = config.optimal;
    const direction = value < low ? 'low' : value > high ? 'high' : null;
    if (direction && score < 85) {
      recommendations.push({
        parameter: key,
        severity: score < 30 ? 'danger' : score < 70 ? 'warning' : 'info',
        message: ADVICE[key][direction],
      });
    }
  });

  const overallScore = Math.round(weighted / totalWeight);
  if (recommendations.length === 0) {
    recommendations.push({ parameter: 'overall', severity: 'success', message: 'All readings are in a healthy range. Keep up your current soil-care practices.' });
  }

  return { overallScore, overallStatus: statusFromScore(overallScore), parameters, recommendations };
}

module.exports = { analyse, statusFromScore, scoreValue, PARAMETERS, DISCLAIMER };
