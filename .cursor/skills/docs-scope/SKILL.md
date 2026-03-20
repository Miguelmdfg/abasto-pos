---
name: docs-scope
description: Actualiza documentación usando el scope correcto (Actual vs Legacy) sin duplicar contenido. Use cuando el usuario pida “actualizar documentación” o “revisar scope” en archivos bajo `docs/`.
---

# docs-scope

## Instrucciones

1. Identificar el alcance del cambio:
   - Si el cambio afecta la UI/flujo del camino principal => usar `docs/FUNCIONALIDADES-ACTUAL.md`.
   - Si el cambio afecta POS/HTML/JS o la API Express legacy => usar `docs/FUNCIONALIDADES-LEGACY.md` y/o `docs/API-CONTRATO-ACTUAL.md` (si aplica).
2. Si el usuario requiere un resumen o navegación => actualizar `docs/FUNCIONALIDADES.md` como “índice” (sin duplicar contenido).
3. Antes de documentar API, validar endpoints “reales”:
   - revisar `frontend/src/` para endpoints consumidos
   - y/o confirmar payloads mirando `__old/backend/routes/*` cuando sea necesario.
4. Evitar decisiones prematuras de BD:
   - cualquier referencia a BD no analizada debe quedar como `TBD`.

## Salida esperada

Una lista corta de qué documento(s) se actualizaron y por qué correspondían a “Actual” o “Legacy”.
