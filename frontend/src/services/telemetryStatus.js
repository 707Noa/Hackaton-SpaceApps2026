const severityOrder = {
  nominal: 0,
  warning: 1,
  critical: 2
};

function getSeverity(value, direction, warningAt, criticalAt) {
  if (direction === 'above') {
    if (value >= criticalAt) return 'critical';
    if (value >= warningAt) return 'warning';
    return 'nominal';
  }

  if (value <= criticalAt) return 'critical';
  if (value <= warningAt) return 'warning';
  return 'nominal';
}

function getWorstSeverity(...severities) {
  return severities.reduce(
    (worst, severity) => severityOrder[severity] > severityOrder[worst] ? severity : worst,
    'nominal'
  );
}

export function getTelemetrySnapshot(state) {
  const { resources, crew } = state;
  const metrics = [
    {
      id: 'oxygen',
      label: 'OXÍGENO',
      icon: 'O₂',
      value: resources.oxygen,
      direction: 'below',
      warningAt: 40,
      criticalAt: 20,
      module: 'life_support',
      title: 'Aire bajo',
      message: '¡El equipo necesita aire! Abre la máquina de oxígeno.',
      explanation: 'Sin aire, ¡los astronautas no pueden respirar!'
    },
    {
      id: 'energy',
      label: 'ENERGÍA',
      icon: '⚡',
      value: resources.energy,
      direction: 'below',
      warningAt: 40,
      criticalAt: 20,
      module: 'power_core',
      title: 'Electricidad baja',
      message: '¡Se está acabando la electricidad! Limpia los paneles solares.',
      explanation: 'Los paneles solares generan la electricidad que hace funcionar todo.'
    },
    {
      id: 'water',
      label: 'AGUA',
      icon: '💧',
      value: resources.water,
      direction: 'below',
      warningAt: 40,
      criticalAt: 20,
      module: 'life_support',
      title: 'Agua baja',
      message: '¡El equipo necesita agua para beber y regar las plantas!',
      explanation: 'El agua es muy importante para beber y para el huerto.'
    },
    {
      id: 'co2',
      label: 'AIRE',
      icon: '💨',
      value: resources.co2,
      direction: 'above',
      warningAt: 25,
      criticalAt: 40,
      module: 'life_support',
      title: 'Aire malo',
      message: '¡El aire está sucio! Enciende los filtros para limpiarlo.',
      explanation: 'El aire sucio es malo para los astronautas. ¡Necesitamos limpiadores de aire!'
    },
    {
      id: 'food',
      label: 'COMIDA',
      icon: '🌱',
      value: resources.food,
      direction: 'below',
      warningAt: 35,
      criticalAt: 15,
      module: 'agrodome',
      title: 'Comida baja',
      message: '¡El equipo tiene hambre! Cultiva más plantas en el huerto.',
      explanation: 'Los astronautas necesitan comer para mantenerse fuertes.'
    },
    {
      id: 'shield',
      label: 'ESCUDO',
      icon: '🛡️',
      value: state.shield,
      direction: 'below',
      warningAt: 40,
      criticalAt: 20,
      module: 'shield_system',
      title: 'Protección débil',
      message: '¡La protección está baja! Refuerza el búnker de tierra marciana.',
      explanation: 'El búnker protege a los astronautas de los rayos malos del Sol.'
    },
    {
      id: 'dust',
      label: 'POLVO',
      icon: '🌪️',
      value: state.dust,
      direction: 'above',
      warningAt: 40,
      criticalAt: 70,
      module: 'power_core',
      title: 'Mucho polvo',
      message: '¡El polvo cubrió los paneles! Envía el rover a limpiar.',
      explanation: 'El polvo marciano tapa los paneles y no entra el Sol.'
    },
    {
      id: 'crew',
      label: 'ASTRONAUTAS',
      icon: '🧑‍🚀',
      value: crew.health,
      direction: 'below',
      warningAt: 60,
      criticalAt: 35,
      module: 'life_support',
      title: 'Astronautas mal',
      message: '¡Los astronautas no se sienten bien! Asegúrate de que todos los sistemas funcionen.',
      explanation: 'Los astronautas están sanos si tienen aire, agua, comida y energía.'
    }
  ].map((metric, order) => ({
    ...metric,
    severity: getSeverity(metric.value, metric.direction, metric.warningAt, metric.criticalAt),
    order
  }));

  const severityById = Object.fromEntries(metrics.map(({ id, severity }) => [id, severity]));
  const metricAlerts = metrics
    .filter((metric) => metric.severity !== 'nominal')
    .sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity] || a.order - b.order);
  const hazardAlert = state.activeHazard ? {
    id: state.activeHazard.type,
    severity: state.activeHazard.type === 'solar_radiation' ? 'critical' : 'warning',
    module: state.activeHazard.type === 'solar_radiation' ? 'shield_system' : 'power_core',
    title: state.activeHazard.type === 'solar_radiation' ? 'Tormenta solar activa' : 'Tormenta de polvo activa',
    message: state.activeHazard.type === 'solar_radiation'
      ? 'Cierra el búnker para proteger a la tripulación de la radiación.'
      : 'El polvo reduce la energía solar. Limpia los paneles con el rover.',
    order: -1
  } : null;
  const alerts = hazardAlert
    ? [hazardAlert, ...metricAlerts]
    : metricAlerts;

  return {
    metrics,
    alerts,
    systemStatuses: {
      power: getWorstSeverity(severityById.energy, severityById.dust),
      agrodome: getWorstSeverity(severityById.water, severityById.food),
      life_support: getWorstSeverity(
        severityById.oxygen,
        severityById.co2,
        severityById.water,
        severityById.crew
      ),
      shield: severityById.shield
    }
  };
}

