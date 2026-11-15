import React from 'react';
import { NASA_SOURCES } from '../data/gameData';

export default function NasaScienceModal({ sourceKey, onClose }) {
  if (!sourceKey) return null;
  const data = NASA_SOURCES[sourceKey] || NASA_SOURCES['meda'];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '580px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #334155', paddingBottom: '10px' }}>
          <div style={{ fontSize: '12px', color: '#6EE7B7' }}>{data.title}</div>
          <span style={{ fontSize: '9px', background: '#047857', color: '#FFF', padding: '4px 8px', border: '2px solid #000' }}>
            {data.badge}
          </span>
        </div>

        <div className="nasa-source-box">
          <div style={{ color: '#FBBF24', fontSize: '14px', marginBottom: '8px' }}>
            Misión: {data.mission} · Ubicación: {data.location}
          </div>
          <div>{data.text}</div>
        </div>

        <button 
          className="pixel-btn" 
          style={{ alignSelf: 'flex-end', marginTop: '6px' }}
          onClick={onClose}
        >
          ENTENDIDO, VOLVER A LA MISIÓN
        </button>
      </div>
    </div>
  );
}
