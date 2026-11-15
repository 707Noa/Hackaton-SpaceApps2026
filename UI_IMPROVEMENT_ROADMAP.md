# Hoja de ruta: interfaz y HUD

## Objetivo

Hacer que la interfaz de Mars Outpost aproveche el espacio disponible en la página, comunique el estado de la misión de un vistazo y ayude al jugador a decidir qué hacer sin saturar la pantalla.

## Estado actual

- [x] Barra superior con energía, agua, oxígeno y CO₂.
- [x] Alertas priorizadas por gravedad con acceso al módulo relacionado.
- [x] Estados de alerta compartidos entre el HUD y el panel de recursos.
- [x] Balizas 3D para energía, Agrodome, soporte vital y escudo.
- [x] Página adaptable al ancho disponible del navegador.

## Próximas mejoras, por prioridad

### 1. Paneles contextuales y expandibles ✅

- Mantener visibles los indicadores esenciales y permitir ampliar cada sistema para consultar detalles.
- Al elegir una alerta o edificio, enfocar el panel correspondiente sin perder de vista la base.
- Mostrar por qué un sistema está en aviso y qué acción puede ayudar.

**Listo cuando:** se puede pasar rápidamente del resumen a los detalles de un sistema y volver sin abrir varias ventanas.

### 2. Cronología y previsión del próximo Sol ✅

- Añadir una línea de tiempo compacta con el Sol actual, eventos conocidos y respuestas pendientes de la Tierra.
- Anticipar consumos y cambios que ya estén definidos por las reglas del juego; no presentar estimaciones como datos seguros.
- Destacar las órdenes disponibles antes de avanzar el Sol.

**Listo cuando:** el jugador puede revisar qué se aproxima y preparar sus recursos antes de avanzar.

### 3. NOVA como copiloto contextual ✅

- Dar recomendaciones breves según las alertas y el estado de los módulos.
- Explicar la causa con el dato relevante, por ejemplo: “El polvo reduce la energía solar”.
- Ofrecer un acceso directo al sistema recomendado, sin ejecutar acciones por el jugador.

**Listo cuando:** cada recomendación se basa en el estado actual y conduce al panel relacionado.

### 4. Retroalimentación clara de las acciones ✅

- Mostrar cambios de recursos después de una acción, como `Agua -8` o `Oxígeno +18`.
- Diferenciar éxito, advertencia y error con animaciones breves y mensajes consistentes.
- Sincronizar la respuesta visual del HUD con el cambio que se ve en la base.

**Listo cuando:** después de cada acción se entiende qué cambió y por qué.

### 5. Mapa interactivo de la base ✅

- Añadir nombres y estados breves al enfocar o seleccionar un edificio.
- Permitir abrir el módulo asociado desde su indicador del mundo 3D.
- Mantener las señales legibles sin ocultar al astronauta ni los controles.

**Listo cuando:** se puede identificar el estado de un edificio y abrir su módulo directamente desde la escena.

### 6. Revisión móvil y accesibilidad ✅

- Reordenar HUD, recursos y controles para pantallas estrechas.
- No depender únicamente del color: acompañar cada estado con texto o icono.
- Revisar navegación por teclado, contraste, tamaño del texto y opción de reducir animaciones.

**Listo cuando:** las funciones principales se pueden usar en móvil y teclado, y las alertas se distinguen sin depender del color.

## Criterio general de diseño

Priorizar legibilidad y decisiones claras: la información urgente destaca, la secundaria se puede consultar y las animaciones nunca impiden jugar.
