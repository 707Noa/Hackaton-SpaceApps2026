// MARS OUTPOST: Master Game Data & NASA Scientific Knowledge Base
// Conforms to NASA International Space Apps Challenge 2026 specifications
// Designed intuitively for Junior Astronauts aged 7-12 years old

export const MISSIONS_LIST = [
  {
    id: 'm_plant',
    title: 'Primer Cultivo Marciano',
    module: 'agrodome',
    moduleLabel: 'Invernadero Agrodome',
    goal: 'Camina al invernadero y siembra lechuga espacial Veggie.',
    tip: 'Las plantas nos dan comida y oxígeno, pero necesitan agua y luz LED.',
    rewardScience: 15,
    icon: '🌱'
  },
  {
    id: 'm_clean',
    title: 'Paneles Relucientes',
    module: 'power_core',
    moduleLabel: 'Paneles Solares (Power Core)',
    goal: 'Envía al rover a limpiar el polvo rojo de los paneles solares.',
    tip: 'Si el polvo tapa los paneles, la base se queda sin electricidad.',
    rewardScience: 15,
    icon: '🚜'
  },
  {
    id: 'm_moxie',
    title: 'Fábrica de Oxígeno MOXIE',
    module: 'life_support',
    moduleLabel: 'Laboratorio (Life Support)',
    goal: 'Enciende el reactor MOXIE para fabricar oxígeno respirable.',
    tip: 'MOXIE convierte el aire irrespirable de Marte (CO2) en oxígeno puro.',
    rewardScience: 15,
    icon: 'moxie'
  },
  {
    id: 'm_recycle',
    title: 'Cuidando Cada Gota',
    module: 'life_support',
    moduleLabel: 'Hábitat (Life Support)',
    goal: 'Usa el reciclador ECLSS para purificar y recuperar agua limpia.',
    tip: 'En el espacio la NASA recicla hasta el 98% del agua para no desperdiciar nada.',
    rewardScience: 15,
    icon: '💧'
  },
  {
    id: 'm_bunker',
    title: 'Escudo Antirradiación',
    module: 'shield_system',
    moduleLabel: 'Búnker de Regolito',
    goal: 'Activa el refugio o refuerza el escudo con tierra marciana.',
    tip: 'La tierra roja (regolito) bloquea la radiación peligrosa de las tormentas solares.',
    rewardScience: 15,
    icon: '🛡️'
  },
  {
    id: 'm_eva',
    title: 'Explorador del Cráter',
    module: 'shield_system',
    moduleLabel: 'Cráter Jezero (Shield System)',
    goal: 'Planifica una salida EVA con trajes espaciales para recoger muestras.',
    tip: 'En el cráter Jezero hubo un antiguo lago. Buscamos pistas de agua pasada.',
    rewardScience: 20,
    icon: '🥾'
  },
  {
    id: 'm_comms',
    title: 'Mensaje a Houston',
    module: 'mission_control',
    moduleLabel: 'Antena DSN (Control de Misión)',
    goal: 'Envía un reporte por radio a la Tierra desde Control de Misión.',
    tip: 'Las señales tardan 14 minutos en viajar entre Marte y la Tierra.',
    rewardScience: 15,
    icon: '📡'
  }
];

export const GARDEN_SIZE = 10;

export const MISSION_CHALLENGES = {
  m_plant: { game: 'plant', module: 'agrodome', action: 'plant', payload: { cropType: 'veggie_lettuce' } },
  m_clean: { game: 'clean', module: 'power_core', action: 'clean_panels' },
  m_moxie: { game: 'moxie', module: 'life_support', action: 'moxie' },
  m_recycle: { game: 'water', module: 'life_support', action: 'recycle_water' },
  m_bunker: { game: 'regolith', module: 'shield_system', action: 'reinforce_regolith' },
  m_eva: { game: 'eva', module: 'shield_system', action: 'eva_expedition' },
  m_comms: { game: 'antenna', module: 'mission_control', action: 'ask_earth' }
};

// Returns the pending mission challenge that guards a module action, if any.
export function findChallengeForAction(state, moduleName, actionType) {
  if (state.gameOver || state.victory || state.actionsRemaining <= 0) return null;
  const done = state.completedMissions || [];
  const closingBunker = moduleName === 'shield_system' && actionType === 'toggle_bunker' && !state.bunkerActive;
  const entry = Object.entries(MISSION_CHALLENGES).find(([id, c]) => (
    (!done.includes(id) || id === 'm_plant')
    && ((c.module === moduleName && c.action === actionType)
      || (closingBunker && id === 'm_bunker'))
  ));
  return entry ? { missionId: entry[0], game: entry[1].game } : null;
}

export const INITIAL_GAME_STATE = {
  cadetName: 'Cadete Explorador',
  sol: 1,
  totalSols: 7,
  isNight: false,
  roverTask: null,
  actionsRemaining: 2,
  maxActionsPerSol: 2,
  resources: {
    energy: 85,
    water: 80,
    oxygen: 90,
    co2: 12,
    food: 70
  },
  crew: {
    count: 4,
    health: 100,
    status: 'Muy bien'
  },
  shield: 90,
  dust: 15,
  activeHazard: null,
  radiationDose: 0,
  emergencyRescueUsed: false,
  bunkerActive: false,
  crops: {
    planted: false,
    cropType: 'veggie_lettuce',
    stage: 0,
    solsToHarvest: 0
  },
  garden: Array(GARDEN_SIZE).fill(null),
  completedMissions: [],
  scienceProgress: 10,
  earthComms: [
    {
      sol: 1,
      sender: 'Control en Houston',
      subject: '¡Bienvenidos a Marte!',
      text: '¡Hola, Comandante! Tu base en Jezero está lista. ¡Cuida tus recursos y cumple las misiones!',
      latencyMin: 14.2
    }
  ],
  log: ['Sol 01: Puesto Horizonte Rojo activado en el Cráter Jezero.'],
  gameOver: false,
  victory: false
};

export const NASA_SOURCES = {
  meda: {
    id: 'meda',
    title: 'NASA Perseverance: Sensor del Clima MEDA',
    mission: 'Rover Perseverance (Mars 2020)',
    instrument: 'MEDA (Estación Meteorológica de Marte)',
    location: 'Cráter Jezero, Marte',
    badge: 'DATO REAL NASA',
    text: 'El rover Perseverance lleva una estación del clima llamada MEDA. Descubrió que en Marte se forman remolinos de polvo muy fino que tapan los paneles solares y hacen que produzcan menos electricidad.',
    nasaUrl: 'https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/PERSEVERANCE/meda.html'
  },
  moxie: {
    id: 'moxie',
    title: 'NASA MOXIE: Máquina que Fabrica Oxígeno',
    mission: 'Rover Perseverance (Mars 2020)',
    instrument: 'MOXIE',
    location: 'Cráter Jezero, Marte',
    badge: 'TECNOLOGÍA REAL NASA',
    text: 'El aire de Marte no se puede respirar porque tiene 95% de dióxido de carbono (CO2). La NASA probó un aparato llamado MOXIE del tamaño de una tostadora que calienta ese aire a 800 °C para sacar oxígeno puro.',
    nasaUrl: 'https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/'
  },
  eclss: {
    id: 'eclss',
    title: 'NASA ECLSS: El Gran Reciclador de Agua',
    mission: 'Estación Espacial Internacional (ISS)',
    instrument: 'ECLSS',
    location: 'Órbita de la Tierra',
    badge: 'SISTEMA REAL NASA',
    text: 'Llevar agua en cohete pesa muchísimo. En la Estación Espacial, el sistema ECLSS limpia y recicla hasta el 98% del agua, incluso el sudor y la humedad del aire, dejándola más limpia que el agua de botella.',
    nasaUrl: 'https://www.nasa.gov/international-space-station/space-station-research-and-technology/'
  },
  veggie: {
    id: 'veggie',
    title: 'NASA Veggie: Huertos en el Espacio',
    mission: 'Estación Espacial Internacional (ISS)',
    instrument: 'Veggie y OSDR',
    location: 'Laboratorio Espacial',
    badge: 'BIOLOGÍA ESPACIAL NASA',
    text: 'Para cultivar sin tierra fértil, la NASA usa almohadillas especiales con nutrientes y luces LED rojas y azules. Así los astronautas han cultivado y comido lechugas, rábanos y tomatitos en el espacio.',
    nasaUrl: 'https://osdr.nasa.gov/'
  },
  donki: {
    id: 'donki',
    title: 'NASA DONKI: Alertas de Tormentas Solares',
    mission: 'Centro Goddard de la NASA',
    instrument: 'Sistema DONKI de Clima Espacial',
    location: 'Sistema Solar',
    badge: 'CLIMA ESPACIAL NASA',
    text: 'Marte no tiene un escudo magnético invisible como la Tierra. Cuando el Sol lanza rayos de radiación fuerte, DONKI avisa a tiempo para que los astronautas se escondan bajo rocas y arena marciana (regolito).',
    nasaUrl: 'https://ccmc.gsfc.nasa.gov/DONKI/'
  },
  curiosity_rad: {
    id: 'curiosity_rad',
    title: 'NASA Curiosity: Medidor de Radiación RAD',
    mission: 'Rover Curiosity',
    instrument: 'Detector RAD',
    location: 'Marte',
    badge: 'DATO CIENTÍFICO REAL',
    text: 'El robot Curiosity midió cuánta radiación espacial cae cada día en la superficie de Marte. Gracias a eso sabemos que cubrir las casas con tierra marciana protege muy bien a los astronautas.',
    nasaUrl: 'https://science.nasa.gov/mission/msl-curiosity/science-instruments/'
  },
  dsn: {
    id: 'dsn',
    title: 'NASA DSN: Antenas Gigantes del Espacio',
    mission: 'Red del Espacio Profundo (JPL)',
    instrument: 'Antenas de 70 metros DSN',
    location: 'EE.UU., España y Australia',
    badge: 'COMUNICACIÓN NASA',
    text: 'Marte está a millones de kilómetros. Aunque las señales viajan a la velocidad de la luz, tardan entre 6 y 22 minutos en llegar. ¡Por eso un comandante espacial debe pensar rápido y decidir sin esperar a la Tierra!',
    nasaUrl: 'https://www.nasa.gov/directorates/somd/space-communications-navigation-program/'
  }
};

export const SOL_EVENTS = [
  {
    sol: 1,
    title: 'Sol 01: ¡Aterrizaje en el Cráter Jezero!',
    subtitle: 'Primer día en Marte',
    description: '¡Llegaste sano y salvo a Marte con tus 4 astronautas! Antes de explorar, decide qué quieres priorizar hoy.',
    nasaSourceKey: 'meda',
    choices: [
      {
        id: 'c1_a',
        text: '⚡ Cargar las Baterías de la Base',
        detail: 'Guarda mucha electricidad para mantener calientes las habitaciones en la noche.',
        effects: { energy: 10, food: -5 }
      },
      {
        id: 'c1_b',
        text: '🌱 Encender el Invernadero Agrodome',
        detail: 'Prepara las bandejas de agua y luz para empezar a cultivar comida fresca.',
        effects: { water: -8, energy: -5, food: 8 }
      }
    ]
  },
  {
    sol: 2,
    title: 'Sol 02: ¡Remolino de Polvo Rojo!',
    subtitle: 'Alerta del sensor del clima MEDA',
    description: 'Un viento fuerte levantó polvo fino y cubrió parte de tus paneles solares. ¡Si no los limpias, entrará menos energía!',
    nasaSourceKey: 'meda',
    hazard: 'dust_storm',
    choices: [
      {
        id: 'c2_a',
        text: '🚜 Mandar al Rover a Limpiar los Paneles',
        detail: 'Usa un poco de batería ahora, pero deja los paneles solares al 100%.',
        effects: { energy: -10, dust: -40 },
        actionTrigger: 'clean_panels'
      },
      {
        id: 'c2_b',
        text: '💤 Ahorrar Luz y Esperar a que Pase el Viento',
        detail: 'No gastas batería hoy, pero los paneles seguirán con polvo.',
        effects: { energy: 4, dust: 10, oxygen: -4 }
      }
    ]
  },
  {
    sol: 3,
    title: 'Sol 03: Las Lechugas Tienen Sed',
    subtitle: 'Experimento de cultivos Veggie',
    description: 'Tus plantitas están creciendo súper rápido en el invernadero, pero hoy piden un poco más de agua y luz LED.',
    nasaSourceKey: 'veggie',
    choices: [
      {
        id: 'c3_a',
        text: '💧 Darles Agua y Luz Completa',
        detail: 'Gasta 10 de agua y 8 de energía para lograr una gran cosecha pronto.',
        effects: { water: -10, energy: -8, food: 15 }
      },
      {
        id: 'c3_b',
        text: '🌾 Cuidar las Reservas de Agua',
        detail: 'Ahorras agua para la tripulación, aunque las plantas crecerán más lento.',
        effects: { water: 3, energy: 2, food: -5 }
      }
    ]
  },
  {
    sol: 4,
    title: 'Sol 04: ¡Alerta de Tormenta Solar!',
    subtitle: 'Aviso urgente de NASA DONKI',
    description: 'El Sol lanzó una nube de radiación hacia Marte. La tormenta durará dos Soles: prepara el búnker para mantener a salvo a la tripulación.',
    nasaSourceKey: 'donki',
    hazard: 'solar_radiation',
    choices: [
      {
        id: 'c4_a',
        text: '🛡️ Refugiar a Todos en el Búnker',
        detail: 'Sella el refugio bajo tierra marciana. Gasta 8 de energía pero todos están a salvo.',
        effects: { energy: -8, shield: 15 },
        actionTrigger: 'activate_bunker'
      },
      {
        id: 'c4_b',
        text: '📡 Seguir Trabajando con Cuidado',
        detail: 'Ahorras electricidad, pero sin cerrar el búnker la radiación acumula dosis y baja la salud.',
        effects: { energy: 5, shield: -25 }
      }
    ]
  },
  {
    sol: 5,
    title: 'Sol 05: El Aire se Pone Pesado',
    subtitle: 'Aviso de Calidad de Aire (MOXIE)',
    description: 'Al respirar dentro de la base cerrada sube el CO2 (aire viciado). ¡Hay que limpiar el aire y producir oxígeno fresco!',
    nasaSourceKey: 'moxie',
    choices: [
      {
        id: 'c5_a',
        text: 'O₂ Prender la Máquina MOXIE',
        detail: 'Usa 12 de energía para crear mucho oxígeno puro (+18) desde la atmósfera.',
        effects: { energy: -12, oxygen: 18, co2: -8 }
      },
      {
        id: 'c5_b',
        text: '🔧 Cambiar los Filtros de Aire',
        detail: 'Limpia rápidamente el CO2 sin gastar electricidad.',
        effects: { oxygen: 6, co2: -12 }
      }
    ]
  },
  {
    sol: 6,
    title: 'Sol 06: ¡Descubrimiento en el Delta!',
    subtitle: 'Exploración Geológica en Jezero',
    description: 'Cerca de la base hay rocas de un antiguo río seco. ¡Podríamos encontrar pistas de agua antigua en Marte!',
    nasaSourceKey: 'curiosity_rad',
    choices: [
      {
        id: 'c6_a',
        text: '🥾 Salir con Trajes Espaciales a Explorar',
        detail: 'Usa aire y agua de los trajes, pero ganamos muchos puntos de ciencia (+25).',
        effects: { oxygen: -6, water: -6, energy: -5 },
        scienceBoost: 25
      },
      {
        id: 'c6_b',
        text: '🔬 Mandar Solo al Rover con su Cámara',
        detail: 'Es 100% seguro para los astronautas y gana +12 puntos de ciencia.',
        effects: { energy: -6 },
        scienceBoost: 12
      }
    ]
  },
  {
    sol: 7,
    title: 'Sol 07: ¡Último Día de Misión!',
    subtitle: 'Conexión Final con la Tierra (DSN)',
    description: '¡Llegaste al Sol 7! La nave de relevo viene en camino. Decide cómo enviar todo lo que aprendiste a la Tierra.',
    nasaSourceKey: 'dsn',
    choices: [
      {
        id: 'c7_a',
        text: '🛰️ Enviar Datos por la Antena Gigante',
        detail: 'Usa la energía restante para mandar todas las fotos y muestras a Houston.',
        effects: { energy: -15 },
        scienceBoost: 20
      },
      {
        id: 'c7_b',
        text: '📦 Guardar Todo en la Base para el Relevo',
        detail: 'Ahorra energía y agua para los astronautas que llegarán mañana.',
        effects: { energy: 5, water: 5 }
      }
    ]
  }
];
