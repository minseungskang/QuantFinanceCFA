# Sovereign Bond Screening Tool

Mac-first sovereign bond screening app prototype.

## Current Status

This repository currently contains the project governance docs and a dependency-free runnable preview shell.

The preview is not the final Electron app yet. It is the first runnable scaffold so the app can be opened and checked from VS Code before adding package-manager dependencies.

## Run In VS Code

Open this project folder in VS Code, then open a terminal and run:

```bash
node scripts/dev-server.mjs
```

On macOS, the browser should open automatically at:

```text
http://127.0.0.1:4173
```

If it does not open automatically, copy that address into Chrome or Safari.

To stop the preview server, click the terminal and press:

```text
Control + C
```

## What You Should See

You should see a clean light-blue app shell titled:

```text
Sovereign Bond Screening Tool
```

The preview includes:

- Local preview online-session status
- Search input
- Region filter
- Sort control
- Sample sovereign bond ranking table
- Scores and confidence calculated by the shared scoring engine
- Expandable score details showing rating score, category scores, and component scores
- Raw component values next to normalized model scores
- Winsorized P95/P5 benchmarks showing which raw value maps to 100 and which maps to 0
- Pin buttons that keep selected countries above unpinned countries
- Country A-Z sort without separate letter divider rows
- Manual edit form for key bond and country metrics
- Browser-local persistence for manual edits and pin state
- Reset Local Data control for restoring sample records in the current browser
- Hide and restore workflow for countries removed from the visible ranking
- CSV export for the current visible ranking
- CSV import for replacing the local dataset
- CSV headers include human-readable names and units, such as `Debt-to-GDP (%)` and `CDS Spread (bps)`

## Next Development Step

The current preview includes the first scoring engine, browser-local manual editing, hide/restore, and CSV import/export. The next step is to expand production-grade persistence:

- More complete country fields
- Database-backed persistence in the desktop shell

## Checks

Run the file scaffold check:

```bash
node scripts/check-files.mjs
```

Run the scoring test:

```bash
node scripts/test-scoring.mjs
```
