# Component Auditor

**Type**: Guardian agent (subagent)
**Subagent file**: `.cursor/agents/component-auditor.md`

## Purpose

Finds duplicate or near-duplicate UI components and recommends reusing existing components. Scans `COMPONENTS.md` and `components.index.json` across lanes and suggests consolidation or reuse.

## Workflow

1. Scan reusable components in:
   - `frontend/src/components/`
2. Given the files or scope provided, identify:
   - New or modified UI that could use an existing shared component
   - Duplicate patterns (e.g. custom buttons or cards) that should be replaced by a shared component
3. Report:
   - List of suggested reuse (existing component → file/location to change)
   - List of potential new reusable components to extract into `frontend/src/components/`
   - Any duplicates that might be consolidated

Reports are specific: cite component name and path from the catalogs, and the target file/location to change.
