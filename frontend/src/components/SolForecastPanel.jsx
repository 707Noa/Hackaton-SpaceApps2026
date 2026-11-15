import React from 'react';
import { getNextSolForecast } from '../services/gameEngine';

const forecastMetrics = [
  { id: 'energy', label: 'Energía', icon: '⚡' },
  { id: 'water', label: 'Agua', icon: '💧' },
  { id: 'oxygen', label: 'Oxígeno', icon: '🫁' },
  { id: 'food', label: 'Comida', icon: '🌱' },
  { id: 'co2', label: 'CO₂', icon: '💨' },
  { id: 'dust', label: 'Polvo', icon: '🌪️' }
];

function getChangeClass(metricId, delta) {
  if (delta === 0) return 'forecast-change-neutral';

  const isImprovement = metricId === 'co2' || metricId === 'dust'
    ? delta < 0
    : delta > 0;
  return isImprovement ? 'forecast-change-positive' : 'forecast-change-negative';
}

export default function SolForecastPanel({ state }) {
  const forecast = getNextSolForecast(state);

  if (!forecast) {
    return (
      <section className="sol-forecast-card" aria-label="Previsión de la misión">
        <strong>ÚLTIMO SOL DE LA MISIÓN</strong>
        <p>Revisa tus órdenes antes de cerrar este día marciano.</p>
      </section>
    );
  }

  return (
    <section className="sol-forecast-card" aria-labelledby="sol-forecast-title">
      <div className="sol-forecast-header">
        <div>
          <span className="sol-forecast-kicker">PLANIFICA CON NOVA</span>
          <h3 id="sol-forecast-title">Previsión del Sol {forecast.nextSol}</h3>
        </div>
        <span className="forecast-estimate-badge">ESTIMACIÓN</span>
      </div>

      <p className="forecast-caption">
        Cambios esperados al avanzar, antes de elegir en el próximo evento.
      </p>

      <div className="forecast-resource-grid">
        {forecastMetrics.map(({ id, label, icon }) => {
          const delta = forecast.resourceDeltas[id];
          const sign = delta > 0 ? '+' : '';

          return (
            <div className="forecast-resource" key={id}>
              <span>{icon} {label}</span>
              <strong className={getChangeClass(id, delta)}>
                {sign}{delta}%
              </strong>
              <span className="forecast-projected-value">
                Quedaría en {forecast.projectedResources[id]}%
              </span>
            </div>
          );
        })}
      </div>

      <p className="forecast-note">
        La energía incluye la producción solar y el consumo de la base. El polvo puede reducirla.
      </p>

      {forecast.cropHarvest && (
        <p className="forecast-positive-note">
          🎉 La cosecha estará lista y sumará comida y oxígeno.
        </p>
      )}

      {forecast.earthReplyPending && (
        <p className="forecast-info-note">
          📡 Hay una respuesta de la Tierra pendiente para el próximo Sol.
        </p>
      )}

      {forecast.upcomingEvent && (
        <div className="forecast-event">
          <strong>Evento previsto: {forecast.upcomingEvent.title}</strong>
          <span>{forecast.upcomingEvent.subtitle}</span>
          {forecast.upcomingEvent.hazard === 'solar_radiation' && (
            <span className="forecast-hazard-deadline">
              ⏳ Plazo: prepara el búnker antes de cerrar este Sol o durante el Sol {forecast.nextSol}.
            </span>
          )}
          {forecast.upcomingEvent.hazard === 'dust_storm' && (
            <span className="forecast-hazard-deadline">
              ⏳ Próximo Sol: el polvo reducirá la energía solar. Deja una orden para el rover.
            </span>
          )}
        </div>
      )}

      {state.activeHazard && (
        <div className={`active-hazard-card active-hazard-${state.activeHazard.type}`} role="status">
          <strong>
            {state.activeHazard.type === 'solar_radiation'
              ? `☀️ Tormenta solar · ${state.activeHazard.remainingSols} Sol(es)`
              : '🌪️ Tormenta de polvo activa'}
          </strong>
          <span>
            {state.activeHazard.type === 'solar_radiation'
              ? state.bunkerActive
                ? 'La tripulación está protegida dentro del búnker.'
                : 'La exposición suma dosis y reduce la salud. Cierra el búnker.'
              : 'Los paneles producen menos energía hasta que pase el temporal.'}
          </span>
        </div>
      )}

      <p className="forecast-crew">
        🧑‍🚀 Salud de la tripulación: {state.crew.health}% → {forecast.projectedCrewHealth}%
      </p>

      {state.activeHazard?.type === 'solar_radiation' && !state.bunkerActive && (
        <p className="forecast-risk-note">
          ☢️ Índice de exposición previsto al cerrar el Sol: {forecast.projectedRadiationDose}%.
        </p>
      )}

      {forecast.survivalRisk && (
        <p className="forecast-risk-note">
          ⚠️ La proyección pone en riesgo a la tripulación. Revisa las alertas antes de avanzar.
        </p>
      )}

      <div className="forecast-orders">
        Órdenes disponibles hoy: <strong>{state.actionsRemaining}/{state.maxActionsPerSol}</strong>
      </div>
    </section>
  );
}
