import React from 'react';
import { MISSIONS_LIST } from '../data/gameData';
import { getTelemetrySnapshot } from '../services/telemetryStatus';

export default function TelemetryHUD({ 
  state, 
  isMuted, 
  onToggleMute,
  onOpenMissions,
  onAdvanceSol,
  onSelectModule
}) {
  const { sol, totalSols, crew, actionsRemaining, completedMissions = [] } = state;
  const { metrics, alerts } = getTelemetrySnapshot(state);
  const quickMetrics = metrics.filter((metric) => ['energy', 'water', 'oxygen', 'co2'].includes(metric.id));
  const crewStatus = metrics.find((metric) => metric.id === 'crew');
  const activeAlert = alerts[0];

  return (
    <header className="telemetry-header">
      <div className="telemetry-topbar pixel-box">
        <div className="brand-title">
          <strong>MARS OUTPOST</strong>
          <span className="location-badge">JEZERO · MARTE</span>
          <span className="sol-badge">SOL 0{sol} / 0{totalSols}</span>
        </div>

        <div className="telemetry-resource-strip" aria-label="Recursos esenciales">
          {quickMetrics.map((metric) => (
            <div
              key={metric.id}
              className={`telemetry-metric telemetry-metric-${metric.severity}`}
              title={`${metric.label}: ${metric.value}%`}
            >
              <span className="telemetry-metric-label">{metric.icon} {metric.label}</span>
              <strong className="telemetry-metric-value">{metric.value}%</strong>
              <span className="telemetry-meter-track">
                <span
                  className="telemetry-meter-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, metric.value))}%`,
                    backgroundColor: metric.severity === 'critical'
                      ? '#EF4444'
                      : metric.severity === 'warning' ? '#F59E0B' : '#34D399'
                  }}
                />
              </span>
            </div>
          ))}
        </div>

        <div className="header-status-group">
          <span className={`crew-badge crew-badge-${crewStatus.severity}`}>
            🧑‍🚀 SALUD {crew.health}%
          </span>
          <span className="actions-badge">
            ÓRDENES: {actionsRemaining}/2
          </span>

          <button 
            className="pixel-btn pixel-btn-gold text-xs"
            onClick={onOpenMissions}
            title="Ver lista de misiones (Tecla M)"
          >
            📋 MISIONES ({completedMissions.length}/{MISSIONS_LIST.length})
          </button>

          <button 
            className="pixel-btn pixel-btn-green text-xs"
            onClick={onAdvanceSol}
          >
            ☀️ SIGUIENTE SOL
          </button>

          <button 
            className="pixel-btn text-xs audio-toggle-btn"
            onClick={onToggleMute}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      <div
        className={`telemetry-alert-banner ${activeAlert ? `alert-${activeAlert.severity}` : 'alert-nominal'}`}
        aria-live="polite"
      >
        {activeAlert ? (
          <>
            <span className="alert-banner-heading">
              {activeAlert.severity === 'critical' ? 'ALERTA CRÍTICA' : 'AVISO OPERATIVO'}
            </span>
            <strong>{activeAlert.title}</strong>
            <span className="alert-banner-message">{activeAlert.message}</span>
            {alerts.length > 1 && <span className="alert-count">+{alerts.length - 1} avisos</span>}
            <button
              className="telemetry-alert-action"
              onClick={() => onSelectModule(activeAlert.module, activeAlert.message)}
            >
              REVISAR
            </button>
          </>
        ) : (
          <>
            <span className="alert-banner-heading">SISTEMAS NOMINALES</span>
            <span className="alert-banner-message">Recursos y tripulación dentro de rangos operativos.</span>
          </>
        )}
      </div>
    </header>
  );
}
