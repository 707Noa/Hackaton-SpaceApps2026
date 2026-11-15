import React from 'react';
import { getNextSolForecast } from '../services/gameEngine';
import { getTelemetrySnapshot } from '../services/telemetryStatus';

const moduleLabels = {
  power_core: 'Energía',
  agrodome: 'Invernadero',
  life_support: 'Soporte vital',
  shield_system: 'Refugio',
  mission_control: 'Control de misión'
};

function getGuidance(state) {
  const alert = getTelemetrySnapshot(state).alerts[0];
  if (alert) {
    return {
      icon: alert.severity === 'critical' ? '🚨' : '🔎',
      title: alert.title,
      message: `${alert.explanation} ${alert.message}`,
      module: alert.module
    };
  }

  const forecast = getNextSolForecast(state);
  if (forecast?.cropHarvest) {
    return {
      icon: '🌱',
      title: '¡La cosecha está lista!',
      message: 'Al avanzar el Sol, las plantas aportarán comida y oxígeno a la base.',
      module: 'agrodome'
    };
  }

  if (forecast?.earthReplyPending) {
    return {
      icon: '📡',
      title: 'Respuesta de la Tierra en camino',
      message: 'Houston responderá al avanzar el Sol. Puedes revisar el enlace de comunicaciones.',
      module: 'mission_control'
    };
  }

  if (forecast?.upcomingEvent) {
    return {
      icon: '🛰️',
      title: 'Prepara el próximo Sol',
      message: `Se acerca: ${forecast.upcomingEvent.subtitle}. Revisa la previsión antes de avanzar.`,
      module: 'mission_control'
    };
  }

  return {
    icon: '✅',
    title: '¡Buen trabajo, comandante!',
    message: 'Los sistemas están estables. Conserva tus recursos y revisa la previsión antes de avanzar.',
    module: null
  };
}

export default function NovaAdvisor({ state, onSelectModule }) {
  const guidance = getGuidance(state);

  return (
    <section className="nova-advisor" aria-labelledby="nova-advisor-title" aria-live="polite">
      <div className="nova-advisor-icon" aria-hidden="true">{guidance.icon}</div>
      <div className="nova-advisor-content">
        <span className="nova-advisor-label">NOVA · CONSEJO DE MISIÓN</span>
        <h2 id="nova-advisor-title">{guidance.title}</h2>
        <p>{guidance.message}</p>
        {guidance.module && (
          <button
            type="button"
            className="nova-advisor-link"
            onClick={() => onSelectModule(guidance.module)}
          >
            Ir a {moduleLabels[guidance.module]} →
          </button>
        )}
      </div>
    </section>
  );
}
