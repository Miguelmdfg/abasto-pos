# Security Compliance — Delivery Format Template

```
CONTEXT: [what decision/spec is being evaluated, from which agent]

DATA INVOLVED:
  - [field]: classification [public/internal/sensitive/critical]
    source: [table/endpoint/user input]
    roles with access: [list]
    requires consent: [yes/no, from whom]

EVALUATION:
  - Minimization: [is only necessary data captured?]
  - Multi-tenant isolation: [can user from institution A see data from B?]
  - UI exposure: [does any screen show sensitive data to unauthorized roles?]
  - Retention: [is it defined? compliant?]
  - Traceability: [are accesses to sensitive data logged?]
  - Encryption: [sensitive data encrypted at rest and in transit?]

RULING: [APPROVED / APPROVED WITH CONDITIONS / BLOCKED]

CONDITIONS (if applicable):
  - [concrete requirement that must be met before implementation]

APPLICABLE REGULATIONS:
  - [specific law/article/disposition grounding each condition]

NOTES FOR OTHER AGENTS:
  - data-architect: [field marking, encryption, retention adjustments]
  - system-architect: [permission middleware, filters, audit logging]
  - data-experience-architect: [data visibility restrictions by role on screen]
  - ux-architect: [consent flows, legal notices, privacy controls]
```
