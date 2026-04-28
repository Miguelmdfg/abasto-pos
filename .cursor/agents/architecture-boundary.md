# Architecture Boundary

**Type**: Guardian agent (subagent)
**Subagent file**: `.cursor/agents/architecture-boundary.md`

## Purpose

Enforces import conventions when adding or changing code. Focus: `frontend/src/**` — clean import paths and module organization.

## Workflow

1. **Import check** — For the changed files, list any imports and verify they follow conventions.
2. **Violations** — Identify imports that bypass the project structure (e.g. reaching into `__old/` from `frontend/`).
3. **Prescription** — Ensure external libs use bare identifiers (e.g. `@heroui/react`) and local imports use relative paths within `frontend/src/`.

## Rules

- **Allowed**: Bare identifiers for external packages. Relative imports (`./`, `../`) within `frontend/src/`.
- **Forbidden**: Importing from `__old/` in `frontend/`. Deeply nested relative paths that skip module boundaries within `frontend/src/`.

## References

- `.cursor/rules/core-guardrails.mdc`
- `.cursor/rules/heroui-frontend.mdc`
