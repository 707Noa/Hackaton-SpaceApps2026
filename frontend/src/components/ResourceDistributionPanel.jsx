import React from 'react';

export default function ResourceDistributionPanel({ state }) {
  const { resources, shield, scienceProgress } = state;

  const getStatus = (val, inverted = false) => {
    const effective = inverted ? 100 - val : val;
    if (effective >= 50) return { label: 'Bien', color: '#10B981', pillClass: 'status-ok' };
    if (effective >= 25) return { label: 'Cuidado', color: '#F59E0B', pillClass: 'status-warn' };
    return { label: '¡Alerta!', color: '#EF4444', pillClass: 'status-crit' };
  };

  const items = [
    {
      id: 'energy',
      icon: '⚡',
      name: 'Energía',
      hint: 'Para máquinas y luz',
      val: resources.energy,
      unit: '%',
      status: getStatus(resources.energy)
    },
    {
      id: 'water',
      icon: '💧',
      name: 'Agua',
      hint: 'Para beber y huerta',
      val: resources.water,
      unit: '%',
      status: getStatus(resources.water)
    },
    {
      id: 'oxygen',
      icon: '🫁',
      name: 'Oxígeno',
      hint: 'Aire para respirar',
      val: resources.oxygen,
      unit: '%',
      status: getStatus(resources.oxygen)
    },
    {
      id: 'co2',
      icon: '⚠️',
      name: 'Aire CO₂',
      hint: 'Mantenerlo bajo (<25%)',
      val: resources.co2,
      unit: '%',
      status: getStatus(resources.co2, true)
    },
    {
      id: 'food',
      icon: '🌱',
      name: 'Comida',
      hint: 'Raciones del equipo',
      val: resources.food,
      unit: '%',
      status: getStatus(resources.food)
    },
    {
      id: 'shield',
      icon: '🛡️',
      name: 'Escudo',
      hint: 'Protección solar',
      val: shield,
      unit: '%',
      status: getStatus(shield)
    }
  ];

  return (
    <div className="resource-dist-panel pixel-box">
      <div className="flex-between mb-2">
        <span className="text-xs text-gold">DISTRIBUCIÓN DE RECURSOS</span>
        <span className="science-pill">🔬 CIENCIA: {scienceProgress} PTS</span>
      </div>

      <div className="resource-cards-grid">
        {items.map((item) => (
          <div key={item.id} className="res-card">
            <div className="res-card-top">
              <span className="res-card-title">{item.icon} {item.name}</span>
              <span className={`res-status-badge ${item.status.pillClass}`}>
                {item.status.label}
              </span>
            </div>
            <div className="res-card-val-row">
              <span className="res-val-num" style={{ color: item.status.color }}>
                {item.val}{item.unit}
              </span>
              <span className="res-hint-text">{item.hint}</span>
            </div>
            <div className="gauge-bar-track">
              <div
                className="gauge-bar-fill"
                style={{
                  width: `${Math.min(100, Math.max(0, item.val))}%`,
                  backgroundColor: item.status.color
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
