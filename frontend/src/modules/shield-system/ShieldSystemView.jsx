import React from 'react';

export default function ShieldSystemView({ state, onExecuteAction, onOpenNasaModal }) {
  const { shield, bunkerActive, resources, actionsRemaining } = state;

  return (
    <div className="module-panel pixel-box">
      <div className="module-header">
        <div>
          <span className="module-tag">MOD-04 · PROTECCIÓN Y SEGURIDAD AMBIENTAL</span>
          <h2 className="module-title">Shield System: Búnker de Regolito & Clima Espacial DONKI</h2>
        </div>
        <div className="flex gap-2">
          <button 
            className="pixel-btn pixel-btn-cyan text-xs"
            onClick={() => onOpenNasaModal('donki')}
          >
            🔍 Datos DONKI
          </button>
          <button 
            className="pixel-btn pixel-btn-cyan text-xs"
            onClick={() => onOpenNasaModal('curiosity_rad')}
          >
            🔍 Mediciones RAD
          </button>
        </div>
      </div>

      <p className="module-desc">
        Marte no posee campo magnético global. La radiación cósmica galáctica y las eyecciones solares (CME) catalogadas por NASA DONKI representan un riesgo letal. El búnker del puesto utiliza sacos de regolito marciano como blindaje de masa pasivo.
      </p>

      {/* Shield Metrics Dashboard */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-label">INTEGRIDAD DEL ESCUDO</div>
          <div className={`metric-value ${shield < 40 ? 'text-red' : 'text-green'}`}>{shield}%</div>
          <div className="text-xs text-muted">Atenuación de rayos cósmicos</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">ESTADO DEL BÚNKER DE REGOLITO</div>
          <div className={`metric-value ${bunkerActive ? 'text-green' : 'text-gold'}`}>
            {bunkerActive ? '🔒 ACTIVO (SEGURO)' : 'STANDBY'}
          </div>
          <div className="text-xs text-muted">
            {bunkerActive ? 'Tripulación resguardada bajo roca' : 'Cúpula en configuración estándar'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">DOSIS AMBIENTAL ESTIMADA</div>
          <div className="metric-value text-cyan">~0.67 mSv/sol</div>
          <div className="text-xs text-muted">Línea base histórica Curiosity RAD</div>
        </div>
      </div>

      {/* Module Action Buttons */}
      <div className="module-actions-grid">
        <button
          className={`pixel-btn ${bunkerActive ? 'pixel-btn-green' : 'pixel-btn-gold'}`}
          onClick={() => onExecuteAction('shield_system', 'toggle_bunker')}
          disabled={actionsRemaining <= 0 || (resources.energy < 6 && !bunkerActive)}
        >
          {bunkerActive ? '🔓 Abrir Búnker y Reanudar Salidas' : '🛡️ Activar Refugio en Búnker de Regolito'}
          <span className="action-cost">{bunkerActive ? 'Sin costo de salida' : 'Costo: 6⚡ · Protección Máxima'}</span>
        </button>

        <button
          className="pixel-btn"
          onClick={() => onExecuteAction('shield_system', 'eva_expedition')}
          disabled={actionsRemaining <= 0 || resources.oxygen < 6 || resources.water < 6 || bunkerActive}
        >
          🥾 Planificar Expedición EVA al Delta Antiguo
          <span className="action-cost">Costo: 6🫁 · 6💧 · Suma +18 Ciencia</span>
        </button>

        <button
          className="pixel-btn"
          onClick={() => onExecuteAction('shield_system', 'reinforce_regolith')}
          disabled={actionsRemaining <= 0 || resources.energy < 8}
        >
          🧱 Compactar Capa de Regolito en la Cúpula
          <span className="action-cost">Costo: 8⚡ · Sube Escudo +15%</span>
        </button>
      </div>
    </div>
  );
}
