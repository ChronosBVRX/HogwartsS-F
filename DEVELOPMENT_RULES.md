# Proyecto Hogwarts S&F - Reglas de Desarrollo y Despliegue

Este documento contiene las instrucciones obligatorias para el desarrollo y mantenimiento del proyecto Hogwarts S&F.

## 🏗️ Tecnología y Arquitectura
- **Stack:** React + Vite + Tailwind + PWA.
- **Enrutamiento:** `HashRouter` (Rutas con `#`, ej: `#/duelos/ranking`).
- **Despliegue:** GitHub Pages desde la carpeta `./docs`.

## 🛠️ Flujo de Trabajo Obligatorio
1. **Modificación de Fuentes:** Editar siempre en `src/` (Lógica/UI) o `public/` (Assets).
2. **Construcción (Build):** Es **obligatorio** ejecutar `npm run build` después de cualquier cambio. El cambio NO está terminado si el build falla.
3. **Validación de `docs/`:** Confirmar que la carpeta `./docs` se ha regenerado y que los hashes de los assets en `index.html` han cambiado.
4. **PWA y Caché:** El proyecto usa `vite-plugin-pwa`. Si los cambios no se ven, es imperativo:
   - Probar en incógnito.
   - Desregistrar Service Worker en DevTools.
   - Realizar Hard Reload (Ctrl+F5).
   - Limpiar caché en dispositivos móviles.

## 📋 Protocolo de Entrega
Cada tarea terminada debe incluir un resumen con:
- **Archivos modificados:** Lista de archivos en `src/` o `public/`.
- **Ruta/Pantalla afectada:** Confirmación de la ruta activa (ej: `#/duelos/logros`).
- **Comando de build:** Confirmación de ejecución de `npm run build`.
- **Estado de `docs/`:** Confirmación de regeneración exitosa.
- **Advertencia de Caché:** Recordatorio al usuario sobre la limpieza de caché/PWA.

## 🚫 Prohibiciones
- Dar por terminado un cambio sin hacer build.
- Editar directamente la carpeta `./docs` como fuente.
- Ignorar el impacto del Service Worker en la visualización de cambios.
- Dejar imports no usados o errores de consola que rompan el proceso de producción.

---
*Guardado en la memoria del proyecto para cumplimiento estricto.*
