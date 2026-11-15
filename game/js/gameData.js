// MARS OUTPOST: Game Data & NASA Scientific Knowledge Base
// Specially tailored for young explorers (7-12 years old)

export const INITIAL_GAME_STATE = {
  cadetName: "Cadete",
  sol: 1,
  maxSols: 7,
  isNight: false,
  roverTask: null, // 'cleaning', 'exploring', null
  roverProgress: 0,
  resources: {
    energy: 85,    // 0 - 100 UJ
    water: 75,     // 0 - 100 UJ
    oxygen: 90,    // 0 - 100 UJ
    food: 65,      // 0 - 100 UJ
    shield: 90,    // 0 - 100 UJ
    dust: 15       // 0 - 100 % (Dust coverage on solar panels)
  },
  crops: {
    planted: false,
    stage: 0, // 0: empty, 1: seeds, 2: sprouts, 3: ripe
    solsToHarvest: 0
  },
  modules: {
    habitat: { name: "Cúpula Hábitat", status: "ok" },
    agrodome: { name: "Invernadero Agrodome", status: "ok" },
    powerCore: { name: "Matriz Solar y Baterías", status: "ok" },
    lifeSupport: { name: "ECLSS y MOXIE", status: "ok" },
    shield: { name: "Búnker de Regolito", status: "ok" },
    comms: { name: "Antena Espacio Profundo", status: "ok" }
  },
  crew: [
    { id: "alex", name: "Alex", role: "Comandante", color: "#E24A3B", x: 220, y: 195, vx: 0.3, phrase: "¡El cráter Jezero es fascinante! Revisemos la energía." },
    { id: "maya", name: "Dra. Maya", role: "Botánica", color: "#10B981", x: 380, y: 195, vx: -0.25, phrase: "Las lechugas espaciales necesitan luz y agua limpia." },
    { id: "leo", name: "Leo", role: "Ingeniero", color: "#F59E0B", x: 120, y: 195, vx: 0.2, phrase: "El polvo marciano es muy fino. ¡Usemos el cepillo del rover!" },
    { id: "sam", name: "Sam", role: "Soporte Vital", color: "#38BDF8", x: 290, y: 195, vx: -0.3, phrase: "¡MOXIE convierte el CO2 de Marte en oxígeno puro!" }
  ],
  decisionsHistory: [],
  earthResponsePending: false,
  gameOver: false,
  victory: false
};

export const NASA_SOURCES = {
  "meda": {
    title: "NASA Perseverance: Sensor Meteorológico MEDA",
    mission: "Mars 2020 Perseverance Rover",
    location: "Cráter Jezero, Marte",
    badge: "DATO REAL NASA",
    text: "El rover Perseverance tiene una estación del clima llamada MEDA en el cráter Jezero. En 2021, MEDA descubrió que el polvo marciano es tan fino como el talco. Los vientos levantan remolinos gigantes que cubren los paneles solares, bloqueando los rayos del Sol y reduciendo la electricidad que pueden producir."
  },
  "moxie": {
    title: "NASA MOXIE: La Máquina que Fabrica Oxígeno",
    mission: "Mars 2020 Perseverance Rover",
    location: "Cráter Jezero, Marte",
    badge: "TECNOLOGÍA REAL NASA",
    text: "El aire de Marte tiene 95% de dióxido de carbono (CO2) y no se puede respirar. La NASA envió un instrumento del tamaño de una tostadora llamado MOXIE. Calienta el aire marciano a 800 °C para separar los átomos y producir oxígeno puro. ¡MOXIE demostró que futuros astronautas podrán fabricar su propio aire en Marte!"
  },
  "eclss": {
    title: "NASA ECLSS: El Gran Reciclador de Agua",
    mission: "Estación Espacial Internacional (ISS)",
    location: "Órbita terrestre baja",
    badge: "SISTEMA OPERATIVO NASA",
    text: "Llevar agua al espacio es muy pesado y costoso. En la Estación Espacial, el sistema ECLSS de la NASA purifica y recicla hasta el 98% de todos los líquidos, incluyendo el sudor de los astronautas y la humedad del aire, convirtiéndolos en agua cristalina más pura que la de cualquier botella."
  },
  "veggie": {
    title: "NASA Veggie y OSDR: Cultivos Espaciales",
    mission: "NASA Biological & Physical Sciences",
    location: "Estación Espacial Internacional",
    badge: "BIOLOGÍA ESPACIAL NASA",
    text: "En el espacio no hay tierra fértil. La NASA usa el experimento Veggie: bandejas especiales con almohadillas de arcilla, luces LED rojas y azules, y agua con nutrientes. Los astronautas ya cosecharon lechugas rojas, rábanos y tomates miniatura en el espacio."
  },
  "donki": {
    title: "NASA DONKI: Base de Datos de Clima Espacial",
    mission: "NASA Goddard Space Flight Center",
    location: "Heliosfera Solar",
    badge: "CLIMA ESPACIAL NASA",
    text: "Marte no tiene un campo magnético como la Tierra para frenar la radiación. Cuando el Sol lanza una llamarada de radiación (CME), los satélites de la NASA en DONKI mandan una alerta. Los astronautas deben refugiarse bajo metros de polvo y rocas marcianas (regolito) para estar a salvo."
  }
};

export const SOL_EVENTS = [
  {
    sol: 1,
    title: "¡Bienvenido a Jezero! Llegada del Puesto",
    subtitle: "Sol 01: Verificación de Sistemas",
    description: "Has alunizado en el antiguo delta del río de Jezero. Los 4 astronautas están a salvo y todos los módulos están en línea. ¿Qué ordenas como tu primera prioridad de comandante?",
    nasaSourceKey: "meda",
    choices: [
      {
        id: "c1_a",
        text: "⚡ Cargar Baterías al Máximo",
        detail: "Asegura calefacción para la noche marciana gélida.",
        effects: { energy: 10, food: -5 }
      },
      {
        id: "c1_b",
        text: "🌱 Preparar el Invernadero Agrodome",
        detail: "Alista las bandejas hidropónicas para sembrar comida pronto.",
        effects: { water: -8, energy: -5, food: 8 }
      }
    ]
  },
  {
    sol: 2,
    title: "¡Tormenta de Polvo Marciano!",
    subtitle: "Sol 02: Alerta de Sensores MEDA",
    description: "El instrumento MEDA detectó un remolino de arena. El polvo fino cubrió un 40% de los paneles solares y la energía solar empieza a caer. ¿Cómo respondes?",
    nasaSourceKey: "meda",
    choices: [
      {
        id: "c2_a",
        text: "🚜 Enviar al Rover a Limpiar los Paneles",
        detail: "Gasta energía de baterías hoy, pero deja los paneles relucientes.",
        effects: { energy: -12, dust: -40 },
        actionTrigger: "rover_clean"
      },
      {
        id: "c2_b",
        text: "💤 Apagar Luces y Entrar en Ahorro",
        detail: "Ahorra energía hoy, pero los paneles seguirán sucios.",
        effects: { energy: 2, dust: 10, oxygen: -5 }
      }
    ]
  },
  {
    sol: 3,
    title: "La Huarta Espacial Tiene Sed",
    subtitle: "Sol 03: Experimento Veggie",
    description: "Los brotes de lechuga espacial están creciendo rápido, pero consumen más agua y luz de la calculada. ¿Deseas darles riego completo o racionar?",
    nasaSourceKey: "veggie",
    choices: [
      {
        id: "c3_a",
        text: "💧 Riego Completo con Luces LED",
        detail: "Gasta agua y energía, pero acelera la cosecha y da oxígeno extra.",
        effects: { water: -14, energy: -8, food: 22, oxygen: 8 }
      },
      {
        id: "c3_b",
        text: "🌱 Riego Mínimo de Ahorro",
        detail: "Guarda agua para la tripulación, pero el cultivo tardará más.",
        effects: { water: -4, food: 5 }
      }
    ]
  },
  {
    sol: 4,
    title: "Filtro Atascado en el Reciclador ECLSS",
    subtitle: "Sol 04: Soporte Vital en Alerta",
    description: "Las sales del agua marciana taparon un filtro del reciclador. El reciclaje bajó al 40% y el CO2 en cabina empieza a subir. ¿Qué ordenas?",
    nasaSourceKey: "eclss",
    choices: [
      {
        id: "c4_a",
        text: "🔧 Purgar Filtros y Reemplazar Cartucho",
        detail: "Usa energía de mantenimiento, pero recupera el 95% del agua y aire limpio.",
        effects: { energy: -14, water: 15, oxygen: 10 }
      },
      {
        id: "c4_b",
        text: "🚰 Usar Tanque de Agua de Emergencia",
        detail: "No gasta energía, pero gasta reservas no renovables.",
        effects: { water: -16, oxygen: -6 }
      }
    ]
  },
  {
    sol: 5,
    title: "¡Muestras del Delta y Fábrica MOXIE!",
    subtitle: "Sol 05: Ciencia en el Cráter",
    description: "El rover localizó rocas arcillosas en el delta que podrían guardar secretos del agua antigua de Marte. Para explorar, la tripulación necesita recargar mochilas de oxígeno.",
    nasaSourceKey: "moxie",
    choices: [
      {
        id: "c5_a",
        text: "🫁 Encender MOXIE a Toda Potencia",
        detail: "Convierte CO2 en abundancia de oxígeno puro usando electricidad.",
        effects: { energy: -16, oxygen: 24, shield: -4 }
      },
      {
        id: "c5_b",
        text: "📡 Enviar Solo al Dron Autónomo",
        detail: "Los astronautas se quedan adentro; ahorra energía pero recolecta menos datos.",
        effects: { energy: -5, shield: 6 }
      }
    ]
  },
  {
    sol: 6,
    title: "¡ALERTA SOLAR! Llamarada Solar DONKI",
    subtitle: "Sol 06: Tormenta de Radiación",
    description: "La NASA emitió alerta roja: una tormenta solar viaja directo a Marte. La base no tiene atmósfera gruesa para frenarla. ¡Debes actuar ya!",
    nasaSourceKey: "donki",
    choices: [
      {
        id: "c6_a",
        text: "🛡️ ¡Todos al Búnker Subterráneo de Regolito!",
        detail: "Mete a los 4 tripulantes bajo tierra. Seguridad total, pero pausa experimentos.",
        effects: { energy: -10, shield: 25 }
      },
      {
        id: "c6_b",
        text: "⚡ Reforzar Escudos Electromagnéticos",
        detail: "Deja a los astronautas en cabina, consumiendo mucha energía.",
        effects: { energy: -20, shield: -10 }
      }
    ]
  },
  {
    sol: 7,
    title: "Transmisión Final: Misión Cumplida",
    subtitle: "Sol 07: Conexión con Houston",
    description: "¡Último Sol de la misión! La tripulación ha sobrevivido en Jezero. Houston espera el informe final con los datos de MEDA, MOXIE y los cultivos de Marte.",
    nasaSourceKey: "meda",
    choices: [
      {
        id: "c7_a",
        text: "📡 Transmisión de Alta Potencia a la Tierra",
        detail: "Envía todos los videos y ciencia a Houston gastando la energía final.",
        effects: { energy: -14 }
      },
      {
        id: "c7_b",
        text: "💾 Guardar en Memoria Local y Transmisión Económica",
        detail: "Asegura que el puesto quede cargado para la próxima tripulación.",
        effects: { energy: -4 }
      }
    ]
  }
];
