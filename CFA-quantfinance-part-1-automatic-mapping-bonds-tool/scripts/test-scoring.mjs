import assert from "node:assert/strict";
import { scoreRecords, CREDIT_RATING_SCORES, DEFAULT_WEIGHTS, FIXED_BENCHMARKS } from "../app/scoring.js";
import { sampleRecords } from "../app/sample-data.js";

const fixtureRecords = [
  {
    country: "Alpha Safe",
    region: "Test",
    bondName: "Alpha 10Y Bond",
    currency: "ALP",
    maturity: "10Y",
    couponRate: 3,
    bondPrice: 99,
    yieldToMaturity: 3,
    creditRating: "AAA",
    debtToGdp: 40,
    fiscalDeficitToGdp: 1,
    inflationRate: 2,
    policyInterestRate: 3,
    exchangeRateVolatility: 5,
    foreignExchangeReserves: 1000,
    goldReserves: 8000,
    cdsSpread: 10,
    liquidityBidAskSpread: 0.02
  },
  {
    country: "Beta Middle",
    region: "Test",
    bondName: "Beta 10Y Bond",
    currency: "BET",
    maturity: "10Y",
    couponRate: 5,
    bondPrice: 95,
    yieldToMaturity: 5,
    creditRating: "BBB",
    debtToGdp: 80,
    fiscalDeficitToGdp: 3,
    inflationRate: 3,
    policyInterestRate: 4,
    exchangeRateVolatility: 10,
    foreignExchangeReserves: 300,
    goldReserves: 1000,
    cdsSpread: 80,
    liquidityBidAskSpread: 0.06
  },
  {
    country: "Gamma Risk",
    region: "Test",
    bondName: "Gamma 10Y Bond",
    currency: "GAM",
    maturity: "10Y",
    couponRate: 8,
    bondPrice: 85,
    yieldToMaturity: 8,
    creditRating: "B",
    debtToGdp: 160,
    fiscalDeficitToGdp: 8,
    inflationRate: 7,
    policyInterestRate: 9,
    exchangeRateVolatility: 25,
    foreignExchangeReserves: 50,
    goldReserves: 100,
    cdsSpread: 350,
    liquidityBidAskSpread: 0.2
  }
];

const scored = scoreRecords(fixtureRecords);

assert.equal(CREDIT_RATING_SCORES.AAA, 100);
assert.equal(CREDIT_RATING_SCORES.D, 0);
assert.equal(DEFAULT_WEIGHTS.indicators.bondReturnLiquidity.yieldToMaturity, 0);
assert.equal(DEFAULT_WEIGHTS.indicators.bondReturnLiquidity.realYield, 0.5);
assert.equal(roundForTest(DEFAULT_WEIGHTS.indicators.bondReturnLiquidity.liquidityBidAskSpread), 0.3333);
assert.equal(roundForTest(DEFAULT_WEIGHTS.indicators.bondReturnLiquidity.bondPriceDiscount), 0.1667);
assert.equal(DEFAULT_WEIGHTS.indicators.sovereignRisk.inflationRate, 0);
assert.equal(roundForTest(DEFAULT_WEIGHTS.indicators.sovereignRisk.creditRating), 0.3111);
assert.equal(FIXED_BENCHMARKS.realYield.method, "fixed-piecewise");
assert.deepEqual(
  FIXED_BENCHMARKS.realYield.points.map((point) => [point.rawValue, point.score]),
  [
    [-2, 0],
    [0, 30],
    [2, 55],
    [4, 75],
    [6, 90],
    [8, 100]
  ]
);
assert.equal(scored.length, fixtureRecords.length);
assert.equal(sampleRecords.length, 88);
assert.equal(sampleRecords.filter((record) => record.bondType === "localCurrency").length, 48);
assert.equal(sampleRecords.filter((record) => record.bondType === "eurobond").length, 40);

for (const excludedCountry of [
  "Venezuela",
  "Sri Lanka",
  "Lebanon",
  "Ethiopia",
  "Ghana",
  "Zambia",
  "Zimbabwe",
  "Madagascar",
  "Burundi",
  "Solomon Islands",
  "Vanuatu",
  "Samoa",
  "Tonga",
  "Kiribati",
  "Marshall Islands"
]) {
  assert.equal(sampleRecords.some((record) => record.country === excludedCountry), false);
}

for (const country of ["China", "South Korea", "India", "Indonesia", "Thailand"]) {
  const sample = sampleRecords.find((record) => record.country === country);
  assert.ok(sample, `${country} should exist in sample records`);
  assert.equal(sample.yieldToMaturity, 5.61);
  assert.equal(sample.creditRating, "A+");
}

for (const record of scored) {
  assert.equal(typeof record.totalScore, "number");
  assert.ok(record.totalScore >= 0 && record.totalScore <= 100);
  assert.ok(record.dataConfidence > 0 && record.dataConfidence <= 100);
}

const alpha = scored.find((record) => record.country === "Alpha Safe");
const gamma = scored.find((record) => record.country === "Gamma Risk");
assert.ok(alpha);
assert.ok(gamma);
assert.equal(alpha.realYield, 1);
assert.equal(alpha.rating, undefined);
assert.equal(alpha.dataConfidence, 100);
assert.equal(alpha.scoreBreakdown.sovereignRisk.components.creditRating.normalized, 100);
assert.equal(alpha.scoreBreakdown.bondReturnLiquidity.components.yieldToMaturity.weight, 0);
assert.equal(alpha.scoreBreakdown.bondReturnLiquidity.components.yieldToMaturity.rawValue, 3);
assert.equal(alpha.scoreBreakdown.bondReturnLiquidity.components.realYield.weight, 0.5);
assert.equal(alpha.scoreBreakdown.bondReturnLiquidity.components.realYield.benchmark.method, "fixed-piecewise");
assert.equal(alpha.scoreBreakdown.bondReturnLiquidity.components.realYield.normalized, 42.5);
assert.equal(alpha.scoreBreakdown.sovereignRisk.components.inflationRate.weight, 0);
assert.equal(alpha.scoreBreakdown.sovereignRisk.components.inflationRate.rawValue, 2);
assert.equal(alpha.scoreBreakdown.bondReturnLiquidity.components.yieldToMaturity.benchmark.method, "winsorized-min-max");
assert.ok(
  alpha.scoreBreakdown.bondReturnLiquidity.components.yieldToMaturity.benchmark.hundredScoreValue >
    alpha.scoreBreakdown.bondReturnLiquidity.components.yieldToMaturity.benchmark.zeroScoreValue
);
assert.ok(
  alpha.scoreBreakdown.sovereignRisk.components.cdsSpread.benchmark.hundredScoreValue <
    alpha.scoreBreakdown.sovereignRisk.components.cdsSpread.benchmark.zeroScoreValue
);
assert.ok(alpha.totalScore > gamma.totalScore);

const benchmarkStabilityResult = scoreRecords([
  ...fixtureRecords,
  {
    country: "Stable 3 Percent Real Yield",
    region: "Test",
    currency: "STB",
    yieldToMaturity: 5,
    inflationRate: 2,
    creditRating: "AA",
    bondPrice: 98,
    liquidityBidAskSpread: 0.03,
    debtToGdp: 50,
    fiscalDeficitToGdp: 2,
    exchangeRateVolatility: 6,
    foreignExchangeReserves: 500,
    policyInterestRate: 3,
    goldReserves: 500,
    cdsSpread: 20
  }
]).find((record) => record.country === "Stable 3 Percent Real Yield");

assert.ok(benchmarkStabilityResult);
assert.equal(benchmarkStabilityResult.realYield, 3);
assert.equal(
  benchmarkStabilityResult.scoreBreakdown.bondReturnLiquidity.components.realYield.normalized,
  65
);

const missingHeavyRecord = {
  country: "Missing Data Test",
  region: "Test",
  currency: "TST",
  yieldToMaturity: 4,
  inflationRate: 2,
  creditRating: "BBB"
};

const missingResult = scoreRecords([...fixtureRecords, missingHeavyRecord]).find(
  (record) => record.country === "Missing Data Test"
);

assert.ok(missingResult);
assert.ok(missingResult.totalScore !== null);
assert.ok(missingResult.dataConfidence < 50);

const sorted = [...scored].sort((a, b) => b.totalScore - a.totalScore);
assert.equal(sorted[0].country, "Alpha Safe");

console.log("Scoring tests passed.");

function roundForTest(value) {
  return Math.round(value * 10000) / 10000;
}
