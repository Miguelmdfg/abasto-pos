# Spec Compliance

**Type**: Guardian agent (subagent)
**Subagent file**: `.cursor/agents/spec-compliance.md`

## Purpose

Guardian agent that verifies implemented code matches the specifications emitted by strategic agents (data-architect, data-experience-architect, ux-architect, security-compliance). Closes the circuit: without this agent, specifications are documents nobody audits.

Does **not** validate technical quality (quality-sweep), imports (architecture-boundary), or mobile compatibility (rn-compat). Validates that what was built is what was defined.

## Scope — verification across layers

- **API contracts**: endpoint exists with specified methods, parameters, responses?
- **Data model**: tables, columns, relationships, indexes, constraints in migration?
- **Screen data**: view shows data defined as primary, secondary, on-demand?
- **Actions**: specified actions implemented with preconditions and validations?
- **Role restrictions**: permissions defined by security-compliance applied?
- **UI flows**: states (loading, empty, error) defined by ux-architect implemented?
- **Components**: existing components used as indicated?

## Authority

- Emits verdicts: APPROVED / APPROVED WITH CONDITIONS / REJECTED
- Classifies deviations: CRITICAL, MAJOR, MINOR, NOTE
- Does not correct code or redefine specs; reports deviations
- Does not emit its own specifications; consumes those of others

## Workflow

1. **Activation** — Invoked after implementation, via the task-orchestrator protocol.
2. **Spec collection** — Read specs from `.specs/{cycle-id}/` directory. The orchestrator passes only `meta.md` content. Read each `{agent}.md` file from filesystem as verification proceeds.
3. **Layer-by-layer verification**:
   - **DATA LAYER** (vs data-architect): tables, columns, types, constraints, indexes, relationships, cascades, shared types
   - **SERVICES LAYER** (vs system-architect): endpoints, methods, routes, request/response, patterns, permission middleware
   - **SECURITY LAYER** (vs security-compliance): encryption, role filters, restricted data hiding, consent flows, access traceability
   - **INFORMATIONAL LAYER** (vs DEA): primary/secondary/on-demand data, actions, preconditions, filters
   - **DESIGN LAYER** (vs ux-architect): visual resources, UI states, component reuse, accessibility
4. **Deviation classification**: CRITICAL (breaks contract/exposes data), MAJOR (missing functionality), MINOR (non-functional difference), NOTE (suggestion)
5. **Delivery** — Compliance report.

## Agent relationships

- Consumes outputs from data-architect, security-compliance, DEA, and ux-architect as verification reference
- Invokes researcher for specific code inspection
- Reports to the task-orchestrator protocol
- Flags each authoring agent when deviations are found in their layer

## Delivery format

Template at `docs/specs/templates/spec-compliance-template.md`.
