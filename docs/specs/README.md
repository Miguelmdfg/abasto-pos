# docs/specs

Home of the **spec template catalog** used by the agent ecosystem.

- [`templates/`](./templates/) — per-role spec templates: system-architect, data-architect, data-experience-architect, ux-architect, security-compliance, spec-compliance, plus the shared orchestrator formats.

## Where per-cycle specs live

Per-cycle specs produced by each agent during a task orchestration **do not live here**. They persist to:

```
.specs/{cycle-id}/{agent}.md
```

See [`AGENTS.md`](../../AGENTS.md) → **Task Orchestration → Spec persistence** for the contract.

## When to touch this directory

- Adding or updating a template → [`templates/`](./templates/)
- Proposing a new spec type or role deliverable → coordinate with the Atlas Docs role ([`AGENTS-docs/roles/atlas-docs.md`](../../AGENTS-docs/roles/atlas-docs.md))

For changes to cycle outputs, edit the agents' definitions under [`.cursor/agents/`](../../.cursor/agents/), not this directory.
