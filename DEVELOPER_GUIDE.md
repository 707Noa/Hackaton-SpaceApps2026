# GUIA DE DESARROLLO Y ARQUITECTURA TECNICA (REACT + VITE)
## MARS OUTPOST: HORIZONTE ROJO · DEMO 2D PIXEL ART EN REACT
### NASA International Space Apps Challenge 2026 · Build a Junior Astronaut Mission Trainer

---

## 1. Alcance Tecnico y Arquitectura del Entregable

### 1.1 Naturaleza del Software
El proyecto esta construido al 100% en **React 18 + Vite**, cumpliendo con la especificacion tecnica de una **Demo / Prototipo Funcional de Demostracion (Proof of Concept)**. 

Combina la reactividad de componentes modulares de React con un motor de renderizado procedural en **HTML5 Canvas 2D (Pixel Art)** y sintesis de sonido en tiempo real mediante **Web Audio API**.

### 1.2 Principios de Diseno
* **Ejecucion en el Cliente (Client-Side SPA):** No requiere servidores backend ni bases de datos remotas que puedan fallar en la evaluacion.
* **Componentizacion Estricta:** La interfaz se divide en componentes independientes para que los tres desarrolladores trabajen en paralelo.
* **Compilacion Rapida con Vite:** Tiempo de construccion inferior a 3 segundos (`npm run build`).

### 1.3 Estructura de Directorios del Frontend
Toda la aplicacion de React se encuentra en `Hackaton-SpaceApps2026/frontend/`:

```text
Hackaton-SpaceApps2026/frontend/
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx                   # Punto de entrada de React
    ├── App.jsx                    # Orquestador principal de estado y modales
    ├── index.css                  # Estilos globales y clases pixel-art
    ├── data/
    │   └── gameData.js            # Estado inicial, eventos de 7 Soles y fuentes NASA
    ├── services/
    │   ├── audioService.js        # Sintetizador procedural Web Audio de 8 bits
    │   ├── pixelArtRenderer.js    # Motor de dibujo de sprites (cúpulas, rover, astronautas)
    │   └── gameEngine.js          # Calculos matematicos de recursos y transiciones
    └── components/
        ├── TelemetryHUD.jsx       # Consola superior de los 6 recursos y Sol
        ├── PixelCanvas.jsx        # Lienzo Canvas animado a 60 FPS e interactivo
        ├── ActionControls.jsx     # Botones arcade de acciones del Comandante
        ├── StartModal.jsx         # Pantalla de bienvenida y registro de Cadete
        ├── EventModal.jsx         # Modal de incidentes diarios con 2 opciones
        ├── NasaScienceModal.jsx   # Ficha emergente "Origen del Dato Cientifico NASA"
        └── CertificateModal.jsx   # Diploma oficial de Cadete Junior para imprimir
```

---

## 2. Asignacion de Trabajo Independiente (3 Desarrolladores en React)

Para que los tres programadores avancen en paralelo sin sobreescribir codigo ajeno, se asignan modulos y componentes especificos:

```text
[SQUAD DE SOFTWARE REACT - 3 INTEGRANTES]
│
├── Desarrollador 1: Componentes Visuales, Canvas Pixel Art y HUD
├── Desarrollador 2: Motor de Calculo, Estado Global y Reglas de Recursos
└── Desarrollador 3: Audio Chiptune, Modales de Ciencia NASA y Certificado
```

---

### 2.1 DESARROLLADOR 1: Componentes Visuales, Canvas Pixel Art y HUD

#### A. Archivos y Componentes Asignados:
* `src/services/pixelArtRenderer.js`
* `src/components/PixelCanvas.jsx`
* `src/components/TelemetryHUD.jsx`
* `src/components/ActionControls.jsx`

#### B. Responsabilidades Concretas:
1. **Lienzo Interactivo `PixelCanvas.jsx`:**
   * Controla el bucle `requestAnimationFrame` que renderiza a 60 FPS la base en el crater Jezero.
   * Administra la animacion del rover cuando sale a limpiar paneles y el patrullaje de los cuatro astronautas.
   * Detecta clics sobre los modulos (Agrodome, paneles solares, MOXIE) o sobre los astronautas para desplegar mensajes en pantalla.
2. **Consola `TelemetryHUD.jsx`:**
   * Muestra las barras de porcentaje de los seis recursos (Energia, Agua, Oxigeno, Comida, Escudo, Polvo).
   * Gestiona el contador de Soles (Sol 01 a 07) y el boton de silenciamiento de audio.
3. **Botonera `ActionControls.jsx`:**
   * Disena los botones de accion del Comandante (Cultivar, Limpiar Polvo, MOXIE, Reciclar Agua, Bunker, Tierra y Siguiente Sol).

#### C. Datos Cientificos Asociados:
* **Perseverance Mastcam-Z:** Representacion visual del relieve y colores del Cráter Jezero.
* **Mecanica del Rover:** Modelado del chasis y brazo con cepillo para remocion de regolito.

---

### 2.2 DESARROLLADOR 2: Motor de Calculo, Estado Global y Reglas de Recursos

#### A. Archivos y Componentes Asignados:
* `src/services/gameEngine.js`
* `src/data/gameData.js`
* Soporte en la logica central de `src/App.jsx`

#### B. Responsabilidades Concretas:
1. **Logica de Transicion de Sol (`advanceSolState`):**
   * Modela la generacion fotovoltaica bruta y su reduccion por opacidad del polvo:
     $$\text{Generacion Neta} = \text{Generacion Base} \times (1 - \text{Polvo} \times 0.7) - \text{Consumo Base}$$
   * Descuenta el consumo metabolico diario de agua, oxigeno y raciones de comida.
   * Incrementa la acumulacion natural de polvo marciano (+4% por Sol).
2. **Ciclo de Cultivo del Agrodome:**
   * Al sembrar: descuenta agua y energia inmediatamente.
   * Progresion de maduracion en dos Soles y cosecha automatica (+25 Comida, +8 Oxigeno).
3. **Acciones Tacticas (`executeAction`):**
   * Limpieza de paneles: lleva el polvo a 0% a cambio de 10 unidades de energia.
   * Generacion MOXIE: produce 18 unidades de oxigeno a cambio de 12 unidades de energia.
   * Reciclaje ECLSS: purifica 16 unidades de agua a cambio de 8 unidades de energia.
4. **Calculo del Reporte Final (`generateReport`):**
   * Calcula el puntaje de supervivencia promedio y determina el rango alcanzado (Comandante Supremo, Oficial de Sistemas, Cadete Junior).

#### C. Datos Cientificos Asociados:
* **NASA MEDA:** Tasa de atenuacion de luz solar por polvo marciano.
* **ISS ECLSS:** Eficiencia del 80-98% en reciclaje hidrico en circuito cerrado.

---

### 2.3 DESARROLLADOR 3: Audio Chiptune, Modales de Ciencia NASA y Certificado

#### A. Archivos y Componentes Asignados:
* `src/services/audioService.js`
* `src/components/EventModal.jsx`
* `src/components/NasaScienceModal.jsx`
* `src/components/CertificateModal.jsx`
* `src/components/StartModal.jsx`

#### B. Responsabilidades Concretas:
1. **Sintetizador Procedural `audioService.js`:**
   * Sonidos retro de 8 bits generados con Web Audio API (bips, alarmas de emergencia, sonido de motor del rover, fanfarria de victoria).
2. **Modal de Eventos Diarios `EventModal.jsx`:**
   * Despliega el incidente critico de cada Sol (tormentas de arena, desabastecimiento, alertas de radiacion) con dos alternativas de eleccion y costos transparentes.
   * Incluye el boton "Origen del Dato (NASA)".
3. **Ficha de Procedencia `NasaScienceModal.jsx`:**
   * Ventana emergente que expone la explicacion cientifica real adaptada a ninos de 7 a 12 anos citando formalmente los instrumentos de la NASA.
4. **Generador de Certificado `CertificateModal.jsx`:**
   * Despliega el Diploma Oficial de Comandante Junior con el nombre del usuario, insignias alcanzadas y boton nativo de impresion (`window.print()`).

#### C. Datos Cientificos Asociados:
* **NASA CCMC DONKI:** Alertas de Clima Espacial y Eyecciones de Masa Coronal (CME).
* **NASA MOXIE:** Informes de produccion de oxigeno mediante electrolisis de CO2.
* **NASA Veggie y OSDR:** Investigacion sobre cultivo de plantas bajo microgravedad y ambientes extremos.

---

## 3. Instrucciones de Ejecucion y Pruebas

### 3.1 Modo Desarrollo (Hot Reload)
Para ejecutar la aplicacion en modo interactivo de desarrollo:

```bash
cd Hackaton-SpaceApps2026/frontend
npm run dev
```
La aplicacion estara disponible de inmediato en `http://localhost:3000`.

### 3.2 Compilacion para Produccion (Build)
Para compilar y verificar que no existen errores de sintaxis o empaquetado:

```bash
cd Hackaton-SpaceApps2026/frontend
npm run build
```
Los archivos estaticos optimizados se generan en la carpeta `frontend/dist/`.

### 3.3 Despliegue en la Nube (Vercel / Netlify / GitHub Pages)
Dado que es un proyecto de Vite estandar:
1. **Vercel / Netlify:** Importar el repositorio y configurar el directorio raiz como `Hackaton-SpaceApps2026/frontend`. El comando de construccion es `npm run build` y la carpeta de salida es `dist`.
2. El despliegue toma menos de 60 segundos y entrega una URL publica segura con HTTPS para los jueces de la NASA.
