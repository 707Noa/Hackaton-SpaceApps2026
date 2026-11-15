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
      message: 'El explorador necesita aire. Activa MOXIE.',
      explanation: 'Sin aire, el explorador no puede respirar.'
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
      message: 'El explorador necesita agua para beber y regar las plantas.',
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
      explanation: 'El aire sucio hace daño. Limpia los filtros.'
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
      message: 'Quedan pocas raciones. Cosecha comida en el huerto.',
      explanation: 'La comida guardada se consume al comer.'
    },
    {
      id: 'hunger',
      label: 'HAMBRE',
      icon: '🍽️',
      value: state.hunger,
      direction: 'below',
      warningAt: 35,
      criticalAt: 15,
      module: 'agrodome',
      title: 'El explorador tiene hambre',
      message: 'Come una ración o cosecha comida en el huerto.',
      explanation: 'El hambre baja cada Sol. Comer usa comida guardada.'
    },
    {
      id: 'robot_battery',
      label: 'ROVER',
      icon: '🤖',
      value: state.robot.battery,
      direction: 'below',
      warningAt: 35,
      criticalAt: 20,
      module: 'power_core',
      title: 'Batería del rover baja',
      message: 'Deja que el rover recargue antes de enviarlo a limpiar.',
      explanation: 'El rover necesita batería para limpiar los paneles y ayudar en una emergencia.'
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
      explanation: 'El búnker protege al explorador de la radiación.'
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
      label: 'EXPLORADOR',
      icon: '🧑‍🚀',
      value: crew.health,
      direction: 'below',
      warningAt: 60,
      criticalAt: 35,
      module: 'life_support',
      title: 'El explorador necesita ayuda',
      message: 'Revisa el aire, el agua, la energía y el hambre.',
      explanation: 'El explorador necesita aire, agua, energía y comida.'
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
      ? 'Cierra el búnker para proteger al explorador de la radiación.'
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
      power: getWorstSeverity(severityById.energy, severityById.dust, severityById.robot_battery),
      agrodome: getWorstSeverity(severityById.water, severityById.food, severityById.hunger),
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

