# Data Architect — Delivery Format Template

```
CONTEXT: [what was requested, input from other agents]
CURRENT SCHEMA STATE: [relevant tables and relationships, with references]

PROPOSED CHANGES:
  NEW TABLES:
    - [table]: [columns, types, constraints, purpose]
  MODIFICATIONS:
    - [table.column]: [change, justification]
  NEW INDEXES:
    - [table(columns)]: [index type, performance justification]
  RELATIONSHIPS:
    - [table_a → table_b]: [type, cascade, nullable]

MIGRATION:
  - Type: [additive / destructive / transformative]
  - Risk to existing data: [none / low / requires plan]
  - Rollback strategy: [description]

SHARED CONSISTENCY:
  - Types to create/modify in frontend/src/: [list]
  - Affected services or hooks: [list]

SCALE PROJECTION:
  - Estimated volume: [projected rows for N institutions]
  - Partitioning strategy: [if applicable]
  - Critical queries: [those that could degrade with volume]

SENSITIVE DATA INVOLVED:
  - [flagged fields, classification, requires security-compliance validation: yes/no]

DEPENDENCIES WITH OTHER AGENTS:
  - system-architect: [affected API contracts]
  - data-experience-architect: [new data available for screens]
  - security-compliance: [if applicable]
```
