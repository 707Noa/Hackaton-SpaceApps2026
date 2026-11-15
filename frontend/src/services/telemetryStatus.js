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
      icon: '🫁',
      value: resources.oxygen,
      direction: 'below',
      warningAt: 40,
      criticalAt: 20,
      module: 'life_support',
      title: 'Oxígeno bajo',
      message: 'Activa MOXIE o revisa el soporte vital.',
      explanation: 'La tripulación necesita oxígeno para respirar.'
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
      title: 'Energía baja',
      message: 'Revisa el consumo y los paneles solares.',
      explanation: 'La energía hace funcionar las máquinas; el polvo reduce lo que producen los paneles.'
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
      title: 'Reserva de agua baja',
      message: 'Revisa el reciclador de agua.',
      explanation: 'El agua sirve para la tripulación y para cuidar las plantas.'
    },
    {
      id: 'co2',
      label: 'CO₂',
      icon: '💨',
      value: resources.co2,
      direction: 'above',
      warningAt: 25,
      criticalAt: 40,
      module: 'life_support',
      title: 'CO₂ elevado',
      message: 'Activa los filtros de aire.',
      explanation: 'Demasiado CO₂ hace que el aire de la base sea menos seguro.'
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
      title: 'Raciones bajas',
      message: 'Revisa los cultivos del invernadero.',
      explanation: 'La comida mantiene a la tripulación sana durante la misión.'
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
      title: 'Protección debilitada',
      message: 'Refuerza el refugio marciano.',
      explanation: 'El regolito —la tierra de Marte— ayuda a proteger a la tripulación de la radiación.'
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
      title: 'Polvo en los paneles',
      message: 'Envía el rover a limpiar los paneles solares.',
      explanation: 'El polvo cubre los paneles y reduce la electricidad que producen.'
    },
    {
      id: 'crew',
      label: 'TRIPULACIÓN',
      icon: '🧑‍🚀',
      value: crew.health,
      direction: 'below',
      warningAt: 60,
      criticalAt: 35,
      module: 'life_support',
      title: 'Salud de la tripulación en riesgo',
      message: 'Revisa el agua, el oxígeno y la energía.',
      explanation: 'La salud de la tripulación depende de que los sistemas vitales funcionen.'
    }
  ].map((metric, order) => ({
    ...metric,
    severity: getSeverity(metric.value, metric.direction, metric.warningAt, metric.criticalAt),
    order
  }));

  const severityById = Object.fromEntries(metrics.map(({ id, severity }) => [id, severity]));
  const alerts = metrics
    .filter((metric) => metric.severity !== 'nominal')
    .sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity] || a.order - b.order);

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
