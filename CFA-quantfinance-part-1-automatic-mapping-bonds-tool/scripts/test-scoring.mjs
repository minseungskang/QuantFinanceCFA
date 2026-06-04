import assert from "node:assert/strict";
import { scoreRecords, CREDIT_RATING_SCORES } from "../app/scoring.js";
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
assert.equal(scored.length, fixtureRecords.length);
assert.ok(sampleRecords.length >= 100);

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
assert.equal(alpha.dataConfidence, 100);
assert.equal(alpha.scoreBreakdown.sovereignRisk.components.creditRating.normalized, 100);
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
