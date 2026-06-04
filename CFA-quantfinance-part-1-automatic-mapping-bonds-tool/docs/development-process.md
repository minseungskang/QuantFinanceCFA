# Development Process

## Working Style

Build this project in small functional increments. Each increment should be easy to explain, easy to verify, and safe to continue from.

Do not build the entire app in one pass.

## Before Each Implementation Session

1. Read `CODEX.md`.
2. Read this file.
3. Check `docs/implementation-roadmap.md`.
4. Check the latest daily log in `development-logs/`.
5. Confirm the next smallest useful step.

## During Development

- Keep changes scoped to the current step.
- Avoid unrelated refactors.
- Preserve user-created changes.
- Prefer explicit, readable code.
- Keep scoring logic testable and separate from UI.
- Do not add live data integrations unless requirements change.

## Verification

Every implementation session should end with verification appropriate to the change:

- Documentation-only change: confirm files exist and contain expected sections.
- Scoring change: run focused scoring tests.
- TypeScript change: run type checks when available.
- UI change: run app locally and inspect the relevant screen.
- Persistence/export change: verify stored/exported data matches expected values.

## Daily Logs

Update `development-logs/YYYY-MM-DD.md` at the end of each development session.

Use this structure:

```markdown
# Development Log - YYYY-MM-DD

## Completed

## In Progress

## Todo

## Decisions

## Risks / Notes

## Verification
```

Logs should be concise and factual.

## Change Safety

- Do not perform destructive file or git operations unless explicitly requested.
- Do not rewrite broad parts of the project without approval.
- Do not introduce new frameworks without documenting why in `docs/technical-spec.md`.
- Keep dependencies minimal.

## Communication

Explain progress in plain language. The user is non-technical and should be able to understand what changed and why it matters.

