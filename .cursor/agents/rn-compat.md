# RN Compat

**Type**: Guardian agent (subagent)
**Subagent file**: `.cursor/agents/rn-compat.md`

## Purpose

Enforces Hermes-safe constraints for all code consumed by the React Native mobile app (`apps/student`). Ensures shared code does not use APIs that break under Hermes or Metro bundler.

## Scope

Files in:
- `packages/frontend/view-models/**`
- `packages/frontend/client/**`
- `packages/shared/**`
- `apps/student/**`

## Workflow

1. **Compatibility check** — For changed files in scope, list any use of forbidden APIs.
2. **Violations** — Exact location and suggested replacement.
3. **Confirmation** — If no violations, state that the change is RN/Hermes compatible.

## Forbidden APIs and replacements

| Forbidden | Replacement |
|---|---|
| `import.meta` | `process.env` |
| `response.body.getReader()` | Alternative fetch handling |
| `URL.createObjectURL()` | Platform-specific solution |
| `localStorage` | `AsyncStorage` or `SecureStore` (mobile); `process.env` (config in shared) |

## References

- `.cursor/rules/react-native.mdc`
- **rn-compat** skill (`.cursor/skills/rn-compat/SKILL.md`)
