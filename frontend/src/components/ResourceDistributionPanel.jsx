import React, { useState } from 'react';
import { getTelemetrySnapshot } from '../services/telemetryStatus';

export default function ResourceDistributionPanel({ state, onSelectModule }) {
  const { resources, shield, scienceProgress } = state;
  const [expandedMetric, setExpandedMetric] = useState(null);
  const metrics = Object.fromEntries(
    getTelemetrySnapshot(state).metrics.map((metric) => [metric.id, metric])
  );
  const statusStyles = {
    nominal: { label: 'Bien', color: '#10B981', pillClass: 'status-ok' },
    warning: { label: 'Cuidado', color: '#F59E0B', pillClass: 'status-warn' },
    critical: { label: '¡Alerta!', color: '#EF4444', pillClass: 'status-crit' }
  };

  const items = [
    {
      id: 'energy',
      icon: '⚡',
      name: 'Energía',
      hint: 'Máquinas y luces',
      val: resources.energy,
      unit: '%',
      status: statusStyles[metrics.energy.severity],
      metric: metrics.energy,
      moduleLabel: 'Abrir energía'
    },
    {
      id: 'water',
      icon: '💧',
      name: 'Agua',
      hint: 'Beber y cultivar',
      val: resources.water,
      unit: '%',
      status: statusStyles[metrics.water.severity],
      metric: metrics.water,
      moduleLabel: 'Abrir soporte vital'
    },
    {
      id: 'oxygen',
      icon: '🫁',
      name: 'Oxígeno',
      hint: 'Aire para respirar',
      val: resources.oxygen,
      unit: '%',
      status: statusStyles[metrics.oxygen.severity],
      metric: metrics.oxygen,
      moduleLabel: 'Abrir soporte vital'
    },
    {
      id: 'co2',
      icon: '⚠️',
      name: 'Aire CO₂',
      hint: 'Mantenerlo bajo',
      val: resources.co2,
      unit: '%',
      status: statusStyles[metrics.co2.severity],
      metric: metrics.co2,
      moduleLabel: 'Abrir filtros de aire'
    },
    {
      id: 'food',
      icon: '🌱',
      name: 'Comida',
      hint: 'Comida de la tripulación',
      val: resources.food,
      unit: '%',
      status: statusStyles[metrics.food.severity],
      metric: metrics.food,
      moduleLabel: 'Abrir invernadero'
    },
    {
      id: 'shield',
      icon: '🛡️',
      name: 'Escudo',
      hint: 'Protección ante radiación',
      val: shield,
      unit: '%',
      status: statusStyles[metrics.shield.severity],
      metric: metrics.shield,
      moduleLabel: 'Abrir refugio'
    }
  ];

  return (
    <div className="resource-dist-panel pixel-box">
      <div className="flex-between mb-2">
        <span className="text-xs text-gold">RECURSOS DE LA BASE</span>
        <span className="science-pill">🔬 CIENCIA: {scienceProgress} PTS</span>
      </div>

      <div className="resource-cards-grid">
        {items.map((item) => (
          <div key={item.id} className={`res-card ${expandedMetric === item.id ? 'res-card-expanded' : ''}`}>
            <button
              type="button"
              className="res-card-trigger"
              aria-expanded={expandedMetric === item.id}
              aria-controls={`resource-detail-${item.id}`}
              onClick={() => setExpandedMetric(expandedMetric === item.id ? null : item.id)}
            >
              <span className="res-card-top">
                <span className="res-card-title">{item.icon} {item.name}</span>
                <span className={`res-status-badge ${item.status.pillClass}`}>
                  {item.status.label}
                </span>
              </span>
              <span className="res-card-val-row">
                <span className="res-val-num" style={{ color: item.status.color }}>
                  {item.val}{item.unit}
                </span>
                <span className="res-hint-text">{item.hint}</span>
              </span>
              <span className="gauge-bar-track" aria-hidden="true">
                <span
                  className="gauge-bar-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, item.val))}%`,
                    backgroundColor: item.status.color
                  }}
                />
              </span>
              <span className="res-card-expand-hint">
                {expandedMetric === item.id ? 'Ocultar detalles' : 'Ver detalles'}
              </span>
            </button>
            {expandedMetric === item.id && (
              <div className="resource-detail" id={`resource-detail-${item.id}`}>
                <p>{item.metric.explanation}</p>
                {item.metric.severity !== 'nominal' && (
                  <p className="resource-detail-recommendation">
                    <strong>Sugerencia:</strong> {item.metric.message}
                  </p>
                )}
                <button
                  type="button"
                  className="resource-detail-link"
                  onClick={() => onSelectModule(
                    item.metric.module,
                    item.metric.severity === 'nominal' ? null : item.metric.message
                  )}
                >
                  {item.moduleLabel} →
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {state.radiationDose > 0 && (
        <div className="radiation-dose-meter" aria-label={`Índice de exposición a radiación ${state.radiationDose}%`}>
          <span>☢️ Exposición acumulada</span>
          <strong>{state.radiationDose}%</strong>
          <span className="radiation-dose-track" aria-hidden="true">
            <span style={{ width: `${state.radiationDose}%` }} />
          </span>
          <button
            type="button"
            className="radiation-dose-action"
            onClick={() => onSelectModule('shield_system', 'Cierra el búnker para detener nuevas exposiciones.')}
          >
            REVISAR REFUGIO →
          </button>
        </div>
      )}
    </div>
  );
}
