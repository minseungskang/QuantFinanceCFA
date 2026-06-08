# Scoring Model

## Model Positioning

The app uses a transparent scoring model. It is intended to help compare sovereign bonds by risk-adjusted attractiveness. It does not guarantee returns and does not replace professional investment advice.

## Top-Level Weights

- Bond Return & Liquidity: 35%
- Sovereign Risk: 65%

Total Score = weighted Bond Return & Liquidity score + weighted Sovereign Risk score.

## Bond Return & Liquidity Weights

Within the 35% category:

- Yield to Maturity: 0% scoring weight; shown as a raw reference field only
- Real Yield: 50%
- Liquidity / Bid-Ask Spread: 33.33%
- Bond Price / Discount: 16.67%

Real Yield = Yield to Maturity - Inflation Rate.

This avoids double counting nominal yield. The model scores inflation-adjusted return through Real Yield, while keeping YTM visible for auditability.

## Sovereign Risk Weights

Within the 65% category:

- Credit Rating: 31.11%
- CDS Spread: 17.78%
- Debt-to-GDP: 15.56%
- Fiscal Deficit-to-GDP: 13.33%
- Inflation Rate: 0% scoring weight; shown as a raw input to Real Yield only
- Exchange Rate Volatility: 10.00%
- Foreign Exchange Reserves: 8.89%
- Policy Interest Rate: 2.22%
- Gold Reserves: 1.11%

Inflation Rate is not separately scored in the Sovereign Risk category in this pass because it already affects Real Yield. A future model can add inflation stability or central-bank credibility as separate risk indicators when those fields exist.

## Indicator Direction

Higher is better:

- Real Yield
- Foreign Exchange Reserves
- Gold Reserves

Shown as reference only in the current scoring pass:

- Yield to Maturity

Lower is better:

- Debt-to-GDP
- Fiscal Deficit-to-GDP
- Policy Interest Rate
- Exchange Rate Volatility
- CDS Spread
- Liquidity / Bid-Ask Spread

Used as an input to Real Yield, but not separately scored in the current scoring pass:

- Inflation Rate

Mapped by rating quality:

- Credit Rating

## Credit Rating Mapping

Use a clear numeric mapping where AAA is highest and D is lowest.

Initial mapping should include common long-term sovereign rating labels:

- AAA
- AA+
- AA
- AA-
- A+
- A
- A-
- BBB+
- BBB
- BBB-
- BB+
- BB
- BB-
- B+
- B
- B-
- CCC+
- CCC
- CCC-
- CC
- C
- D

Exact numeric values should be implemented in the scoring engine and tested.

## Normalization

Each scored numeric indicator should be normalized to a comparable 0-100 scale.

For higher-is-better indicators, higher normalized values should increase score.

For lower-is-better indicators, lower raw values should increase score.

The current implementation uses a hybrid approach:

- Real Yield uses a fixed piecewise benchmark.
- Other active numeric indicators use winsorized min-max normalization.

## Real Yield Fixed Benchmark

Real Yield is scored with fixed financial thresholds instead of sample-relative percentiles.

- -2% or lower = 0
- 0% = 30
- 2% = 55
- 4% = 75
- 6% = 90
- 8% or higher = 100

Values between these points are linearly interpolated.

This prevents a stable low-risk country from receiving an excessively low Real Yield score only because the current sample includes many high-yield, high-risk countries.

## Winsorized Min-Max Normalization

Winsorized min-max reduces outlier distortion:

- Values below P5 are capped at P5.
- Values above P95 are capped at P95.
- Scores are then linearly scaled between P5 and P95.

The UI must show the active benchmark for each normalized indicator:

- For Real Yield: show the fixed benchmark points.
- For higher-is-better indicators: P95 = 100, P5 = 0.
- For lower-is-better indicators: P5 = 100, P95 = 0.
- For mapped indicators such as credit rating: show the rating scale benchmark, such as AAA = 100 and D = 0.

This makes scores auditable. For example, if the current sample dataset has 10Y yield P5 near 1.40% and P95 near 4.46%, then 4.46% maps to 100, 1.40% maps to 0, and 3.00% maps to about 52.3.

## Missing Data

Missing fields must not automatically score as zero.

If a country is missing one or more indicators, recalculate the score using the available indicator weights within the relevant category.

Show a Data Confidence value that reflects how much of the model's total weight had usable data.

## Weight Editing

The UI should show two weight levels:

- Category Weight
- Indicator Weight within Category

When weights are editable, totals should remain valid and understandable.
