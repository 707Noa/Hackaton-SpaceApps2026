import React from 'react';
import { MISSIONS_LIST } from '../data/gameData';

export default function TelemetryHUD({ 
  state, 
  isMuted, 
  onToggleMute,
  onOpenMissions,
  onAdvanceSol
}) {
  const { sol, totalSols, crew, actionsRemaining, completedMissions = [] } = state;

  return (
    <header className="telemetry-header">
      <div className="telemetry-topbar pixel-box">
        <div className="brand-title">
          <strong>MARS OUTPOST</strong>
          <span className="location-badge">JEZERO · MARTE</span>
          <span className="sol-badge">SOL 0{sol} / 0{totalSols}</span>
          <span className="crew-badge">🧑‍🚀 SALUD {crew.health}%</span>
        </div>

        <div className="header-status-group">
          <span className="actions-badge">
            ÓRDENES: {actionsRemaining}/2
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
          >
            ☀️ SIGUIENTE SOL
          </button>

          <button 
            className="pixel-btn text-xs audio-toggle-btn"
            onClick={onToggleMute}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>
    </header>
  );
}
