# Task Orchestrator — Format Templates

## Planning format

Produce before executing (SCOPED and FULL tiers only):

```
REQUEST: [original description]
TIER: [SCOPED / FULL]
CYCLE-ID: [proposed cycle-id]
PHASES ACTIVATED: [which of F1-F7 apply]
DETECTED IMPACT: [affected areas]

PLAN:
  F1: researcher (scope: [x]) → [what to find]
  F2: [agents] → [specific tasks]
      depends on: F1
  F3: [agent] → [specific task]
      depends on: F2
  ...

AGENTS NOT NEEDED: [which and why]
DETECTED RISKS: [what could be missed]
```

Present this plan to the Lead before executing. If the request is unambiguous and the plan is straightforward, proceed directly.

## Final report format

```
CYCLE: [cycle-id]
REQUEST: [original]
AGENTS: [list]

EXECUTIVE SUMMARY: [3-5 lines]

DECISIONS: [agent → key decision, 1 line each]

VALIDATION: [result per guardian]

CONFLICTS: [if any]
UNANTICIPATED IMPACT: [if any]
GAPS: [if any]

VERDICT: [CLOSED / PENDING / ESCALATED]
```
