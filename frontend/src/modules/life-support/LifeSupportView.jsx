import React from 'react';

export default function LifeSupportView({ state, onExecuteAction, onOpenNasaModal }) {
  const { resources, actionsRemaining } = state;

  return (
    <div className="module-panel pixel-box">
      <div className="module-header">
        <div>
          <span className="module-tag">MOD-03 · SOPORTE VITAL Y CONTROL AMBIENTAL</span>
          <h2 className="module-title">Life Support: Reciclaje ECLSS & Electrólisis MOXIE</h2>
        </div>
        <div className="flex gap-2">
          <button 
            className="pixel-btn pixel-btn-cyan text-xs"
            onClick={() => onOpenNasaModal('moxie')}
          >
            🔍 Datos MOXIE
          </button>
          <button 
            className="pixel-btn pixel-btn-cyan text-xs"
            onClick={() => onOpenNasaModal('eclss')}
          >
            🔍 Datos ECLSS
          </button>
        </div>
      </div>

      <p className="module-desc">
        La atmósfera de Marte posee 95% de CO₂ y cero agua superficial. Para sostener a la tripulación, el sistema combina el reciclador de circuito cerrado ECLSS (probado en la ISS) con la tecnología MOXIE (probada en Jezero por Perseverance) para convertir CO₂ en O₂ respirable.
      </p>

      {/* Atmospheric & Liquid Indicators */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-label">RESERVAS DE AGUA PURIFICADA</div>
          <div className="metric-value text-cyan">{resources.water} UJ</div>
          <div className="text-xs text-muted">Consumo: ~8 UJ por Sol</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">OXÍGENO RESPIRABLE (O₂)</div>
          <div className="metric-value text-green">{resources.oxygen} UJ</div>
          <div className="text-xs text-muted">Presurización: Nominal (21%)</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">CONCENTRACIÓN DE CO₂</div>
          <div className={`metric-value ${resources.co2 > 20 ? 'text-red' : 'text-gold'}`}>
            {resources.co2}%
          </div>
          <div className="text-xs text-muted">
            {resources.co2 > 20 ? '⚠️ Riesgo de somnolencia/asfixia' : 'Nivel bajo filtro seguro'}
          </div>
        </div>
      </div>

      {/* Module Action Buttons */}
      <div className="module-actions-grid">
        <button
          className="pixel-btn pixel-btn-green"
          onClick={() => onExecuteAction('life_support', 'moxie')}
          disabled={actionsRemaining <= 0 || resources.energy < 12}
        >
          🫁 Activar Electrólisis MOXIE
          <span className="action-cost">Costo: 12⚡ · Genera +18🫁 de Oxígeno</span>
        </button>

        <button
          className="pixel-btn pixel-btn-cyan"
          onClick={() => onExecuteAction('life_support', 'recycle_water')}
          disabled={actionsRemaining <= 0 || resources.energy < 8}
        >
          💧 Activar Reciclador de Agua ECLSS
          <span className="action-cost">Costo: 8⚡ · Recupera +16💧 de Agua</span>
        </button>

        <button
          className="pixel-btn"
          onClick={() => onExecuteAction('life_support', 'scrub_co2')}
          disabled={actionsRemaining <= 0 || resources.energy < 4}
        >
          🍃 Depurar y Renovar Filtros de CO₂
          <span className="action-cost">Costo: 4⚡ · Reduce CO₂ en -12%</span>
        </button>
      </div>
    </div>
  );
}
