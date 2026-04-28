# Data Experience Architect — Delivery Format Template

```
SCREEN: [name / route / identifier]
CONTEXT: [what the user does here, what they need to resolve]
ROLE(S): [which user profiles this applies to]

PRIMARY DATA:
  - [field]
    source: [table → endpoint → view-model]
    data nature: [temporal/comparative/state/numeric/list/distribution/flow/relational]
    granularity: [if applicable — time range, data points, entities, categories]
    business rules: [calculation conditions, visibility, update frequency]
    role restrictions: [which roles see it, which don't, per security-compliance ruling]

SECONDARY DATA:
  - [same format]

ON-DEMAND DATA:
  - [same format]
    access: [expand / drill-down / modal / navigation to another view]

ACTIONS:
  - [action]
    precondition: [state, role, required prior data]
    validation: [what is verified before execution]
    effect: [what changes in data/state]
    confirmation required: [yes/no, reason]

FILTERS AND SEGMENTATIONS:
  - [filter]: [options, default value, impact on displayed data]

DETECTED GAPS:
  - [missing data]
    justification: [why it is needed]
    delegated to: [data-architect / system-architect]
    impact if unresolved: [what the view loses]

DETECTED INCONSISTENCIES:
  - [data X shown differently across views without justification]

PROPOSED SIMPLIFICATIONS:
  - [what can be eliminated, merged, or reorganized]

AVAILABLE DATA NOT USED:
  - [data in schema/API relevant to this view that is not shown today]
    recommendation: [include / discard with reason]

NOTES FOR UX-ARCHITECT:
  - [additional context: expected information density, user technical profile,
    view usage frequency, primary device]
```
