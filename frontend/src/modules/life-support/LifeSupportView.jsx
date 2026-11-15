import React from 'react';
import { canIssueAction } from '../../services/gameEngine.js';

export default function LifeSupportView({ state, onExecuteAction, onOpenNasaModal }) {
  const { resources, actionsRemaining } = state;
  const actionAvailable = canIssueAction(state);

  return (
    <div className="module-panel pixel-box">
      <div className="module-header">
        <div>
          <span className="module-tag">AIRE Y AGUA</span>
          <h2 className="module-title">Aire y Agua</h2>
        </div>
        <div className="flex gap-2">
          <button
            className="pixel-btn pixel-btn-cyan text-xs"
            onClick={() => onOpenNasaModal('moxie')}
          >
            🔍 Dato MOXIE
          </button>
          <button
            className="pixel-btn pixel-btn-cyan text-xs"
            onClick={() => onOpenNasaModal('eclss')}
          >
            🔍 Dato ECLSS
          </button>
        </div>
      </div>

      <p className="module-desc">
        El aire de Marte es 95% CO₂. La máquina MOXIE lo vuelve oxígeno, y la Estación Espacial recicla el agua.
      </p>

      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-label">AGUA LIMPIA</div>
          <div className="metric-value text-cyan">{resources.water}%</div>
          <div className="text-xs text-muted">Se gasta ~8 por Sol</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">OXÍGENO</div>
          <div className="metric-value text-green">{resources.oxygen}%</div>
          <div className="text-xs text-muted">Para respirar</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">AIRE SUCIO (CO₂)</div>
          <div className={`metric-value ${resources.co2 > 20 ? 'text-red' : 'text-gold'}`}>
            {resources.co2}%
          </div>
          <div className="text-xs text-muted">
            {resources.co2 > 20 ? '⚠️ ¡Da sueño! Limpia el aire' : 'Aire seguro'}
          </div>
        </div>
      </div>

      <div className="module-actions-grid">
        <button
          className="pixel-btn pixel-btn-green"
          onClick={() => onExecuteAction('life_support', 'moxie')}
          disabled={!actionAvailable || resources.energy < 12}
        >
          O₂ Encender MOXIE
          <span className="action-cost">Cuesta 12⚡ · Hace +18 O₂</span>
        </button>

        <button
          className="pixel-btn pixel-btn-cyan"
          onClick={() => onExecuteAction('life_support', 'recycle_water')}
          disabled={!actionAvailable || resources.energy < 8}
        >
          💧 Reciclar agua
          <span className="action-cost">Cuesta 8⚡ · Recupera +16💧</span>
        </button>

        <button
          className="pixel-btn"
          onClick={() => onExecuteAction('life_support', 'scrub_co2')}
          disabled={!actionAvailable || resources.energy < 4}
        >
          🍃 Limpiar filtros de aire
          <span className="action-cost">Cuesta 4⚡ · Baja el CO₂ en 12</span>
        </button>
      </div>
    </div>
  );
}
