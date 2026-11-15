import React, { useState } from 'react';

export default function StartModal({ onStart }) {
  const [name, setName] = useState('Cadete Explorador');

  const handleStart = () => {
    onStart(name.trim() || 'Comandante Junior');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #334155', paddingBottom: '10px' }}>
          <div style={{ fontSize: '13px', color: '#FBBF24', fontWeight: 'bold' }}>
            🚀 MISIÓN CRÁTER JEZERO · MARTE
          </div>
          <span style={{ fontSize: '9px', background: '#7C2D12', color: '#FEF08A', padding: '4px 8px', border: '2px solid #000' }}>
            NASA SPACE APPS 2026
          </span>
        </div>

        <div className="modal-desc">
          ¡Saludos, Comandante! Eres el líder del puesto avanzado en Marte. 
          Tu misión es mantener con vida a los 4 astronautas durante 7 Soles.<br /><br />
          Cada decisión que tomes cuesta recursos: si gastas energía en el rover, cuidas los paneles, pero tendrás menos luz para el invernadero.<br /><br />
          ¿Listo para el desafío de ingeniería espacial?
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '10px', color: '#FBBF24' }}>NOMBRE DEL COMANDANTE JUNIOR:</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            style={{ padding: '10px', background: '#0B0F19', border: '3px solid #334155', color: '#FFF', fontFamily: '"Press Start 2P"', fontSize: '11px' }}
          />
        </div>

        <button 
          className="pixel-btn pixel-btn-gold" 
          style={{ padding: '14px', fontSize: '12px' }}
          onClick={handleStart}
        >
          COMENZAR MISIÓN EN MARTE
        </button>
      </div>
    </div>
  );
}
