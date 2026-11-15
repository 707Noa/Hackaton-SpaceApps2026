import React from 'react';

export default function ShieldSystemView({ state, onExecuteAction, onOpenNasaModal }) {
  const { shield, bunkerActive, resources, actionsRemaining } = state;

  return (
    <div className="module-panel pixel-box">
      <div className="module-header">
        <div>
          <span className="module-tag">PROTECCIÓN</span>
          <h2 className="module-title">Búnker y Escudo</h2>
        </div>
        <div className="flex gap-2">
          <button
            className="pixel-btn pixel-btn-cyan text-xs"
            onClick={() => onOpenNasaModal('donki')}
          >
            🔍 Dato DONKI
          </button>
          <button
            className="pixel-btn pixel-btn-cyan text-xs"
            onClick={() => onOpenNasaModal('curiosity_rad')}
          >
            🔍 Dato Curiosity
          </button>
        </div>
      </div>

      <p className="module-desc">
        Marte no frena la radiación del Sol. La tierra marciana sí la bloquea, y NASA DONKI avisa de las tormentas.
      </p>

      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-label">ESCUDO</div>
          <div className={`metric-value ${shield < 40 ? 'text-red' : 'text-green'}`}>{shield}%</div>
          <div className="text-xs text-muted">Cuánta radiación frena</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">BÚNKER</div>
          <div className={`metric-value ${bunkerActive ? 'text-green' : 'text-gold'}`}>
            {bunkerActive ? '🔒 CERRADO' : 'ABIERTO'}
          </div>
          <div className="text-xs text-muted">
            {bunkerActive ? 'El equipo está a salvo' : 'Listo para una tormenta'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">RADIACIÓN POR SOL</div>
          <div className="metric-value text-cyan">0.67 mSv</div>
          <div className="text-xs text-muted">Medida por Curiosity: ¡más que en la Tierra!</div>
        </div>
      </div>

      <div className="module-actions-grid">
        <button
          className={`pixel-btn ${bunkerActive ? 'pixel-btn-green' : 'pixel-btn-gold'}`}
          onClick={() => onExecuteAction('shield_system', 'toggle_bunker')}
          disabled={actionsRemaining <= 0 || (resources.energy < 6 && !bunkerActive)}
        >
          {bunkerActive ? '🔓 Abrir el búnker' : '🛡️ Entrar al búnker'}
          <span className="action-cost">{bunkerActive ? 'Gratis' : 'Cuesta 6⚡ · Máxima protección'}</span>
        </button>

        <button
          className="pixel-btn"
          onClick={() => onExecuteAction('shield_system', 'eva_expedition')}
          disabled={actionsRemaining <= 0 || resources.oxygen < 6 || resources.water < 6 || bunkerActive}
        >
          🥾 Salir a explorar el cráter
          <span className="action-cost">Cuesta 6 O₂ · 6💧 · +18 ciencia</span>
        </button>

        <button
          className="pixel-btn"
          onClick={() => onExecuteAction('shield_system', 'reinforce_regolith')}
          disabled={actionsRemaining <= 0 || resources.energy < 8}
        >
          🧱 Reforzar con tierra marciana
          <span className="action-cost">Cuesta 8⚡ · Escudo +15%</span>
        </button>
      </div>
    </div>
  );
}
