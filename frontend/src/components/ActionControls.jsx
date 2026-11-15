import React from 'react';

export default function ActionControls({ onAction, onAdvanceSol }) {
  return (
    <footer style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px', background: '#111827', border: '3px solid #000', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        <button className="pixel-btn" onClick={() => onAction('plant')}>
          🌱 CULTIVAR
        </button>
        <button className="pixel-btn" onClick={() => onAction('clean')}>
          🚜 LIMPIAR POLVO
        </button>
        <button className="pixel-btn" onClick={() => onAction('moxie')}>
          🫁 MOXIE (O2)
        </button>
        <button className="pixel-btn" onClick={() => onAction('recycle')}>
          💧 RECICLAR AGUA
        </button>
        <button className="pixel-btn" onClick={() => onAction('bunker')}>
          🛡️ BÚNKER
        </button>
        <button className="pixel-btn" onClick={() => onAction('comms')}>
          📡 TIERRA
        </button>
      </div>

      <div>
        <button className="pixel-btn pixel-btn-gold" onClick={onAdvanceSol}>
          ▶ SIGUIENTE SOL
        </button>
      </div>
    </footer>
  );
}
