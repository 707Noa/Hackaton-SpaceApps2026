import React from 'react';
import { canIssueAction, getDailyResourceChanges } from '../../services/gameEngine.js';

export default function PowerCoreView({ state, onExecuteAction, onOpenNasaModal }) {
  const { resources, dust, isNight, roverTask, robot } = state;
  const actionAvailable = canIssueAction(state);
  const dailyChanges = getDailyResourceChanges(state);
  const energyBalance = dailyChanges.energy;

  return (
    <div className="module-panel pixel-box">
      <div className="module-header">
        <div>
          <span className="module-tag">ENERGÍA</span>
          <h2 className="module-title">Paneles Solares</h2>
        </div>
        <button
          className="pixel-btn pixel-btn-cyan text-xs"
          onClick={() => onOpenNasaModal('meda')}
        >
          🔍 Dato NASA
        </button>
      </div>

      <p className="module-desc">
        Los paneles dan la luz de la base. El rover Perseverance mide el polvo de Marte que los tapa.
      </p>

      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-label">BATERÍAS</div>
          <div className="metric-value text-gold">{resources.energy}%</div>
          <div className="text-xs text-muted">Guardan luz para la noche</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">ENERGÍA DEL SOL</div>
          <div className={`metric-value ${energyBalance < 0 ? 'text-red' : 'text-green'}`}>
            +{dailyChanges.solarGeneration}
          </div>
          <div className="text-xs text-muted">
            Hoy la base gasta {dailyChanges.basePowerDraw}
          </div>
          <div className={`text-xs ${energyBalance < 0 ? 'text-red' : 'text-green'}`}>
            Al final del día: {energyBalance > 0 ? '+' : ''}{energyBalance}
          </div>
          {resources.energy < 10 && (
            <div className="text-xs text-red">⚠️ Poca energía: el aire y el agua fallan.</div>
          )}
        </div>

        <div className="metric-card">
          <div className="metric-label">POLVO</div>
          <div className={`metric-value ${dust > 35 ? 'text-red' : 'text-cyan'}`}>{dust}%</div>
          <div className="text-xs text-muted">
            {dust > 35 ? '⚠️ ¡Muy sucios! Manda al rover' : 'Todo bien'}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">BATERÍA DEL ROVER</div>
          <div className={`metric-value ${robot.battery < 25 ? 'text-red' : 'text-green'}`}>
            {robot.battery}%
          </div>
          <div className="text-xs text-muted">Recarga 15% al cerrar cada Sol</div>
        </div>
      </div>

      <div className="dust-indicator-wrap">
        <div className="flex-between text-xs mb-1">
          <span>Polvo en los paneles</span>
          <span>{dust}%</span>
        </div>
        <div className="progress-bar-wrap">
          <div
            className={`progress-bar-fill ${dust > 35 ? 'fill-red' : 'fill-gold'}`}
            style={{ width: `${Math.min(100, dust)}%` }}
          />
        </div>
      </div>

      <div className="module-actions-grid">
        <button
          className="pixel-btn pixel-btn-gold"
          onClick={() => onExecuteAction('power_core', 'clean_panels')}
          disabled={!actionAvailable || resources.energy < 10 || robot.battery < 25 || roverTask === 'cleaning'}
        >
          🚜 Mandar al rover a limpiar
          <span className="action-cost">10⚡ · 25% rover · Paneles como nuevos</span>
        </button>

        {resources.energy <= 0 && (
          <button
            className="pixel-btn pixel-btn-gold"
            onClick={() => onExecuteAction('power_core', 'emergency_power')}
            disabled={!actionAvailable || state.activeCrisis?.resource !== 'energy' || robot.battery < 20}
          >
            🔋 Usar batería de emergencia
            <span className="action-cost">Rover −20% · Energía +18%</span>
          </button>
        )}

        <button
          className={`pixel-btn ${isNight ? 'pixel-btn-green' : ''}`}
          onClick={() => onExecuteAction('power_core', 'night_saver')}
          disabled={!actionAvailable}
        >
          {isNight ? '☀️ Volver al modo día' : '🌙 Modo ahorro de noche'}
          <span className="action-cost">La base gasta solo 8⚡</span>
        </button>
      </div>
    </div>
  );
}
