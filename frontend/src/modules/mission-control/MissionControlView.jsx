import React, { useState } from 'react';
import SolForecastPanel from '../../components/SolForecastPanel';
import { canIssueAction } from '../../services/gameEngine.js';

export default function MissionControlView({
  state,
  onExecuteAction,
  onAdvanceSol,
  onOpenNasaModal
}) {
  const { sol, totalSols, crew, scienceProgress, earthComms, actionsRemaining } = state;
  const [commsInput, setCommsInput] = useState('');
  const actionAvailable = canIssueAction(state);

  const handleSendQuery = (e) => {
    e.preventDefault();
    if (!commsInput.trim()) return;
    onExecuteAction('mission_control', 'ask_earth', { question: commsInput.trim() });
    setCommsInput('');
  };

  return (
    <div className="module-panel pixel-box">
      <div className="module-header">
        <div>
          <span className="module-tag">CONTROL DE MISIÓN</span>
          <h2 className="module-title">Habla con la Tierra</h2>
        </div>
        <button
          className="pixel-btn pixel-btn-cyan text-xs"
          onClick={() => onOpenNasaModal('dsn')}
        >
          🔍 Dato NASA
        </button>
      </div>

      <p className="module-desc">
        Houston está muy lejos: sus mensajes tardan unos 14 minutos. ¡Tú decides antes de cerrar cada Sol!
      </p>

      <div className="sol-timeline-card">
        <div className="flex-between text-xs mb-2">
          <span>TU VIAJE EN MARTE</span>
          <span className="text-gold">SOL 0{sol} DE 0{totalSols}</span>
        </div>
        <div className="sol-stepper-grid">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <div
              key={s}
              className={`sol-step-pill ${s === sol ? 'active' : ''} ${s < sol ? 'completed' : ''}`}
            >
              Sol {s}
            </div>
          ))}
        </div>
      </div>

      <SolForecastPanel state={state} />

      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-label">EXPLORADOR + ROVER</div>
          <div className="metric-value text-green">1 + 🤖</div>
          <div className="text-xs text-muted">Salud: {crew.health}%</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">CIENCIA</div>
          <div className="metric-value text-cyan">{scienceProgress} pts</div>
          <div className="text-xs text-muted">Por tus descubrimientos</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">ÓRDENES DE HOY</div>
          <div className={`metric-value ${actionsRemaining > 0 ? 'text-gold' : 'text-red'}`}>
            {actionsRemaining} / 2
          </div>
          <div className="text-xs text-muted">Te quedan para hoy</div>
        </div>
      </div>

      <div className="comms-panel">
        <div className="comms-header">
          <span>📡 MENSAJES DE LA TIERRA</span>
          <span className="badge-latency">LLEGAN EN ~14 MIN</span>
        </div>
        <div className="comms-messages-box">
          {earthComms.map((msg, idx) => (
            <div key={idx} className="comms-item">
              <div className="comms-item-meta">
                <strong>{msg.sender}</strong> · Sol 0{msg.sol}
              </div>
              <div className="comms-item-body">{msg.text}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendQuery} className="comms-input-row">
          <input
            type="text"
            className="pixel-input flex-1"
            placeholder="Escribe un mensaje a Houston..."
            value={commsInput}
            onChange={(e) => setCommsInput(e.target.value)}
            disabled={!actionAvailable}
          />
          <button
            type="submit"
            className="pixel-btn pixel-btn-cyan text-xs"
            disabled={!actionAvailable || !commsInput.trim()}
          >
            Enviar
          </button>
        </form>
      </div>

      <div className="advance-sol-box">
        <div className="advance-sol-info">
          <strong>¿Terminaste el Sol 0{sol}?</strong>
          <p className="text-xs text-muted">
            Pasa al día siguiente: la base gasta comida, agua y aire.
          </p>
        </div>
        <button
          className="pixel-btn pixel-btn-green advance-sol-btn"
          onClick={onAdvanceSol}
          disabled={Boolean(state.activeCrisis || state.gameOver || state.victory)}
        >
          🚀 Siguiente Sol
        </button>
      </div>
    </div>
  );
}
