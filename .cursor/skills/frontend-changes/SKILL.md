---
name: frontend-changes
description: Aplica cambios en el frontend asegurando consistencia con HeroUI v3 y layout con Tailwind. Use cuando el usuario pida modificar o agregar pantallas/inputs en `frontend/`.
---

# frontend-changes

## Instrucciones

1. Respetar la regla de UI:
   - usar componentes de `@heroui/react` para controles de formulario y layout
   - evitar `input`/`button` nativos para controles
2. Mantener estructura:
   - páginas en `frontend/src/pages/`
   - componentes en `frontend/src/components/`
   - mocks en `frontend/src/mocks/` si aplica
3. Mantener estilos:
   - preferir Tailwind para layout/espaciado
   - si se requiere CSS adicional, centralizar en `frontend/src/index.css`
4. Si se agregan llamadas a API:
   - documentar el endpoint en `docs/API-CONTRATO-ACTUAL.md`
   - y validar que el scope corresponda a `Actual` (no legacy).

## Salida esperada

Una lista corta de cambios a UI y qué documento(s) se deben actualizar (si aplica) para mantener el scope.
