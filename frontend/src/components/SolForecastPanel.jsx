import React from 'react';
import { getNextSolForecast } from '../services/gameEngine';

const forecastMetrics = [
  { id: 'energy', label: 'Energía', icon: '⚡' },
  { id: 'water', label: 'Agua', icon: '💧' },
  { id: 'oxygen', label: 'Oxígeno', icon: 'O₂' },
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
        <strong>ÚLTIMO SOL</strong>
        <p>Usa tus órdenes y cierra la misión.</p>
      </section>
    );
  }

  return (
    <section className="sol-forecast-card" aria-labelledby="sol-forecast-title">
      <div className="sol-forecast-header">
        <div>
          <span className="sol-forecast-kicker">NOVA TE AVISA</span>
          <h3 id="sol-forecast-title">Mañana, Sol {forecast.nextSol}</h3>
        </div>
        
      </div>

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
            </div>
          );
        })}
      </div>

      {forecast.cropHarvest && (
        <p className="forecast-positive-note">
          🎉 ¡Habrá cosecha: más comida y aire!
        </p>
      )}

      {forecast.earthReplyPending && (
        <p className="forecast-info-note">
          📡 Houston te responderá mañana.
        </p>
      )}

      {forecast.upcomingEvent && (
        <div className="forecast-event">
          <strong>Mañana: {forecast.upcomingEvent.title}</strong>
          <span>{forecast.upcomingEvent.subtitle}</span>
          {forecast.upcomingEvent.hazard === 'solar_radiation' && (
            <span className="forecast-hazard-deadline">
              ⏳ Prepara el búnker antes de que acabe el día.
            </span>
          )}
          {forecast.upcomingEvent.hazard === 'dust_storm' && (
            <span className="forecast-hazard-deadline">
              ⏳ Mañana habrá polvo. Guarda una orden para el rover.
            </span>
          )}
        </div>
      )}

      {state.activeHazard && (
        <div className={`active-hazard-card active-hazard-${state.activeHazard.type}`} role="status">
          <strong>
            {state.activeHazard.type === 'solar_radiation'
              ? `☀️ Tormenta solar · ${state.activeHazard.remainingSols} Sol(es)`
              : '🌪️ Tormenta de polvo'}
          </strong>
          <span>
            {state.activeHazard.type === 'solar_radiation'
              ? state.bunkerActive
                ? 'El equipo está a salvo en el búnker.'
                : 'La radiación enferma al equipo. ¡Cierra el búnker!'
              : 'Los paneles dan menos energía por ahora.'}
          </span>
        </div>
      )}

      <p className="forecast-crew">
        🧑‍🚀 Salud del equipo: {state.crew.health}% → {forecast.projectedCrewHealth}%
      </p>

      {state.activeHazard?.type === 'solar_radiation' && !state.bunkerActive && (
        <p className="forecast-risk-note">
          ☢️ Radiación al final del día: {forecast.projectedRadiationDose}%.
        </p>
      )}

      {forecast.survivalRisk && (
        <p className="forecast-risk-note">
          ⚠️ ¡Cuidado! El equipo podría enfermar. Mira las alertas.
        </p>
      )}

      <div className="forecast-orders">
        Órdenes de hoy: <strong>{state.actionsRemaining}/{state.maxActionsPerSol}</strong>
      </div>
    </section>
  );
}



