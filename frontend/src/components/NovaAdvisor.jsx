import React, { useEffect, useState } from 'react';
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
      message: alert.explanation,
      suggestion: alert.message,
      module: alert.module,
      severity: alert.severity
    };
  }

  const forecast = getNextSolForecast(state);
  if (forecast?.cropHarvest) {
    return {
      icon: '🌱',
      title: '¡La cosecha está lista!',
      message: 'Pasa al siguiente Sol y tendrás comida y aire.',
      module: 'agrodome',
      severity: 'info'
    };
  }

  if (forecast?.earthReplyPending) {
    return {
      icon: '📡',
      title: 'Respuesta de la Tierra en camino',
      message: 'Houston te responderá en el siguiente Sol.',
      module: 'mission_control',
      severity: 'info'
    };
  }

  if (forecast?.upcomingEvent) {
    return {
      icon: '🛰️',
      title: 'Prepara el próximo Sol',
      message: `Mañana: ${forecast.upcomingEvent.subtitle}. Mira la previsión.`,
      module: 'mission_control',
      severity: 'info'
    };
  }

  return {
    icon: '✅',
    title: '¡Buen trabajo, comandante!',
    message: 'Todo está bien. Cuida tus recursos.',
    module: null,
    severity: 'nominal'
  };
}

export default function NovaAdvisor({ state, onSelectModule }) {
  const guidance = getGuidance(state);
  const guidanceKey = [
    guidance.title,
    guidance.message,
    guidance.suggestion,
    guidance.module,
    guidance.severity
  ].join('|');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(true);
    const timer = window.setTimeout(() => setIsVisible(false), 10000);
    return () => window.clearTimeout(timer);
  }, [guidanceKey]);

  if (!isVisible) return null;

  return (
    <section
      className={`nova-advisor nova-advisor-${guidance.severity}`}
      aria-labelledby="nova-advisor-title"
      aria-live="polite"
      role="status"
    >
      <div className="nova-advisor-content">
        <div className="nova-advisor-header">
          <span className="nova-advisor-label">{guidance.icon} NOVA · CONSEJO</span>
          <button
            type="button"
            className="nova-advisor-close"
            aria-label="Cerrar consejo de NOVA"
            onClick={() => setIsVisible(false)}
          >
            ×
          </button>
        </div>
        <h2 id="nova-advisor-title">{guidance.title}</h2>
        <p>{guidance.message}</p>
        {guidance.suggestion && (
          <span className="nova-advisor-suggestion">Sugerencia: {guidance.suggestion}</span>
        )}
        {guidance.module && (
          <button
            type="button"
            className="nova-advisor-link"
            onClick={() => onSelectModule(guidance.module)}
            aria-label={`Abrir módulo ${moduleLabels[guidance.module]}`}
          >
            ABRIR {moduleLabels[guidance.module].toUpperCase()} →
          </button>
        )}
      </div>
    </section>
  );
}

