import React from 'react';
import { canIssueAction } from '../../services/gameEngine.js';

const cropStatus = (plot) => {
  if (!plot.planted) return 'Parcela libre';
  if (plot.stage >= 3) return 'Lista para cosechar';
  if (plot.drySols > 0) return 'Necesita agua';
  return plot.stage === 1 ? 'Brotando' : 'Creciendo';
};

export default function AgrodomeView({ state, onExecuteAction, onOpenNasaModal }) {
  const { cropPlots, resources, actionsRemaining } = state;
  const actionAvailable = canIssueAction(state);

  return (
    <div className="module-panel pixel-box">
      <div className="module-header">
        <div>
          <span className="module-tag">INVERNADERO</span>
          <h2 className="module-title">Huerto y comida</h2>
        </div>
        <button
          className="pixel-btn pixel-btn-cyan text-xs"
          onClick={() => onOpenNasaModal('veggie')}
        >
          🔍 Dato NASA
        </button>
      </div>

      <p className="module-desc">
        Cuida cada parcela. Las plantas necesitan agua; cuando estén listas, cosecha para guardar comida.
      </p>

      <div className="crop-plots-grid">
        {cropPlots.map((plot, index) => (
          <article className={`crop-plot-card ${plot.stage >= 3 ? 'crop-plot-ready' : ''}`} key={plot.id}>
            <div className="crop-plot-heading">
              <strong>Parcela {index + 1}</strong>
              <span>{cropStatus(plot)}</span>
            </div>
            <div className="crop-plot-plant" aria-hidden="true">
              {!plot.planted && '🟫'}
              {plot.planted && plot.stage === 1 && '🌱'}
              {plot.planted && plot.stage === 2 && '🌿'}
              {plot.planted && plot.stage >= 3 && '🥬'}
            </div>
            {plot.planted && plot.stage < 3 && (
              <div className="crop-plot-progress">
                <span style={{ width: `${Math.min(100, (3 - plot.solsToHarvest) * 33.3)}%` }} />
              </div>
            )}
            {plot.planted && plot.stage < 3 && (
              <small>
                {plot.drySols > 0
                  ? 'Si sigue seca, la planta se marchitará.'
                  : `Crece en ${plot.solsToHarvest} Sol(es)`}
              </small>
            )}
            {!plot.planted && (
              <button
                className="pixel-btn pixel-btn-green"
                onClick={() => onExecuteAction('agrodome', 'plant', {
                  plotIndex: index,
                  cropType: 'veggie_lettuce'
                })}
                disabled={!actionAvailable || resources.water < 8 || resources.energy < 6}
              >
                🌱 Sembrar
                <span className="action-cost">8💧 · 6⚡</span>
              </button>
            )}
            {plot.planted && plot.stage >= 3 && (
              <button
                className="pixel-btn pixel-btn-gold"
                onClick={() => onExecuteAction('agrodome', 'harvest', { plotIndex: index })}
                disabled={!actionAvailable}
              >
                🧺 Cosechar
                <span className="action-cost">+25 comida · +6 O₂</span>
              </button>
            )}
            {plot.planted && plot.stage < 3 && (
              <button
                className="pixel-btn"
                onClick={() => onExecuteAction('agrodome', 'boost_light', { plotIndex: index })}
                disabled={!actionAvailable || resources.energy < 5}
              >
                💡 Acelerar crecimiento
                <span className="action-cost">5⚡</span>
              </button>
            )}
          </article>
        ))}
      </div>

      <div className="hunger-action-card">
        <div>
          <strong>🍽️ Hambre: {state.hunger}%</strong>
          <span>Comida guardada: {resources.food}%</span>
        </div>
        <button
          className="pixel-btn pixel-btn-cyan"
          onClick={() => onExecuteAction('agrodome', 'eat')}
          disabled={!actionAvailable || resources.food < 12 || state.hunger >= 95}
        >
          🍽️ Comer una ración
          <span className="action-cost">−12 comida · +40 hambre</span>
        </button>
      </div>

      <div className="text-xs text-muted">Órdenes disponibles: {actionsRemaining}/{state.maxActionsPerSol}</div>
    </div>
  );
}
