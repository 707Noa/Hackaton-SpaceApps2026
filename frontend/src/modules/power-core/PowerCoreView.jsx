import React from 'react';
import { getDailyResourceChanges } from '../../services/gameEngine.js';

export default function PowerCoreView({ state, onExecuteAction, onOpenNasaModal }) {
  const { resources, dust, isNight, actionsRemaining, roverTask } = state;
  const dailyChanges = getDailyResourceChanges(state);
  const solarReduction = Math.round((1 - dailyChanges.solarGeneration / 28) * 100);
  const energyBalance = dailyChanges.energy;

  return (
    <div className="module-panel pixel-box">
      <div className="module-header">
        <div>
          <span className="module-tag">MOD-02 · MATRIZ ENERGÉTICA</span>
          <h2 className="module-title">Power Core & Datos Ambientales MEDA</h2>
        </div>
        <button 
          className="pixel-btn pixel-btn-cyan text-xs"
          onClick={() => onOpenNasaModal('meda')}
        >
          🔍 Origen del Dato NASA
        </button>
      </div>

      <p className="module-desc">
        La generación eléctrica depende de la matriz fotovoltaica. El sensor meteorológico MEDA del rover Perseverance demuestra que los remolinos de polvo fino en Jezero reducen la absorción solar sobre los paneles.
      </p>

      {/* Energy Metrics Dashboard */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-label">BATERÍAS CENTRALES</div>
          <div className="metric-value text-gold">{resources.energy} UJ</div>
          <div className="text-xs text-muted">Capacidad de reserva nocturna</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">PRODUCCIÓN SOLAR / SOL</div>
          <div className={`metric-value ${energyBalance < 0 ? 'text-red' : 'text-green'}`}>
            +{dailyChanges.solarGeneration} UJ
          </div>
          <div className="text-xs text-muted">
            Atenuación total: -{solarReduction}% · Base consume {dailyChanges.basePowerDraw} UJ
          </div>
          <div className={`text-xs ${energyBalance < 0 ? 'text-red' : 'text-green'}`}>
            Balance esperado: {energyBalance > 0 ? '+' : ''}{energyBalance} UJ
          </div>
          {resources.energy < 10 && (
            <div className="text-xs text-red">⚠️ Sin energía suficiente: el soporte vital se debilita.</div>
          )}
        </div>

        <div className="metric-card">
          <div className="metric-label">ÍNDICE DE POLVO (MEDA TAU)</div>
          <div className={`metric-value ${dust > 35 ? 'text-red' : 'text-cyan'}`}>{dust}%</div>
          <div className="text-xs text-muted">
            {dust > 35 ? '⚠️ Cobertura crítica de regolito' : 'Nivel de depósito moderado'}
          </div>
        </div>
      </div>

      {/* Dust Progress Indicator */}
      <div className="dust-indicator-wrap">
        <div className="flex-between text-xs mb-1">
          <span>Suciedad en Paneles Solares</span>
          <span>{dust}%</span>
        </div>
        <div className="progress-bar-wrap">
          <div 
            className={`progress-bar-fill ${dust > 35 ? 'fill-red' : 'fill-gold'}`}
            style={{ width: `${Math.min(100, dust)}%` }}
          />
        </div>
      </div>

      {/* Module Action Buttons */}
      <div className="module-actions-grid">
        <button
          className="pixel-btn pixel-btn-gold"
          onClick={() => onExecuteAction('power_core', 'clean_panels')}
          disabled={actionsRemaining <= 0 || resources.energy < 10 || roverTask === 'cleaning'}
        >
          🚜 Desplegar Rover para Limpieza de Paneles
          <span className="action-cost">Costo: 10⚡ · Deja Paneles al 100%</span>
        </button>

        <button
          className={`pixel-btn ${isNight ? 'pixel-btn-green' : ''}`}
          onClick={() => onExecuteAction('power_core', 'night_saver')}
          disabled={actionsRemaining <= 0}
        >
          {isNight ? '☀️ Desactivar Ahorro (Modo Diurno)' : '🌙 Activar Protocolo de Ahorro Nocturno'}
          <span className="action-cost">Reduce consumo base a 8⚡</span>
        </button>
      </div>
    </div>
  );
}
