---
name: api-contract
description: Valida y documenta el contrato mínimo de API consumido por el frontend. Use cuando el usuario pida “contrato API”, “endpoints consumidos” o “actualizar documentación de API” para el frontend.
---

# api-contract

## Instrucciones

1. Enumerar endpoints consumidos por `frontend/`:
   - Buscar llamadas a `fetch` (o librerías HTTP) en `frontend/src/`.
   - Confirmar base URL a partir de `VITE_API_URL` (ver `frontend/.env.example`).
2. Para cada endpoint encontrado:
   - leer el handler correspondiente en `__old/backend/routes/*` (si el backend actual es legacy).
   - documentar request JSON (campos requeridos y tipos esperados) y respuestas (éxito + errores).
3. Redactar el documento de contrato en `docs/API-CONTRATO-ACTUAL.md`:
   - mantenerlo “mínimo” (solo lo que el frontend realmente usa hoy)
   - evitar extender el scope a módulos que aún no existen en React.
4. Mantener BD como TBD:
   - no agregar decisiones de BD/ORM/modelado como si fueran definitivas.

## Salida esperada

- Actualización del documento de contrato con endpoints y payloads reales.
- Nota explícita si un feature del frontend todavía usa datos mock.
