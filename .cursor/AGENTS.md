# Agent Orchestration Guide

Guía para orquestar cambios en este repositorio sin mezclar “camino principal” con “legacy”.

## 1) Fuente de verdad por área

- `frontend/` (camino principal): documenta e implementa el comportamiento actual de UI con React + Vite + HeroUI.
- `__old/` (legacy/depreciado): documenta el sistema histórico (HTML/CSS/JS y la API Express legacy). Se usa solo como referencia o soporte temporal.
- `docs/`: contiene el “scope” de lo implementado y la especificación objetivo.
- `BD` (base de datos): la decisión de BD se mantiene como `TBD` hasta el análisis futuro.

## 2) Regla de oro para agentes

Antes de proponer cambios:

1. Identificar si el cambio afecta `frontend/` (principal) o `__old/` (legacy).
2. Ver el documento correcto:
   - `docs/FUNCIONALIDADES-ACTUAL.md` para el alcance de `frontend/`
   - `docs/FUNCIONALIDADES-LEGACY.md` para el alcance de `__old/`
   - `docs/API-CONTRATO-ACTUAL.md` para endpoints realmente consumidos hoy
3. Evitar fijar decisiones de BD en documentación o código. Si se necesita BD, se deja como “pendiente”.

## 3) Subagents (conceptuales)

- `docs-scope`: actualiza índices y reestructura documentación (Actual vs Legacy).
- `api-contract`: valida endpoints y payloads usando el código del frontend y la API legacy en `__old/backend/`.
- `frontend-changes`: aplica cambios en `frontend/` respetando la regla de HeroUI (`.cursor/rules/heroui-frontend.mdc`).
- `legacy-cleanup`: documenta o reduce ambigüedad en el legacy sin convertirlo en camino principal.
- `db-tbd`: controla que cualquier mención de BD sea `TBD` hasta el análisis futuro.

## 4) Criterios de “done”

- La documentación no afirma stacks no aplicables (ej. NestJS/PostgreSQL como decisión actual).
- `__old/` aparece como legacy/depreciado.
- La capa de API actual se documenta con base en lo que consume `frontend/`.
- Cualquier decisión relacionada con BD queda explícitamente marcada como `TBD`.
