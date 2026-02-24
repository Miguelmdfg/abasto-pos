# Bodega-Flow

## Descripción General
Bodega-Flow es un sistema de gestión para bodegas que permite administrar ventas, inventario, deudas, usuarios y pagos móviles. El sistema está dividido en un backend (servidor) y un frontend (interfaz web), facilitando la gestión diaria de una bodega o pequeño comercio.

## Tecnologías Utilizadas
- **Backend:** Node.js con Express.js
- **Base de datos:** Archivos JSON locales (no requiere instalación de bases de datos externas)
- **Frontend:** HTML, CSS y JavaScript puro
- **Control de versiones:** Git

## Estructura del Proyecto
- `backend/`: Lógica del servidor, rutas, manejo de datos y archivos JSON
  - `routes/`: Rutas para ventas, productos, usuarios, deudas y pagos móviles
  - `data/`: Archivos JSON con la información persistente
- `Html/`: Archivos HTML para cada sección del sistema
- `css/`: Hojas de estilo para la interfaz
- `js/`: Scripts de frontend para interacción con la UI
- `public/`: Recursos públicos como imágenes

## Instalación y Ejecución
1. **Clonar el repositorio:**
   ```bash
   git clone <URL-del-repositorio>
   cd Bodega-Flow/backend
   ```
2. **Instalar dependencias:**
   ```bash
   npm install
   ```
3. **Iniciar el servidor:**
   ```bash
   node server.js
   ```
   El servidor se ejecutará por defecto en `http://localhost:3000`.

4. **Abrir la interfaz:**
   Abre los archivos HTML desde la carpeta `Html/` en tu navegador o configura un servidor estático para servirlos.

## Uso
- Accede a las diferentes páginas HTML según la funcionalidad que necesites (ventas, inventario, deudas, etc.)
- El backend expone rutas para manejar los datos, que son consumidas por los scripts JS del frontend

## Notas
- El sistema está pensado para uso local o en una red interna.
- No requiere base de datos externa, pero los datos se almacenan en archivos JSON en el backend.
- Puedes personalizar los estilos y la lógica según las necesidades de tu bodega.

## Contacto
Para dudas o mejoras, contacta al desarrollador original o crea un issue en el repositorio de GitHub.
