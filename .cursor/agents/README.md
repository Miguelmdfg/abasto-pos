# AbastoPOS — Agent Catalog

This folder contains the definition and documentation of every agent in the AbastoPOS ecosystem, organized by category.

> **Source of truth**: `.cursor/agents/` (subagent definitions). This folder is the consolidated reference.

## Strategic Agents

| Agent | File | Activation | Domain |
|---|---|---|---|
| System Architect | [system-architect.md](./system-architect.md) | `Rol: System Architect` | Architecture, API contracts, service patterns, scalability |
| Data Architect | [data-architect.md](./data-architect.md) | `Rol: Data Architect` | Schema, migrations, queries, multi-tenant, DB performance |
| Security Compliance | [security-compliance.md](./security-compliance.md) | `Rol: Security` | Personal data, minors, role permissions, legal compliance |
| Data Experience Architect | [data-experience-architect.md](./data-experience-architect.md) | `Rol: DEA` | Informational logic per screen, data classification, bridge data→UX |
| UX Architect | [ux-architect.md](./ux-architect.md) | `Rol: UX Architect` / `Rol: UX` | Visual design, layout, interaction, UI states, a11y, responsivity |
| Researcher | [researcher.md](./researcher.md) | `Rol: Researcher` | Parametrized codebase exploration (read-only) |

## Guardian Agents (post-implementation validation)

| Agent | File | Domain |
|---|---|---|
| Spec Compliance | [spec-compliance.md](./spec-compliance.md) | Verifies code matches agent specifications |
| Quality Sweep | [quality-sweep.md](./quality-sweep.md) | Full verification loop: tsc, lint, tests, coverage |
| Architecture Boundary | [architecture-boundary.md](./architecture-boundary.md) | Package boundary enforcement (imports/exports) |
| RN Compat | [rn-compat.md](./rn-compat.md) | Hermes-safe constraints for React Native |
| Component Auditor | [component-auditor.md](./component-auditor.md) | Duplicate UI detection and reuse opportunities |

## Documentation Agent

| Agent | File | Activation | Domain |
|---|---|---|---|
| Atlas Docs | [atlas-docs.md](./atlas-docs.md) | `Rol: Atlas Docs` / `Rol: Docs` | Documentation architecture, taxonomy, coverage, doc roadmap |

## Orchestration

For complex or multi-domain requests, agents are coordinated through the **Task Orchestrator Protocol** in 7 phases:

```
F1 EXPLORATION    → Researcher
F2 STRUCTURAL     → System Architect + Data Architect + Security Compliance
F3 INFORMATIONAL  → Data Experience Architect
F4 DESIGN         → UX Architect
F5 IMPLEMENTATION → Main agent / Lead
F6 VALIDATION     → All guardians in parallel
F7 CLOSURE        → Consolidation and report
```

## How to activate agents

- **Direct**: `Rol: <name> : <task>` (e.g. `Rol: UX Architect : review the sales screen`)
- **Combined sequential**: `Rol: DEA + UX Architect : redesign the product catalog view`
- **Combined parallel**: `Rol: Security, Spec Compliance : audit the API endpoints`
- **Automatic**: the orchestrator activates relevant agents based on task complexity
