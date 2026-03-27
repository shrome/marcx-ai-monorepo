# Checkpoint History

This directory contains chronological progress snapshots for the marcx-ai-monorepo.

**🚨 Rule: Any model, agent, or session MUST read the latest checkpoint before making any changes.**
See `.github/copilot-instructions.md` → "Progress Tracking" section for the full rule.

---

## How to read

- Start with the **latest checkpoint** (highest number) for current state
- Read earlier ones only if you need context on why a decision was made
- Each checkpoint includes: what was done, bugs fixed, files changed, what is next

---

## Index

| # | File | Summary |
|---|------|---------|
| 1 | [001-ledger-schema-design-docs.md](./001-ledger-schema-design-docs.md) | DB schema design — 14 tables, enums, ERD. No code yet. |
| 2 | [002-schema-implementation-and-web.md](./002-schema-implementation-and-web.md) | Schema implemented in Drizzle + web build fixes |
| 3 | [003-backend-fixes-and-implementati.md](./003-backend-fixes-and-implementati.md) | Backend fixes and planning |
| 4 | [004-phase-1-complete-phase-2-start.md](./004-phase-1-complete-phase-2-start.md) | Phase 1 (schema) complete, Phase 2 (backend) started |
| 5 | [005-phase-2-3-complete.md](./005-phase-2-3-complete.md) | Phase 2 (backend) + Phase 3 (frontend) complete |
| 6 | [006-phase-4-setup-and-decorators.md](./006-phase-4-setup-and-decorators.md) | Phase 4 setup: Swagger decorators + Scalar docs |
| 7 | [007-fixing-e2e-test-infrastructure.md](./007-fixing-e2e-test-infrastructure.md) | E2E test infra fixed (ts-jest, mock email, DB migrations) |
| 8 | [008-phase-4-all-tests-passing.md](./008-phase-4-all-tests-passing.md) | All 73 backend E2E tests passing ✅ |
| 9 | [009-checkpoints-to-project-frontend-sync.md](./009-checkpoints-to-project-frontend-sync.md) | Checkpoints in project repo, frontend TS clean, Playwright auth fixed ✅ |
| 10 | [010-frontend-api-alignment.md](./010-frontend-api-alignment.md) | **CURRENT** — Frontend API alignment: documents response fix, sidebar cleanup, ledger page full refactor ✅ |

---

## Adding a new checkpoint

When finishing a work session, create `NNN-short-title.md` in this directory and add a row to the table above.

Checkpoint file should include:
- **What was accomplished** (bullet list)
- **Bugs fixed** (each bug: file, root cause, fix)
- **Files created / modified**
- **Current state** (passing tests, known issues)
- **What is next**
