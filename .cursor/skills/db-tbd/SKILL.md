---
name: db-tbd
description: Evita fijar la base de datos de forma prematura en documentación y tareas. Use cuando el usuario solicite “decidir BD”, “modelar tablas” o “actualizar requisitos” sin un análisis previo.
---

# db-tbd

## Instrucciones

1. Confirmar si el usuario ya autorizó un análisis/conclusión de BD.
2. Si no hay análisis: marcar cualquier tecnología como `TBD (pendiente de análisis)` y evitar:
   - nombres de tablas definitivos
   - migraciones
   - detalles de índices/constraints
3. Si el proyecto tiene un legacy que usa BD:
   - referenciarlo como “legacy (solo referencia)” y separar claramente de la decisión futura.

## Salida esperada

Un texto/documentación que deje claro “qué falta por decidir” y evite afirmaciones técnicas definitivas.
