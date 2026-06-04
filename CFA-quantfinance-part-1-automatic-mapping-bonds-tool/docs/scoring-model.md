# Scoring Model

## Model Positioning

The app uses a transparent scoring model. It is intended to help compare sovereign bonds by risk-adjusted attractiveness. It does not guarantee returns and does not replace professional investment advice.

## Top-Level Weights

- Bond Return & Liquidity: 35%
- Sovereign Risk: 65%

Total Score = weighted Bond Return & Liquidity score + weighted Sovereign Risk score.

## Bond Return & Liquidity Weights

Within the 35% category:

- Yield to Maturity: 40%
- Real Yield: 30%
- Liquidity / Bid-Ask Spread: 20%
- Bond Price / Discount: 10%

Real Yield = Yield to Maturity - Inflation Rate.

## Sovereign Risk Weights

Within the 65% category:

- Credit Rating: 28%
- CDS Spread: 16%
- Debt-to-GDP: 14%
- Fiscal Deficit-to-GDP: 12%
- Inflation Rate: 10%
- Exchange Rate Volatility: 9%
- Foreign Exchange Reserves: 8%
- Policy Interest Rate: 2%
- Gold Reserves: 1%

## Indicator Direction

Higher is better:

- Yield to Maturity
- Real Yield
- Foreign Exchange Reserves
- Gold Reserves

Lower is better:

- Debt-to-GDP
- Fiscal Deficit-to-GDP
- Inflation Rate
- Policy Interest Rate
- Exchange Rate Volatility
- CDS Spread
- Liquidity / Bid-Ask Spread

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

Each numeric indicator should be normalized to a comparable 0-100 scale.

For higher-is-better indicators, higher normalized values should increase score.

For lower-is-better indicators, lower raw values should increase score.

The first implementation uses winsorized min-max normalization, with the scoring logic kept isolated so future methods can be added.

Winsorized min-max reduces outlier distortion:

- Values below P5 are capped at P5.
- Values above P95 are capped at P95.
- Scores are then linearly scaled between P5 and P95.

The UI must show the active benchmark for each normalized indicator:

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
