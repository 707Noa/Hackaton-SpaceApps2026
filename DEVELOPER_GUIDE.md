# GUIA DE DESARROLLO Y ARQUITECTURA TECNICA (REACT + BABYLON.JS)
## MARS OUTPOST: HORIZONTE ROJO · ARQUITECTURA MODULAR EN REACT CON MOTOR 3D BABYLON.JS
### NASA International Space Apps Challenge 2026 · Build a Junior Astronaut Mission Trainer

---

## 1. Alcance Tecnico y Arquitectura del Entregable

### 1.1 Naturaleza del Software
El proyecto esta construido al 100% en React 18 con Vite como empaquetador e integra el motor grafico profesional Babylon.js para la simulacion visual interactiva en tiempo real del puesto avanzado en el Crater Jezero de Marte.

Cumple rigurosamente con la especificacion de una Demo / Prototipo Funcional de Demostracion (Proof of Concept) para la hackathon:
* **Ejecucion en el Cliente (Client-Side SPA):** No requiere servidores backend ni bases de datos remotas.
* **Arquitectura Modular por Dominios:** El codigo esta dividido en cinco modulos funcionales independientes (Agrodome, Power Core, Life Support, Shield System y Mission Control) para permitir que los desarrolladores trabajen en paralelo sin colisiones de Git.
* **Motor 3D Profesional Babylon.js:** Gestiona la camara orbital adaptada para ninos de 7 a 12 anos, el relieve del crater Jezero, la iluminacion solar de Marte, el ciclo de dia y noche, las tormentas de polvo y las animaciones autonomas del rover.
* **Compilacion Rapida con Vite:** Tiempo de construccion de aproximadamente 5 segundos (`npm run build`).

### 1.2 Estructura de Directorios del Frontend
Toda la aplicacion reside en `Hackaton-SpaceApps2026/frontend/`:

```text
Hackaton-SpaceApps2026/frontend/
├── package.json               # Dependencias (React, Babylon.js, Lucide, Vite)
├── vite.config.js             # Configuracion de empaquetado optimizado
├── index.html                 # Punto de entrada con motor Babylon.js via CDN
└── src/
    ├── main.jsx               # Render inicial de React
    ├── App.jsx                # Orquestador principal de estado y vistas de modulo
    ├── index.css              # Estilos visuales retro y clases de interfaz adaptativa
    ├── data/
    │   └── gameData.js        # Estado inicial canonico, eventos de 7 Soles y fuentes NASA
    ├── services/
    │   ├── audioService.js    # Sintetizador procedural Web Audio de 8 bits
    │   ├── babylonSceneManager.js # Motor 3D Babylon.js (terreno, modulos, rover, particulas)
    │   ├── pixelTextureFactory.js # Generador de texturas pixel art 16-bit procedurales
    │   └── gameEngine.js      # Calculos matematicos de recursos y trade-offs
    ├── components/
    │   ├── TelemetryHUD.jsx   # Barra superior con estado de Sol, misiones y avance
    │   ├── BabylonViewport.jsx# Visor 3D interactivo con movimiento WASD y proximidad
    │   ├── ResourceDistributionPanel.jsx # Distribucion visual de los 6 recursos
    │   ├── StartScene.jsx     # Escenario 1: Pantalla completa de bienvenida
    │   ├── MissionsModal.jsx  # Modal de objetivos y misiones NASA
    │   ├── EventModal.jsx     # Modal de incidentes diarios con 2 opciones
    │   ├── NasaScienceModal.jsx # Ficha emergente "Origen del Dato Cientifico NASA"
    │   └── CertificateModal.jsx # Diploma oficial de Cadete Junior para imprimir
    └── modules/
        ├── agrodome/
        │   └── AgrodomeView.jsx      # Modulo 1: Invernadero y cultivos espaciales
        ├── power-core/
        │   └── PowerCoreView.jsx     # Modulo 2: Energia solar, baterias y polvo MEDA
        ├── life-support/
        │   └── LifeSupportView.jsx   # Modulo 3: Soporte vital ECLSS y MOXIE
        ├── shield-system/
        │   └── ShieldSystemView.jsx  # Modulo 4: Bunker de regolito y alertas DONKI
        └── mission-control/
            └── MissionControlView.jsx# Modulo 5: Cronograma de 7 Soles y enlace DSN
```

---

## 2. Asignacion de Trabajo Independiente (3 Desarrolladores en React + Babylon.js)

```text
[SQUAD DE SOFTWARE REACT + BABYLON.JS - 3 INTEGRANTES]
│
├── Desarrollador 1: Escena 3D Babylon.js y Modulo Power Core
├── Desarrollador 2: Modulo Agrodome, Modulo Life Support y Motor de Simulacion
└── Desarrollador 3: Modulo Shield System, Modulo Mission Control, Audio y Modales
```

---

### 2.1 DESARROLLADOR 1: Escena 3D Babylon.js y Modulo Power Core

#### A. Archivos y Componentes Asignados:
* `src/services/babylonSceneManager.js`
* `src/services/pixelTextureFactory.js`
* `src/components/BabylonViewport.jsx`
* `src/modules/power-core/PowerCoreView.jsx`

#### B. Responsabilidades Concretas:
1. **Escena 3D Babylon.js (`babylonSceneManager.js`):**
   * Controla la camara orbital `ArcRotateCamera` con limites de zoom y elevacion configurados para que ninos de 7 a 12 anos no se desorienten.
   * Modela los modulos de la base en Jezero (Cupula Habitat, Invernadero Agrodome transparente, paneles solares con inclinacion y caja termica MOXIE).
   * Sistema de particulas de polvo marciano que incrementa su intensidad segun el nivel de opacidad atmosferica (datos MEDA).
   * Animacion del rover de exploracion cuando se activa la orden de limpiar paneles.
2. **Componente React `BabylonViewport.jsx`:**
   * Monta el lienzo WebGL y sincroniza los cambios de estado de React con la escena 3D (iluminacion diurna/nocturna, escalado de cultivos, tinte de polvo).
   * Detecta clics en los objetos 3D mediante Raycasting para cambiar automaticamente la vista de la consola al modulo seleccionado.
3. **Consola `PowerCoreView.jsx`:**
   * Visualizacion de almacenamiento en baterias, generacion solar estimada y factor de atenuacion por polvo MEDA.
   * Acciones operativas: Despliegue de rover para limpieza fotovoltaica y activacion de protocolo de ahorro nocturno.

#### C. Datos Cientificos Asociados:
* **Perseverance MEDA:** Medicion de factor tau de opacidad atmosferica por polvo en suspension en Jezero.
* **Perseverance Mastcam-Z:** Geologia y colorimetria del suelo marciano.

---

### 2.2 DESARROLLADOR 2: Modulo Agrodome, Modulo Life Support y Motor de Simulacion

#### A. Archivos y Componentes Asignados:
* `src/modules/agrodome/AgrodomeView.jsx`
* `src/modules/life-support/LifeSupportView.jsx`
* `src/services/gameEngine.js`

#### B. Responsabilidades Concretas:
1. **Modulo Agrodome (`AgrodomeView.jsx`):**
   * Gestion de bandejas de cultivo hidropónico con estados visibles: Vacio, Brote, Maduracion y Listo para Cosechar.
   * Acciones: Sembrar cultivo Veggie (costo inmediato de agua y energia con beneficio diferido), cosechar alimentos e iluminacion LED potenciada.
2. **Modulo Life Support (`LifeSupportView.jsx`):**
   * Consola de gases y liquidos: Reservas de agua potable, oxigeno respirable y porcentaje de concentracion de dioxido de carbono.
   * Acciones: Electrolisis MOXIE (+18 O2), reciclador de circuito cerrado ECLSS (+16 H2O) y renovacion de filtros quimicos de CO2.
3. **Motor de Simulacion (`gameEngine.js`):**
   * Implementacion de las formulas matematicas de balance diario por Sol (produccion solar ajustada por polvo, consumo metabolico de 4 astronautas y maduracion de cosechas).
   * Evaluacion de condiciones de fallo critico y victoria al finalizar el Sol 7.

#### C. Datos Cientificos Asociados:
* **NASA Veggie y OSDR:** Cultivos espaciales en condiciones de microgravedad y espectros luminosos LED rojo y azul.
* **Perseverance MOXIE:** Electrolisis de dioxido de carbono marciano a 800 grados Celsius.
* **ISS ECLSS:** Recuperacion de circuito cerrado de agua en estaciones tripuladas.

---

### 2.3 DESARROLLADOR 3: Modulo Shield System, Modulo Mission Control, Audio y Modales

#### A. Archivos y Componentes Asignados:
* `src/modules/shield-system/ShieldSystemView.jsx`
* `src/modules/mission-control/MissionControlView.jsx`
* `src/components/TelemetryHUD.jsx`
* `src/components/ResourceDistributionPanel.jsx`
* `src/services/audioService.js`
* `src/components/StartScene.jsx`
* `src/components/MissionsModal.jsx`
* `src/components/EventModal.jsx`
* `src/components/NasaScienceModal.jsx`
* `src/components/CertificateModal.jsx`

#### B. Responsabilidades Concretas:
1. **Modulo Shield System (`ShieldSystemView.jsx`):**
   * Monitor de radiacion ambiental y estado del bunker de regolito marciano.
   * Acciones: Activacion de protocolo de refugio contra tormentas solares, planificacion de salidas EVA al delta antiguo y refuerzo de manto de regolito.
2. **Modulo Mission Control (`MissionControlView.jsx`):**
   * Cronograma de 7 Soles con indicador de progreso.
   * Simulador de latencia de telecomunicaciones Tierra-Marte (14.2 minutos luz) mediante la Red del Espacio Profundo (DSN).
   * Boton maestro de transicion diaria de Sol.
3. **Consola `TelemetryHUD.jsx` y Modales:**
   * Barra superior con medidores de los 6 recursos, salud de la tripulacion, saldo de acciones diarias y pestañas de navegacion entre modulos.
   * Fichas de procedencia cientifica NASA (`NasaScienceModal.jsx`) con enlaces oficiales.
   * Diploma oficial descargable e imprimible (`CertificateModal.jsx`).
4. **Sintetizador Procedural `audioService.js`:**
   * Emision de tonos Quindar de radio de la NASA, alarmas y fanfarrias con Web Audio API nativo.

#### C. Datos Cientificos Asociados:
* **NASA CCMC DONKI:** Catalogo de eyecciones de masa coronal (CME) y clima espacial.
* **Curiosity RAD:** Mediciones reales de dosis de radiacion en superficie marciana (~0.67 mSv/sol).
* **NASA Deep Space Network (DSN):** Retardo de propagacion de ondas de radio entre la Tierra y Marte.

---

## 3. Instrucciones de Ejecucion y Pruebas

### 3.1 Modo Desarrollo (Hot Reload)
```bash
cd Hackaton-SpaceApps2026/frontend
npm run dev
```
Disponible localmente en `http://localhost:3000`.

### 3.2 Compilacion para Produccion (Build)
```bash
cd Hackaton-SpaceApps2026/frontend
npm run build
```
Genera los archivos compilados en `frontend/dist/` en aproximadamente 5 segundos.

### 3.3 Despliegue Publico
Compatible con despliegue en un clic en Vercel, Netlify o GitHub Pages apuntando a la carpeta `Hackaton-SpaceApps2026/frontend`.
