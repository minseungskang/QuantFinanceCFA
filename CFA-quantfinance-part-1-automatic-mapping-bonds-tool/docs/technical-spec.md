# Technical Specification

## Planned Stack

- Desktop shell: Electron
- UI: React
- Language: TypeScript
- Local data: SQLite or a file-backed local database layer
- Styling: CSS with a restrained light-blue visual system

The stack should remain simple and maintainable for a small desktop app.

## Current Scaffold

The first runnable scaffold uses a dependency-free Node preview server in `scripts/dev-server.mjs` and static files in `app/`.

This is a temporary verification shell so the user can run and inspect the app from VS Code immediately, even before npm/Electron dependencies are installed. It should be upgraded to the planned Electron + React + TypeScript stack in a later scaffold increment.

The preview displays `Online Now: 1` as a local-session status only. True concurrent online-user counting requires a deployed backend or realtime service and is not available in the local-only preview.

Run locally with:

```bash
node scripts/dev-server.mjs
```

## Architecture Principles

- Keep scoring logic separate from UI components.
- Keep data persistence separate from scoring and presentation.
- Keep domain types explicit and readable.
- Prefer deterministic functions for scoring so they are easy to test.
- Avoid network dependencies in v1 app behavior.

## Planned App Boundaries

- Main process: desktop window, local filesystem/database access, export operations.
- Renderer process: table UI, filters, editing forms, scoring display.
- Shared domain layer: country/bond types, scoring functions, weight configuration.

## Data Model Direction

The core entity is a country-level sovereign bond record:

- One country.
- One representative 10-year local-currency sovereign bond.
- Country-level risk metrics.
- Bond-level return and liquidity metrics.
- UI state such as pinned or hidden.
- Metadata such as last updated and source note.

## Persistence Direction

Local persistence must preserve:

- Sovereign bond records.
- Weight settings.
- Pinned countries.
- Hidden countries.
- Last updated timestamps and source notes.

## Export Direction

CSV export should reflect the current table view, including active filters, sorting, score columns, and visible records.

CSV headers should be human-readable and include units where applicable. CSV import should accept both internal field keys and exported human-readable labels so exported files can be imported again.

## Verification Expectations

Each technical increment should have at least one practical verification step:

- Type check for TypeScript changes.
- Unit tests for scoring changes.
- Manual launch check for desktop shell changes.
- UI interaction check for table and form changes.
- Export file inspection for CSV changes.
