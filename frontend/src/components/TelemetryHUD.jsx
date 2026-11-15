import React from 'react';
import { MISSIONS_LIST } from '../data/gameData';
import { getTelemetrySnapshot } from '../services/telemetryStatus';

export default function TelemetryHUD({ 
  state, 
  isMuted, 
  onToggleMute,
  onOpenMissions,
  onAdvanceSol,
  onSelectModule,
  isReducedMotion,
  onToggleReducedMotion
}) {
  const { sol, totalSols, crew, actionsRemaining, completedMissions = [] } = state;
  const { metrics, alerts } = getTelemetrySnapshot(state);
  const quickMetrics = metrics.filter((metric) => ['energy', 'water', 'oxygen', 'co2', 'hunger'].includes(metric.id));
  const crewStatus = metrics.find((metric) => metric.id === 'crew');
  const activeAlert = alerts[0];
  const crisisGuidance = {
    oxygen: { label: 'Oxígeno', module: 'life_support', action: 'Activa MOXIE para fabricar aire.' },
    water: { label: 'Agua', module: 'life_support', action: 'Abre el reciclador para recuperar agua.' },
    energy: { label: 'Energía', module: 'power_core', action: 'Revisa la energía y activa el modo de ahorro.' },
    food: { label: 'Comida', module: 'agrodome', action: 'Revisa el huerto y recupera provisiones.' },
    co2: { label: 'Aire limpio', module: 'life_support', action: 'Limpia el filtro para bajar el CO₂.' }
  };
  const activeCrisis = state.activeCrisis
    ? crisisGuidance[state.activeCrisis.resource]
    : null;

  return (
    <header className="telemetry-header">
      <div className="telemetry-topbar pixel-box">
        <div className="brand-title">
          <strong>MARS RANGERS</strong>
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
            {actionsRemaining === 0 && state.activeCrisis && !state.activeCrisis.emergencyOrderUsed
              ? '🚨 1 ORDEN DE EMERGENCIA'
              : `ÓRDENES: ${actionsRemaining}/${state.maxActionsPerSol}`}
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
            disabled={Boolean(state.activeCrisis || state.gameOver || state.victory)}
          >
            ☀️ SIGUIENTE SOL
          </button>

          <button 
            className="pixel-btn text-xs audio-toggle-btn"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
            title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          <button
            className="pixel-btn text-xs motion-toggle-btn"
            onClick={onToggleReducedMotion}
            aria-pressed={isReducedMotion}
            aria-label={isReducedMotion ? 'Desactivar movimiento reducido' : 'Activar movimiento reducido'}
            title={isReducedMotion ? 'Desactivar movimiento reducido' : 'Activar movimiento reducido'}
          >
            {isReducedMotion ? '🐢' : '✨'}
          </button>
        </div>
      </div>

      {activeCrisis && (
        <div className="critical-crisis-banner" role="alert" aria-live="assertive">
          <strong>🚨 ¡{activeCrisis.label} al límite!</strong>
          <span>
            {state.activeCrisis.secondsRemaining} s para actuar. {activeCrisis.action}
          </span>
          <button
            className="critical-crisis-action"
            onClick={() => onSelectModule(activeCrisis.module, activeCrisis.action)}
          >
            IR A {activeCrisis.module === 'life_support' ? 'AIRE / AGUA' : activeCrisis.module === 'power_core' ? 'ENERGÍA' : 'HUERTO'} →
          </button>
        </div>
      )}

      <div
        className={`telemetry-alert-banner ${activeAlert ? `alert-${activeAlert.severity}` : 'alert-nominal'}`}
        aria-live="polite"
      >
        {activeAlert ? (
          <>
            <span className="alert-banner-heading">
              {activeAlert.severity === 'critical' ? 'ALERTA CRÍTICA' : 'AVISO DE MISIÓN'}
            </span>
            <strong>
              {alerts.length > 1
                ? `${alerts.length} sistemas necesitan atención`
                : activeAlert.title || 'NOVA tiene un consejo para ti'}
            </strong>
            <span className="alert-banner-message">Usa "IR AL SISTEMA" para revisarlo.</span>
            <button
              className="telemetry-alert-action"
              onClick={() => onSelectModule(activeAlert.module, activeAlert.message)}
            >
              IR AL SISTEMA
            </button>
          </>
        ) : (
          <>
            <span className="alert-banner-heading">SISTEMAS NOMINALES</span>
            <span className="alert-banner-message">Explorador y sistemas estables.</span>
          </>
        )}
      </div>
    </header>
  );
}
