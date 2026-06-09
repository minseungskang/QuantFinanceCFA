# Requirements

## Product Goal

Build a Mac/Windows desktop app that helps the user compare sovereign bonds using a transparent scoring table. The app should rank a curated eligible universe of representative 10-year sovereign bonds by risk-adjusted attractiveness, with support for local-currency bonds and Eurobonds.

The current demo universe is based on the June 2026 103-country bond-availability check workbook. The visible ranking excludes countries with no 10-year sovereign bond and countries marked as default/restructuring. The demo keeps 88 comparable records: 48 active local-currency 10-year bonds and 40 Eurobond / weak-local-market sovereign bond records.

The app is a decision-support tool, not an investment adviser.

## Target User

The primary user is a non-technical person who wants a clear, editable, local tool for comparing sovereign bond opportunities.

The interface should be English-first, simple, and table-centered.

## Core User Flows

1. View a sovereign bond scoring table.
2. Search for a country or bond.
3. Filter countries by bond type and region.
4. Sort by score from high to low or low to high.
5. Browse countries in A-Z groups.
6. Expand a country row to inspect detailed indicators.
7. Edit bond and country metrics manually.
8. Save edits or import data to automatically recalculate scores.
9. Pin important countries.
10. Hide countries and restore them later.
11. Export the current table view to CSV.
12. View current online session count when the app is deployed with a backend.

## Data Fields

Each eligible country should have one representative 10-year sovereign bond record. The record should identify whether it is a local-currency sovereign bond or an external/foreign-currency Eurobond.

Required fields for v1:

- Country
- Region
- Bond Name
- Bond Type
- Currency
- Maturity
- Coupon Rate
- Bond Price
- Yield to Maturity
- Real Yield
- Credit Rating
- Debt-to-GDP
- Fiscal Deficit-to-GDP
- Inflation Rate
- Policy Interest Rate
- Exchange Rate Volatility
- Foreign Exchange Reserves
- Gold Reserves
- CDS Spread
- Liquidity / Bid-Ask Spread
- Last Updated
- Source Note

CSV exports must use human-readable headers with units where applicable, such as `Yield to Maturity (%)`, `Debt-to-GDP (%)`, `Foreign Exchange Reserves (USD bn)`, `CDS Spread (bps)`, and `Total Score (0-100)`.

## Scoring Behavior

The score must use a two-level weighting model:

- Bond Return & Liquidity: 35%
- Sovereign Risk: 65%

Detailed scoring rules live in `docs/scoring-model.md`.

## Non-Goals For V1

- No live market-data integration.
- No real multi-user online presence tracking in the local-only preview.
- No automatic investment recommendation.
- No portfolio optimization.
- No trading or brokerage integration.
- No multi-user cloud sync.
- No guarantee that included data is complete or current.

## Success Criteria

The v1 app is successful when the user can manually maintain sovereign bond data, recalculate rankings, inspect score components, filter/search the table, preserve local data, and export rankings to CSV.
