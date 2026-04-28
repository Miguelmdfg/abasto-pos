# Quality Sweep

**Type**: Guardian agent (subagent)
**Subagent file**: `.cursor/agents/quality-sweep.md`

## Purpose

Runs the full verification loop for code in any package: TypeScript compilation, linting, unit tests, and coverage. Returns a structured failure summary. Used when verifying Definition of Done.

## Workflow

1. Run TypeScript (`tsc --noEmit`), lint, unit tests, and coverage for the affected package(s). Uses the **exit-audit** skill for exact commands per package.
2. If any step fails: produce a **structured failure summary** (step name, package/path, error summary, suggested fix when obvious).
3. If all pass: output the standard Exit Audit checklist.

## Coverage thresholds

- ≥ 90% on modified code
- 100% for critical business logic paths

## References

- [Incremental Quality Flow](../docs/development/workflow-quality.md)
- Quality standards rule: `.cursor/rules/quality-standards.mdc`
- **exit-audit** skill
