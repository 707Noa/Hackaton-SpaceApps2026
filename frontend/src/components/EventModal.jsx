import React from 'react';

export default function EventModal({ event, onChooseOption, onOpenNasaModal }) {
  if (!event) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #334155', paddingBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#FBBF24', lineHeight: '1.4' }}>{event.title}</div>
            <div style={{ fontSize: '8px', color: '#94A3B8', marginTop: '4px' }}>{event.subtitle}</div>
          </div>
        </div>

        <div className="modal-desc">
          {event.description}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {event.choices.map((c) => (
            <div 
              key={c.id} 
              className="choice-card"
              onClick={() => onChooseOption(c)}
            >
              <div style={{ fontSize: '11px', color: '#FEF08A', marginBottom: '6px' }}>{c.text}</div>
              <div style={{ fontFamily: '"VT323", monospace', fontSize: '17px', color: '#CBD5E1' }}>{c.detail}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          <button 
            className="pixel-btn pixel-btn-green" 
            style={{ fontSize: '9px' }}
            onClick={() => onOpenNasaModal(event.nasaSourceKey)}
          >
            🔬 ORIGEN DEL DATO (NASA)
          </button>
          <span style={{ fontSize: '8px', color: '#94A3B8' }}>Elige una opción para continuar</span>
        </div>
      </div>
    </div>
  );
}
