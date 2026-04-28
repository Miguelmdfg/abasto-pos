# Spec Compliance — Delivery Format Template

```
CYCLE: [original request identifier]
SPECIFYING AGENTS: [list]
CODE VERIFIED: [files/modules inspected]

COMPLIANCE BY LAYER:

  DATA: [✓ compliant / ✗ deviations]
    - [deviation]: severity [critical/major/minor/note]
      spec: [what was defined]
      implemented: [what was found]
      file: [reference]

  SECURITY: [✓ / ✗]
    - [same format]

  INFORMATIONAL: [✓ / ✗]
    - [same format]

  DESIGN: [✓ / ✗]
    - [same format]

SUMMARY:
  Total deviations: [N]
  Critical: [N] — require correction before closing
  Major: [N] — require correction or justification
  Minor: [N] — at Lead's discretion
  Notes: [N] — informational

VERDICT: [APPROVED / APPROVED WITH CONDITIONS / REJECTED]

CONDITIONS (if applicable):
  - [what must be corrected, referencing the original spec and authoring agent]
```
