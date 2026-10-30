# Plan de Implementación de Integraciones y Correcciones

## 1. Corrección de Errores (Fix render loop)
- Investigar `DecoyScreens.tsx` y su interacción con `App.tsx` para evitar actualizaciones de estado durante el renderizado.
- Refactorizar las llamadas de actualización de estado si es necesario.

## 2. Integración de Firebase (Auth & Firestore)
- Configurar Firebase usando `set_up_firebase`.
- Configurar Google Sign-in usando `set_up_oauth`.
- Implementar Firestore para persistencia de datos (perfiles de usuario, eventos, configuraciones).

## 3. Integración de Google Maps
- Usar `google-maps-platform-ghp-integration` para integrar mapas.
- Añadir funcionalidad que use el mapa para grounding de información geoespacial en eventos de seguridad.

## 4. Implementación de Three.js
- Crear una nueva escena 3D usando `threejs` skill siguiendo las guías de diseño procedural.
- Integrar la escena en un componente React separado (`src/components/ThreeScene.tsx`) con un ref estable para el canvas WebGL.
- Añadir elementos 3D procedurales (nodos, luces, cámaras).

## 5. Verificación
- Ejecutar `compile_applet` y `lint_applet` tras cada bloque de cambios importantes.
- Pruebas manuales de las integraciones (Auth, Mapas, 3D).
