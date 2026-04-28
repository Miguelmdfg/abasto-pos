# UX Architect — Delivery Format Template

```
SCREEN: [name / route / identifier]
DEA INPUT: [reference to received informational specification]

VISUAL RESOURCES:
  - [field]
    nature (from DEA): [temporal / comparative / state / etc.]
    chosen resource: [line chart / card / table / badge / etc.]
    design justification: [why this resource in this context]
    existing component: [yes → which / no → requires new]
    responsive variant: [how it adapts on mobile]

LAYOUT:
  - Structure: [composition description, blocks, grid]
  - Grouping: [what elements go together and why]
  - Visual hierarchy:
    PRIMARY: [main zone, highest visual weight]
    SECONDARY: [complementary zone]
    ON-DEMAND: [access via expand/modal/drill-down/tab]

INTERACTION FLOW:
  - Entry: [how the user reaches this view]
  - Actions: [for each DEA action, how it is presented and executed]
  - Navigation: [where you can go from here]

STATES:
  - LOADING: [what is shown — skeleton, spinner, placeholder]
  - EMPTY: [message, illustration, suggested action]
  - ERROR: [error type, message, recovery action]
  - PARTIAL: [if only part of data loaded]
  - SUCCESS: [feedback after successful action]

ACCESSIBILITY:
  - [specific requirements: ARIA labels, tab order, contrast, alt text for charts]

COMPONENTS:
  REUSED:
    - [component from @heroui/react or frontend/src/components/]: [usage in this view]
  NEW REQUIRED:
    - [component]: [description, expected props, justification for why existing ones don't cover it]

CONSISTENCY:
  - [related views and how visual/interaction coherence is maintained]

FEEDBACK TO DEA (if applicable):
  - [problems in the informational spec: excessive density, impractical hierarchy,
    data that adds no visual value, actions that create confusing flows]
```
