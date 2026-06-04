# Codex Working Guide

This project is a desktop sovereign bond screening app. The user is non-technical, so development must proceed in small, stable, verified increments with clear logs.

## Required Reading Before Implementation

Before making application code changes, read:

- `docs/development-process.md` for workflow, safety rules, and logging expectations.
- `docs/requirements.md` for product scope and user flows.
- `docs/scoring-model.md` before changing scoring behavior.
- `docs/design-spec.md` before changing UI behavior or visual design.
- `docs/technical-spec.md` before changing architecture, data storage, or build tooling.
- `docs/implementation-roadmap.md` before choosing the next development step.

## Development Rules

- Work in small functional increments.
- Do not build multiple major features in one pass.
- Keep each change easy to verify.
- Prefer stable, boring technical choices over clever abstractions.
- Do not do broad rewrites unless the user explicitly approves them.
- Do not add live market-data integrations in v1 unless the requirements are updated.
- Keep UI text English-first unless the user asks otherwise.

## Daily Development Logs

After each development session, update the daily log:

- Location: `development-logs/YYYY-MM-DD.md`
- Current log date follows the actual project date.

Each log must include:

- `Completed`
- `In Progress`
- `Todo`
- `Decisions`
- `Risks / Notes`
- `Verification`

Logs are maintained by Codex during development sessions. They are not generated from git history.

## Project Standards Map

- Product requirements: `docs/requirements.md`
- Technical architecture: `docs/technical-spec.md`
- UI and design standards: `docs/design-spec.md`
- Scoring model: `docs/scoring-model.md`
- Development workflow: `docs/development-process.md`
- Roadmap and sequencing: `docs/implementation-roadmap.md`

## Current Implementation Policy

The project starts with governance files only. Application code begins after the governance setup has been verified.

