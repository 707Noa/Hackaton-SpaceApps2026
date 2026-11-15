import React from 'react';

export default function AgrodomeView({ state, onExecuteAction, onOpenNasaModal }) {
  const { crops, resources, actionsRemaining } = state;
  const isReady = crops.stage >= 3;

  return (
    <div className="module-panel pixel-box">
      <div className="module-header">
        <div>
          <span className="module-tag">MOD-01 · CIENCIAS BIOLÓGICAS</span>
          <h2 className="module-title">Invernadero Agrodome (NASA Veggie)</h2>
        </div>
        <button 
          className="pixel-btn pixel-btn-cyan text-xs"
          onClick={() => onOpenNasaModal('veggie')}
        >
          🔍 Origen del Dato NASA
        </button>
      </div>

      <p className="module-desc">
        En Marte no existe tierra fértil. El Agrodome utiliza bandejas hidropónicas y aeropónicas iluminadas con longitudes de onda LED rojas y azules calibradas según los experimentos Veggie y OSDR de la NASA en la ISS.
      </p>

      {/* Visual Crop Bed */}
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
              {crops.cropType === 'veggie_lettuce' ? 'Lechuga Espacial Outredgeous' : 'Tubérculo Marciano'}
            </div>
            <div className="crop-status-line">
              Estado: <strong>
                {!crops.planted && crops.stage === 0 && 'Bandeja vacía (Lista para siembra)'}
                {crops.planted && crops.stage === 1 && 'Germinación inicial (Brote)'}
                {crops.planted && crops.stage === 2 && 'Crecimiento foliar acelerado'}
                {crops.stage >= 3 && '¡Maduración óptima alcanzada! (Lista para cosechar)'}
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
                Tiempo restante para la cosecha: {crops.solsToHarvest} Sol(es)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Module Action Buttons */}
      <div className="module-actions-grid">
        {!crops.planted && crops.stage === 0 && (
          <button
            className="pixel-btn pixel-btn-green"
            onClick={() => onExecuteAction('agrodome', 'plant', { cropType: 'veggie_lettuce' })}
            disabled={actionsRemaining <= 0 || resources.water < 8 || resources.energy < 6}
          >
            🌱 Sembrar Cultivo Veggie
            <span className="action-cost">Costo: 8💧 · 6⚡</span>
          </button>
        )}

        {isReady && (
          <button
            className="pixel-btn pixel-btn-gold"
            onClick={() => onExecuteAction('agrodome', 'harvest')}
            disabled={actionsRemaining <= 0}
          >
            🎉 Cosechar Alimentos (+25 🌱 · +6 O₂)
            <span className="action-cost">Beneficio Inmediato</span>
          </button>
        )}

        {crops.planted && !isReady && (
          <button
            className="pixel-btn"
            onClick={() => onExecuteAction('agrodome', 'boost_light')}
            disabled={actionsRemaining <= 0 || resources.energy < 5}
          >
            💡 Potenciar Luces LED (630nm/455nm)
            <span className="action-cost">Costo: 5⚡ · Acelera Cosecha</span>
          </button>
        )}
      </div>
    </div>
  );
}

