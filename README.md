# Formato Único de Hoja de Vida (Persona Natural)

Aplicación web local y estática para diligenciar fácilmente el **Formato Único de Hoja de Vida Persona Natural** (Leyes 190 de 1995, 489 y 443 de 1998 - Función Pública / DAFP) y generar el PDF oficial idéntico al formato original.

## Características principales

- **100% Estática (Sin servidor ni base de datos externa):** Funciona abriendo `index.html` directamente en el navegador o desde GitHub Pages.
- **Autoguardado y Respaldo en JSON:** Guarda automáticamente el progreso en `localStorage` del navegador y permite exportar/importar toda la información (incluyendo la firma) en un archivo `.json`.
- **Ordenamiento Cronológico Automático:** Organiza automáticamente las experiencias laborales de la más reciente (o actual) a la más antigua al generar el PDF.
- **Hojas Adicionales y Paginación Consecutiva Automática:** Si se registran más de 4 experiencias laborales, genera automáticamente hojas adicionales del Punto 3 y numera todas las páginas de forma consecutiva (`1, 2, 3, 4...`).
- **Carga y Limpieza de Firma:** Permite subir imagen de firma (eliminando automáticamente el fondo blanco del papel) o dibujarla en pantalla.
- **Generación Pixel-Perfect (`pdf-lib`):** Estampa los datos sobre la plantilla oficial del Formato Único de Hoja de Vida.
