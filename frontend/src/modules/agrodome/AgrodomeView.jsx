import React from 'react';

export default function AgrodomeView({ state, onExecuteAction, onOpenNasaModal }) {
  const { crops, resources, actionsRemaining } = state;
  const isReady = crops.stage >= 3;

  return (
    <div className="module-panel pixel-box">
      <div className="module-header">
        <div>
          <span className="module-tag">INVERNADERO</span>
          <h2 className="module-title">Huerto Espacial</h2>
        </div>
        <button
          className="pixel-btn pixel-btn-cyan text-xs"
          onClick={() => onOpenNasaModal('veggie')}
        >
          🔍 Dato NASA
        </button>
      </div>

      <p className="module-desc">
        Marte no tiene tierra fértil. La NASA cultiva plantas con agua y luces LED rojas y azules.
      </p>

      <div className="crop-bed-container">
        <div className="crop-slot">
          <div className="crop-icon-large">
            {!crops.planted && crops.stage === 0 && '🟫'}
            {crops.planted && crops.stage === 1 && '🌱'}
            {crops.planted && crops.stage === 2 && '🌿'}
            {crops.stage >= 3 && '🥗'}
          </div>
          <div className="crop-details">
            <div className="crop-name">
              {crops.cropType === 'veggie_lettuce' ? 'Lechuga espacial' : 'Papa marciana'}
            </div>
            <div className="crop-status-line">
              Estado: <strong>
                {!crops.planted && crops.stage === 0 && 'Maceta vacía: ¡a sembrar!'}
                {crops.planted && crops.stage === 1 && 'Brotando'}
                {crops.planted && crops.stage === 2 && 'Creciendo rápido'}
                {crops.stage >= 3 && '¡Lista para cosechar!'}
              </strong>
            </div>
            {crops.planted && (
              <div className="progress-bar-wrap">
                <div
                  className="progress-bar-fill fill-green"
                  style={{ width: `${Math.min(100, (3 - crops.solsToHarvest) * 33.3)}%` }}
                />
              </div>
            )}
            {crops.planted && (
              <div className="text-xs text-muted">
                Faltan {crops.solsToHarvest} Sol(es) para cosechar
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="module-actions-grid">
        {!crops.planted && crops.stage === 0 && (
          <button
            className="pixel-btn pixel-btn-green"
            onClick={() => onExecuteAction('agrodome', 'plant', { cropType: 'veggie_lettuce' })}
            disabled={actionsRemaining <= 0 || resources.water < 8 || resources.energy < 6}
          >
            🌱 Sembrar lechuga
            <span className="action-cost">Cuesta 8💧 · 6⚡</span>
          </button>
        )}

        {isReady && (
          <button
            className="pixel-btn pixel-btn-gold"
            onClick={() => onExecuteAction('agrodome', 'harvest')}
            disabled={actionsRemaining <= 0}
          >
            🎉 Cosechar (+25 comida · +6 O₂)
            <span className="action-cost">Lo ganas al instante</span>
          </button>
        )}

        {crops.planted && !isReady && (
          <button
            className="pixel-btn"
            onClick={() => onExecuteAction('agrodome', 'boost_light')}
            disabled={actionsRemaining <= 0 || resources.energy < 5}
          >
            💡 Encender luces LED
            <span className="action-cost">Cuesta 5⚡ · Crece más rápido</span>
          </button>
        )}
      </div>
    </div>
  );
}
