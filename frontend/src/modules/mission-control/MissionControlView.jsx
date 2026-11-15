import React, { useState } from 'react';

export default function MissionControlView({ 
  state, 
  onExecuteAction, 
  onAdvanceSol, 
  onOpenNasaModal 
}) {
  const { sol, totalSols, cadetName, crew, scienceProgress, earthComms, log, actionsRemaining } = state;
  const [commsInput, setCommsInput] = useState('');

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
          <span className="module-tag">MOD-05 · DIRECCIÓN DE CAMPAÑA Y TELECOMUNICACIONES</span>
          <h2 className="module-title">Mission Control: Asistente NOVA & Enlace DSN</h2>
        </div>
        <button 
          className="pixel-btn pixel-btn-cyan text-xs"
          onClick={() => onOpenNasaModal('dsn')}
        >
          🔍 Red Espacio Profundo DSN
        </button>
      </div>

      <p className="module-desc">
        La base Horizonte Rojo opera de forma autónoma. El retardo de propagación electromagnética entre la Tierra y Marte (14 minutos luz) impide el telecontrol en tiempo real. Como Comandante, debes balancear recursos antes de cerrar cada Sol.
      </p>

      {/* 7-Sol Timeline Stepper */}
      <div className="sol-timeline-card">
        <div className="flex-between text-xs mb-2">
          <span>CRONOGRAMA DE MISIÓN EN JEZERO</span>
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

      {/* Campaign Status Metrics */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-label">TRIPULACIÓN</div>
          <div className="metric-value text-green">{crew.count} Astronautas</div>
          <div className="text-xs text-muted">Salud: {crew.health}% ({crew.status})</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">PROGRESO CIENTÍFICO</div>
          <div className="metric-value text-cyan">{scienceProgress} pts</div>
          <div className="text-xs text-muted">Geología & Muestras de arcilla</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">ACCIONES DISPONIBLES HOY</div>
          <div className={`metric-value ${actionsRemaining > 0 ? 'text-gold' : 'text-red'}`}>
            {actionsRemaining} / 2
          </div>
          <div className="text-xs text-muted">Órdenes tácticas restantes</div>
        </div>
      </div>

      {/* Earth Communications Simulator */}
      <div className="comms-panel">
        <div className="comms-header">
          <span>📡 BANDEJA DE TRANSMISIONES TIERRA-MARTE (DSN)</span>
          <span className="badge-latency">LATENCIA: ~14.2 MIN LUZ</span>
        </div>
        <div className="comms-messages-box">
          {earthComms.map((msg, idx) => (
            <div key={idx} className="comms-item">
              <div className="comms-item-meta">
                <strong>{msg.sender}</strong> · Sol 0{msg.sol} ({msg.subject})
              </div>
              <div className="comms-item-body">{msg.text}</div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendQuery} className="comms-input-row">
          <input 
            type="text"
            className="pixel-input flex-1"
            placeholder="Escribe una consulta a Houston (ej. ¿Confirmar reservas de agua?)..."
            value={commsInput}
            onChange={(e) => setCommsInput(e.target.value)}
            disabled={actionsRemaining <= 0}
          />
          <button 
            type="submit" 
            className="pixel-btn pixel-btn-cyan text-xs"
            disabled={actionsRemaining <= 0 || !commsInput.trim()}
          >
            Enviar Señal
          </button>
        </form>
      </div>

      {/* Advance Sol Call-to-Action */}
      <div className="advance-sol-box">
        <div className="advance-sol-info">
          <strong>¿Has terminado las órdenes tácticas del Sol 0{sol}?</strong>
          <p className="text-xs text-muted">
            Avanzar al siguiente Sol procesará el consumo de agua y comida, la producción solar y los nuevos eventos de Jezero.
          </p>
        </div>
        <button
          className="pixel-btn pixel-btn-green advance-sol-btn"
          onClick={onAdvanceSol}
        >
          🚀 Finalizar Sol 0{sol} y Avanzar al Siguiente Sol
        </button>
      </div>
    </div>
  );
}
