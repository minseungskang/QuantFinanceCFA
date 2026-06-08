export const DEFAULT_WEIGHTS = {
  categories: {
    bondReturnLiquidity: 0.35,
    sovereignRisk: 0.65
  },
  indicators: {
    bondReturnLiquidity: {
      yieldToMaturity: 0,
      realYield: 0.5,
      liquidityBidAskSpread: 0.3333333333,
      bondPriceDiscount: 0.1666666667
    },
    sovereignRisk: {
      creditRating: 0.3111111111,
      cdsSpread: 0.1777777778,
      debtToGdp: 0.1555555556,
      fiscalDeficitToGdp: 0.1333333333,
      inflationRate: 0,
      exchangeRateVolatility: 0.1,
      foreignExchangeReserves: 0.0888888889,
      policyInterestRate: 0.0222222222,
      goldReserves: 0.0111111111
    }
  }
};

export const CREDIT_RATING_SCORES = {
  AAA: 100,
  "AA+": 95,
  AA: 90,
  "AA-": 85,
  "A+": 80,
  A: 75,
  "A-": 70,
  "BBB+": 65,
  BBB: 60,
  "BBB-": 55,
  "BB+": 50,
  BB: 45,
  "BB-": 40,
  "B+": 35,
  B: 30,
  "B-": 25,
  "CCC+": 20,
  CCC: 15,
  "CCC-": 10,
  CC: 7,
  C: 4,
  D: 0
};

export const NORMALIZATION_CONFIG = {
  method: "winsorized-min-max",
  lowerPercentile: 0.05,
  upperPercentile: 0.95
};

export const FIXED_BENCHMARKS = {
  realYield: {
    method: "fixed-piecewise",
    direction: "higher",
    points: [
      { rawValue: -2, score: 0 },
      { rawValue: 0, score: 30 },
      { rawValue: 2, score: 55 },
      { rawValue: 4, score: 75 },
      { rawValue: 6, score: 90 },
      { rawValue: 8, score: 100 }
    ]
  }
};

const INDICATOR_DEFINITIONS = {
  yieldToMaturity: { category: "bondReturnLiquidity", direction: "higher" },
  realYield: { category: "bondReturnLiquidity", direction: "higher" },
  liquidityBidAskSpread: { category: "bondReturnLiquidity", direction: "lower" },
  bondPriceDiscount: { category: "bondReturnLiquidity", direction: "higher" },
  creditRating: { category: "sovereignRisk", direction: "mapped" },
  cdsSpread: { category: "sovereignRisk", direction: "lower" },
  debtToGdp: { category: "sovereignRisk", direction: "lower" },
  fiscalDeficitToGdp: { category: "sovereignRisk", direction: "lower" },
  inflationRate: { category: "sovereignRisk", direction: "lower" },
  exchangeRateVolatility: { category: "sovereignRisk", direction: "lower" },
  foreignExchangeReserves: { category: "sovereignRisk", direction: "higher" },
  policyInterestRate: { category: "sovereignRisk", direction: "lower" },
  goldReserves: { category: "sovereignRisk", direction: "higher" }
};

function isUsableNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function percentile(values, percentileValue) {
  if (values.length === 0) return null;
  if (values.length === 1) return values[0];

  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * percentileValue;
  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);

  if (lowerIndex === upperIndex) return sorted[lowerIndex];

  const weight = index - lowerIndex;
  return sorted[lowerIndex] * (1 - weight) + sorted[upperIndex] * weight;
}

function getRealYield(record) {
  if (!isUsableNumber(record.yieldToMaturity) || !isUsableNumber(record.inflationRate)) {
    return null;
  }

  return record.yieldToMaturity - record.inflationRate;
}

function getBondPriceDiscount(record) {
  if (!isUsableNumber(record.bondPrice)) {
    return null;
  }

  return 100 - record.bondPrice;
}

function getRawIndicatorValue(record, indicator) {
  if (indicator === "realYield") return getRealYield(record);
  if (indicator === "bondPriceDiscount") return getBondPriceDiscount(record);
  if (indicator === "creditRating") return CREDIT_RATING_SCORES[record.creditRating] ?? null;
  return record[indicator] ?? null;
}

function normalizeValue(value, min, max, direction) {
  if (!isUsableNumber(value)) return null;
  if (direction === "mapped") return value;
  if (min === max) return 50;

  const cappedValue = clamp(value, min, max);
  const normalized = ((cappedValue - min) / (max - min)) * 100;
  return direction === "lower" ? 100 - normalized : normalized;
}

function normalizePiecewiseValue(value, points) {
  if (!isUsableNumber(value)) return null;
  if (!Array.isArray(points) || points.length === 0) return null;

  const sortedPoints = [...points].sort((a, b) => a.rawValue - b.rawValue);
  const firstPoint = sortedPoints[0];
  const lastPoint = sortedPoints[sortedPoints.length - 1];

  if (value <= firstPoint.rawValue) return firstPoint.score;
  if (value >= lastPoint.rawValue) return lastPoint.score;

  for (let index = 0; index < sortedPoints.length - 1; index += 1) {
    const currentPoint = sortedPoints[index];
    const nextPoint = sortedPoints[index + 1];

    if (value >= currentPoint.rawValue && value <= nextPoint.rawValue) {
      const distance = nextPoint.rawValue - currentPoint.rawValue;
      const ratio = distance === 0 ? 0 : (value - currentPoint.rawValue) / distance;
      return currentPoint.score + ratio * (nextPoint.score - currentPoint.score);
    }
  }

  return null;
}

function getFixedBenchmark(indicator) {
  const benchmark = FIXED_BENCHMARKS[indicator];
  if (!benchmark) return null;

  const sortedPoints = [...benchmark.points].sort((a, b) => a.rawValue - b.rawValue);
  const zeroPoint = sortedPoints[0];
  const hundredPoint = sortedPoints[sortedPoints.length - 1];

  return {
    ...benchmark,
    zeroScoreValue: zeroPoint.rawValue,
    hundredScoreValue: hundredPoint.rawValue,
    points: sortedPoints
  };
}

function getBenchmark(range) {
  if (!range || range.min === null || range.max === null) {
    return { zeroScoreValue: null, hundredScoreValue: null, direction: null };
  }

  if (range.direction === "lower") {
    return {
      zeroScoreValue: range.max,
      hundredScoreValue: range.min,
      direction: range.direction,
      method: NORMALIZATION_CONFIG.method,
      lowerPercentile: NORMALIZATION_CONFIG.lowerPercentile,
      upperPercentile: NORMALIZATION_CONFIG.upperPercentile
    };
  }

  return {
    zeroScoreValue: range.min,
    hundredScoreValue: range.max,
    direction: range.direction,
    method: NORMALIZATION_CONFIG.method,
    lowerPercentile: NORMALIZATION_CONFIG.lowerPercentile,
    upperPercentile: NORMALIZATION_CONFIG.upperPercentile
  };
}

function buildRanges(records) {
  const ranges = {};

  for (const [indicator, definition] of Object.entries(INDICATOR_DEFINITIONS)) {
    const values = records
      .map((record) => getRawIndicatorValue(record, indicator))
      .filter(isUsableNumber);

    ranges[indicator] = {
      min: values.length ? percentile(values, NORMALIZATION_CONFIG.lowerPercentile) : null,
      max: values.length ? percentile(values, NORMALIZATION_CONFIG.upperPercentile) : null,
      direction: definition.direction
    };
  }

  return ranges;
}

function scoreCategory(record, category, ranges, weights = DEFAULT_WEIGHTS) {
  const indicators = weights.indicators[category];
  let weightedScore = 0;
  let usedWeight = 0;
  let possibleWeight = 0;
  const components = {};

  for (const [indicator, indicatorWeight] of Object.entries(indicators)) {
    possibleWeight += indicatorWeight;

    const range = ranges[indicator];
    const fixedBenchmark = getFixedBenchmark(indicator);
    const rawValue = getRawIndicatorValue(record, indicator);
    const hasRange = range && range.min !== null && range.max !== null;
    const normalized = fixedBenchmark
      ? normalizePiecewiseValue(rawValue, fixedBenchmark.points)
      : hasRange
      ? normalizeValue(rawValue, range.min, range.max, range.direction)
      : null;

    components[indicator] = {
      rawValue,
      normalized: normalized === null ? null : round(normalized),
      weight: indicatorWeight,
      benchmark: fixedBenchmark || getBenchmark(range)
    };

    if (normalized === null) continue;

    weightedScore += normalized * indicatorWeight;
    usedWeight += indicatorWeight;
  }

  return {
    score: usedWeight > 0 ? weightedScore / usedWeight : null,
    usedWeight,
    possibleWeight,
    components
  };
}

export function scoreRecords(records, weights = DEFAULT_WEIGHTS) {
  const ranges = buildRanges(records);

  const scored = records.map((record) => {
    const bondCategory = scoreCategory(record, "bondReturnLiquidity", ranges, weights);
    const riskCategory = scoreCategory(record, "sovereignRisk", ranges, weights);

    const weightedCategories = [
      {
        category: "bondReturnLiquidity",
        result: bondCategory,
        weight: weights.categories.bondReturnLiquidity
      },
      {
        category: "sovereignRisk",
        result: riskCategory,
        weight: weights.categories.sovereignRisk
      }
    ];

    let totalWeightedScore = 0;
    let usedCategoryWeight = 0;
    let usedModelWeight = 0;

    for (const item of weightedCategories) {
      if (item.result.score === null) continue;
      totalWeightedScore += item.result.score * item.weight;
      usedCategoryWeight += item.weight;
      usedModelWeight += item.weight * item.result.usedWeight;
    }

    const weightedScore = usedCategoryWeight > 0 ? totalWeightedScore / usedCategoryWeight : null;

    return {
      ...record,
      realYield: getRealYield(record),
      weightedScore: weightedScore === null ? null : round(weightedScore, 4),
      totalScore: weightedScore === null ? null : weightedScore,
      dataConfidence: round(usedModelWeight * 100),
      scoreBreakdown: {
        bondReturnLiquidity: {
          score: bondCategory.score === null ? null : round(bondCategory.score),
          components: bondCategory.components
        },
        sovereignRisk: {
          score: riskCategory.score === null ? null : round(riskCategory.score),
          components: riskCategory.components
        }
      }
    };
  });

  const scoredWithWeights = scored.filter((record) => isUsableNumber(record.weightedScore));
  const availableWeightedScores = scoredWithWeights.map((record) => record.weightedScore);
  const meanWeightedScore =
    availableWeightedScores.length > 0
      ? availableWeightedScores.reduce((sum, value) => sum + value, 0) / availableWeightedScores.length
      : null;
  const variance =
    availableWeightedScores.length > 0
      ? availableWeightedScores.reduce((sum, value) => sum + (value - meanWeightedScore) ** 2, 0) /
        availableWeightedScores.length
      : null;
  const standardDeviation = variance !== null ? Math.sqrt(variance) : null;

  const final = scored.map((record) => {
    let finalScore = null;
    if (
      isUsableNumber(record.weightedScore) &&
      isUsableNumber(meanWeightedScore) &&
      isUsableNumber(standardDeviation) &&
      standardDeviation > 0
    ) {
      const z = (record.weightedScore - meanWeightedScore) / standardDeviation;
      finalScore = 100 / (1 + Math.exp(-z));
    }

    return {
      ...record,
      totalScore: finalScore === null ? null : round(finalScore)
    };
  });

  return final;
}
