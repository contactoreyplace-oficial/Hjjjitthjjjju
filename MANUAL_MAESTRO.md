# MANUAL MAESTRO DEFINITIVO — REMIX STEALTHCAM PRO
### SISTEMA TÁCTICO DE CONTRAESPIONAJE, VISIÓN NOCTURNA Y FORENSE LOCAL-FIRST
**Versión:** 3.5.0-Tactical (Revisión Final Corregida)  
**Clasificación:** Operacional & Forense  
**Paradigma:** Soberanía de Datos (100% Local por defecto, Nube Opt-In)

---

## 1. FICHA TÉCNICA Y ESPECIFICACIONES MAESTRAS

| Componente | Especificación Técnica |
| :--- | :--- |
| **Arquitectura Base** | Progressive Web App (PWA) construida sobre React 19 y TypeScript 5.8+ |
| **Herramienta de Construcción** | Vite 8.3 con soporte de Service Workers y módulos ES6 |
| **Motor de Estilos** | Tailwind CSS v4 (Zero-runtime, diseño táctico de bajo consumo lumínico) |
| **Almacenamiento Primario** | IndexedDB (`StealthCamPro_DB` v1) — Motor transaccional aislado en el dispositivo |
| **Almacenamiento Secundario** | Google Cloud / Firestore (Opcional, condicionado a consentimiento explícito) |
| **Autenticación en Nube** | Firebase Auth v13 (Google Provider / Sesión Federada) |
| **Seguridad de la Bóveda** | Bloqueo por PIN de 4 dígitos o Patrón gestual 3x3 con purga cíclica |
| **Formatos Soportados** | • **Video:** `.mp4` (H.264/AVC1 con fallback WebM)<br>• **Imágenes:** `.jpg` (JPEG 92% calidad analítica)<br>• **Vectores Forenses:** `.svg` (Esquemas vectoriales XML independientes) |
| **Visión Computacional** | Bucle analítico en Canvas 2D a 60 FPS con tablas de consulta (LUTs) FLIR y Ironbow |
| **Telemetría y Sensores** | Browser Geolocation API, Screen Wake Lock API, Web Audio API, Vibration API |

---

## 2. ARQUITECTURA DEL SISTEMA Y TOPOLOGÍA DE FLUJO

El sistema opera bajo un modelo multicapa sin dependencias externas obligatorias para su funcionamiento:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CAPA DE PRESENTACIÓN                             │
│  [ Header & Estado Red ] ── [ TacticalHUD ] ── [ Pantallas Señuelo Decoy ]  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    MOTOR DE VISIÓN ARTIFICIAL (CV ENGINE)                   │
│  • Shaders de Espectro (Fósforo Gen3, Térmico FLIR, IR Spectrum, Starlight) │
│  • Detector de Movimiento Diferencial & PIR Térmico                         │
│  • Cinemática: Esqueleto Biométrico, Trayectoria y Detección de Acecho     │
│  • Escáner de Glints Ópticos (Micro-lentes clandestinas)                    │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    CONTROLADOR CENTRAL & GESTOR DE EVENTOS                  │
│  • Compresión Adaptativa de Cuadros (Descarte de fotogramas estáticos)     │
│  • Disparador Georreferenciado: Latitud + Longitud en Eventos Críticos      │
│  • Sintetizador de Alarmas y Alertas Hápticas                              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                       CAPA DE DATOS LOCAL-FIRST (DB)                        │
│  IndexedDB (Grabaciones .mp4/.jpg/.svg, Eventos, Configuración, Bóveda)     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (Solo con Aceptación Explícita)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                  NUBE SOBERANA OPT-IN (FIREBASE FIRESTORE)                   │
│  Sincronización condicional de metadatos y evidencia forense respaldada     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. MANUAL OPERACIONAL PASO A PASO (DE INICIO A FIN)

### FASE 1: INICIALIZACIÓN Y PERMISOS DE DISPOSITIVO
1. **Acceso al Sistema:** Ingrese a la URL de la aplicación a través de un navegador moderno con soporte HTTPS (necesario para el acceso a cámaras y geolocalización).
2. **Concesión de Permisos de Hardware:**
   * El navegador solicitará acceso a la **Cámara** y al **Micrófono**. Presione *Permitir*.
   * *Si hubo una denegación previa:* La pantalla mostrará una guía de recuperación. Haga clic en el candado de la barra de direcciones del navegador, restablezca los permisos a *Permitir* y pulse *Reintentar Acceso*.
3. **Calibración Automática:** El sistema encenderá el sensor y ajustará el balance de fotogramas con el filtro Normal.

### FASE 2: MONITOREO Y SELECCIÓN DE FILTRO TÁCTICO
Desde la barra inferior del visor, seleccione el filtro óptico según las condiciones del entorno:
* **Fósforo Verde (`night-green`):** Para vigilancia con luz residual ultra baja. Utiliza amplificación gamma no lineal y grano cuántico simulado.
* **FLIR Térmico (`thermal`):** Identifica firmas térmicas humanas mediante una rampa de color índigo $\to$ rojo $\to$ llama $\to$ blanco.
* **Predator Ironbow (`predator-thermal`):** Aísla la temperatura corporal con alto contraste contra fondos fríos.
* **Starlight Boost (`starlight-boost`):** Acumula temporalmente fotones entre fotogramas sucesivos en un buffer de memoria de precisión flotante.
* **Analizador IR (`ir-spectrum`):** Detecta fuentes de radiación infrarroja activa y emisores de visión nocturna externos apuntando hacia la cámara.

### FASE 3: CALIBRACIÓN DE SENSIBILIDADES Y DETECCIÓN
Acceda al panel de **Ajustes de Detección** (icono de engranaje):
1. **Detección de Movimiento:** Ajuste el umbral entre 10% y 90%.
2. **PIR Térmico Pasivo:** Defina el umbral de sensibilidad infrarroja para siluetas humanas (predeterminado 60%).
3. **Escáner de Cámaras Ocultas:** Active la casilla *Detector de Lentes Clave* para analizar destellos cóncavos especulares.
4. **Grabación Automática:** Configure si desea que el sistema inicie una grabación `.mp4` de 10 a 60 segundos de forma autónoma al dispararse una alarma.

### FASE 4: CAPTURA DE EVIDENCIA EN LOCAL
El HUD dispone de tres botones dedicados de captura directa:
* **`[FOTO .JPG]`:** Captura instantánea en alta resolución con el procesamiento de imagen aplicado.
* **`[VECTOR .SVG]`:** Genera un archivo vectorial matemático con la cuadrícula de radar, retículas, cajas de detección, esqueleto biométrico y telemetría exacta.
* **`[REC .MP4]`:** Inicia la grabación continua en video. La **Compresión Adaptativa** se activa de inmediato, analizando el diferencial de movimiento para no desperdiciar espacio en fotogramas estáticos.

### FASE 5: PROTOCOLO DE CAMUFLAJE ENCUBIERTO (DECOY SCREENS)
Para realizar vigilancia sin que terceros sospechen que la cámara está operando:
1. Pulse el botón **Camuflaje (`Decoy`)** en la barra de control.
2. Seleccione una de las siguientes interfaces señuelo:
   * **Calculadora:** Muestra una calculadora aritmética real y plenamente operativa. Ingrese su PIN (ej. `0000`) y presione `=` para regresar al HUD.
   * **Pantalla Negra (OLED Stealth):** Apaga la pantalla visualmente manteniendo el sensor y la grabación activa. Toque dos veces seguidas la pantalla para salir.
   * **Pantalla de Bloqueo:** Emula la pantalla de reposo del teléfono.
   * **Actualización del Sistema:** Muestra un progreso falso de actualización de software.
   * **Terminal Matrix:** Simula una consola de comandos interactiva de ciberseguridad.

### FASE 6: ADMINISTRACIÓN DE LA BÓVEDA SEGURA
1. Acceda a la **Bóveda** desde el menú principal.
2. Ingrese su PIN de 4 dígitos o trace su patrón de 9 nodos.
3. **Pestañas de Filtrado:** Filtre por *Todos*, *Videos (.MP4)*, *Fotos (.JPG)* o *Esquemas (.SVG)*.
4. **Auto-Borrado de Grabaciones:** En el menú de la bóveda, seleccione el periodo de retención deseado:
   * *Desactivado (Manual)*
   * *7 días*
   * *30 días*
   * *90 días*  
   El motor purgará automáticamente los registros vencidos para evitar saturar el almacenamiento del dispositivo.
5. **Descarga:** Pulse el botón de descarga en cualquier elemento para exportarlo a la carpeta de descargas de su sistema operativo.

### FASE 7: PROTOCOLO DE NUBE SOBERANA (CONSENTIMIENTO EXPLÍCITO)
1. De fábrica, **ningún archivo sube a la red**.
2. Para activar la sincronización, pulse sobre el indicador de nube.
3. Se desplegará el **Contrato de Consentimiento Informado**. El usuario debe pulsar conscientemente *Aceptar y Activar Respaldo*.
4. Una vez aceptado, podrá respaldar incidentes individualmente o activar el auto-respaldo continuo con su cuenta de Google.
5. Si revoca el consentimiento, el sistema regresa al modo 100% aislado.

### FASE 8: AUDITORÍA FORENSE Y GEOLOCALIZACIÓN
1. Abra el **Registro Táctico de Auditoría** (icono de escudo con lista).
2. Cada incidente crítico o de alta severidad registra:
   * Fecha y hora precisa.
   * Tipo de amenaza detectada.
   * **Coordenadas Satelitales GPS:** Latitud, Longitud y radio de error en metros capturados mediante la Geolocation API.
3. Esta información sirve como respaldo forense inmutable de la ubicación física del incidente.

---

## 4. MATRIZ DE PROBLEMAS CONOCIDOS, SOLUCIONES Y MEJORAS IMPLEMENTADAS

| Problema / Escenario | Diagnóstico Técnico | Solución Implementada en el Código |
| :--- | :--- | :--- |
| **Denegación de Permisos de Cámara** | El usuario canceló o el navegador bloqueó la cámara tras el primer arranque. | Implementación de pantalla de diagnóstico con botón de reintento y **Modo Feed Táctico Simulado (Demostración Forense)** a 60 FPS con siluetas humanas, termografía FLIR y escáner de lentes sin requerir hardware físico. |
| **Saturación del Almacenamiento Local** | Los videos sin comprimir en IndexedDB consumen la cuota del navegador rápidamente. | 1. Implementación de **Compresión Adaptativa** eliminando cuadros estáticos.<br>2. Sistema de **Auto-borrado configurable (7, 30, 90 días)** en `SecurityVault.tsx`. |
| **Falta de Compatibilidad de Video en iOS/Safari** | Safari no soporta grabación nativa en formato `.webm`. | Detección dinámica de códecs soportados priorizando `video/mp4;codecs=avc1` y `video/mp4`, garantizando extensiones correctas para reproducción nativa. |
| **Falsas Alarmas por Ruido en Escenas Oscuras** | El sensor digital genera grano que puede disparar el detector de movimiento. | Filtro de promediado espacial y umbral de área mínima en `cvEngine.ts`, requiriendo coherencia temporal de 3 fotogramas consecutivos. |
| **Dispositivo Bloqueado Suspende la Grabación** | El sistema operativo suspende la CPU y el canvas cuando la pantalla se apaga. | Integración de **Screen Wake Lock API** y modo de pantalla negra OLED que mantiene el hardware despierto sin emitir luz visible. |
| **Riesgo de Fuga de Datos a la Nube** | Apps comerciales suben datos a servidores sin control del usuario. | Aislamiento por diseño: Firestore solo se invoca si `cloudConsent.accepted === true`. Módulo `CloudConsentModal.tsx` como barrera estricta. |
| **Localización de Amenazas sin Coordenadas** | La auditoría registraba la hora pero no la ubicación del sensor en caso de intrusión. | Integración de la **Browser Geolocation API** en `addSecurityEvent` para incidentes de severidad alta y crítica. |

---

## 5. GUÍA DE MANTENIMIENTO Y BUENAS PRÁCTICAS

1. **Instalación como PWA:** Para la mejor experiencia en teléfonos móviles y tablets, presione el botón *Instalar Aplicación* en la barra superior o utilice la opción *Añadir a la pantalla de inicio* del navegador. Esto elimina las barras de navegación del explorador y permite pantalla completa táctica.
2. **Uso de Modo OLED:** En dispositivos con pantallas AMOLED / OLED, el uso del modo señuelo *Black Screen* reduce el consumo de batería en más de un 70% durante grabaciones prolongadas.
3. **Respaldo Periódico:** Si no utiliza la sincronización en la nube, recuerde exportar periódicamente los archivos `.mp4` y `.svg` de la bóveda mediante los botones de descarga directa para mantener espacio libre en su navegador.
4. **Auditoría Limpia:** Puede depurar el historial de eventos cuando lo considere oportuno desde el botón de papelera del modal de auditoría forense.
