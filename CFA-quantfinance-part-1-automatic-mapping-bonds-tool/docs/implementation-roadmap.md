# Implementation Roadmap

## Step 1: Project Governance Setup

Create:

- `development-logs/`
- `docs/`
- `CODEX.md`

Add standards for requirements, technical direction, design, scoring, development process, and phased implementation.

No application code in this step.

## Step 2: App Scaffold

Create the Electron + React + TypeScript project skeleton.

Minimum outcome:

- App window launches locally.
- Basic app shell appears.
- Development command is documented.
- No scoring or table complexity yet.

Current Step 2A outcome:

- Add a dependency-free Node preview server.
- Add a static app shell that can be opened from VS Code on Mac.
- Document the temporary preview command.
- Defer Electron + React + TypeScript dependency installation until the environment has a package manager available.

## Step 3: Scoring Engine

Implement:

- Domain data types.
- Credit rating mapping.
- Real yield calculation.
- Indicator normalization.
- Two-level category and indicator weights.
- Total score.
- Data confidence.

Minimum outcome:

- Scoring works against sample records.
- Focused tests verify expected behavior.

Current Step 3 outcome:

- Add a shared browser/Node scoring engine in `app/scoring.js`.
- Add sample sovereign bond records in `app/sample-data.js`.
- Add scoring tests in `scripts/test-scoring.mjs`.
- Wire the preview table to computed score and data confidence values.

## Step 4: Core Table UI

Implement:

- Main ranking table.
- Search.
- Region filter.
- Score sorting.
- Country A-Z sorting.
- Expand/collapse detail rows.
- Pin behavior.

Minimum outcome:

- User can inspect ranked sovereign bond records.
- UI remains readable and stable.

Current Step 4A outcome:

- Add expandable table detail rows.
- Show credit rating mapped score separately from total score.
- Show Bond Return & Liquidity score, Sovereign Risk score, total score, and data confidence.
- Show component-level normalized scores and within-category weights.

Current Step 4B outcome:

- Add pin/unpin behavior in the table.
- Keep pinned countries above unpinned countries across sort modes.
- Add Country A-Z sorting without separate letter divider rows.

## Step 5: Editing And Persistence

Implement:

- Edit flow for country/bond metrics.
- Local storage for records and settings.
- Last updated and source note fields.

Minimum outcome:

- User can update data manually.
- Closing and reopening the app preserves records and settings.

Current Step 5A outcome:

- Add a manual edit form for core bond and country metrics.
- Save edited records to browser `localStorage`.
- Save pinned countries to browser `localStorage`.
- Recalculate scores and rankings after edits.
- Defer database-backed desktop persistence until the Electron shell exists.

Current Step 5B outcome:

- Add `Reset Local Data` control.
- Confirm before clearing local edits.
- Restore sample records and clear pinned countries in the current browser.

## Step 6: Hide / Restore And CSV Export

Implement:

- Hidden countries management.
- Restore hidden countries.
- CSV export of the current table view.

Minimum outcome:

- Hidden records do not affect main ranking.
- Exported CSV matches the visible ranking and score data.

Current Step 6A outcome:

- Add hide buttons on visible rows.
- Add hidden countries management and restore buttons.
- Persist hidden countries in browser `localStorage`.
- Add CSV export for the current visible ranking.
- Add CSV import to replace the local dataset.

## Step 7: Packaging Preparation

Implement:

- Build scripts.
- Packaging scripts or documented packaging path for macOS and Windows.
- Packaging notes.

Minimum outcome:

- Project has a clear path to produce desktop builds.

## Sequencing Rule

Do not start a later step until the current step is verified and logged.
