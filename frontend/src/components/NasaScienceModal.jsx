import React from 'react';
import { NASA_SOURCES } from '../data/gameData';

export default function NasaScienceModal({ sourceKey, onClose }) {
  if (!sourceKey) return null;
  const data = NASA_SOURCES[sourceKey] || NASA_SOURCES['meda'];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '620px' }}>
        <div className="flex-between pb-2 border-b border-slate-700">
          <div>
            <span className="text-xs text-cyan">CIENCIA REAL DE LA NASA</span>
            <div style={{ fontSize: '12px', color: '#6EE7B7', marginTop: '2px' }}>{data.title}</div>
          </div>
          <span style={{ fontSize: '8px', background: '#047857', color: '#FFF', padding: '4px 8px', border: '2px solid #000' }}>
            {data.badge}
          </span>
        </div>

        <div className="nasa-source-box">
          <div style={{ color: '#FBBF24', fontSize: '10px', marginBottom: '8px' }}>
            <strong>Misión:</strong> {data.mission} · <strong>Ubicación:</strong> {data.location}
          </div>
          {data.instrument && (
            <div style={{ color: '#93C5FD', fontSize: '9px', marginBottom: '8px' }}>
              <strong>Instrumento:</strong> {data.instrument}
            </div>
          )}
          <div style={{ fontSize: '10px', lineHeight: '1.7', color: '#E2E8F0' }}>
            {data.text}
          </div>
          {data.nasaUrl && (
            <div style={{ marginTop: '10px', fontSize: '8px' }}>
              <a 
                href={data.nasaUrl} 
                target="_blank" 
                rel="noreferrer" 
                style={{ color: '#38BDF8', textDecoration: 'underline' }}
              >
                🌐 Consultar archivo y documentación científica oficial de la NASA ↗
              </a>
            </div>
          )}
        </div>

        <button 
          className="pixel-btn pixel-btn-green" 
          style={{ alignSelf: 'flex-end', marginTop: '6px' }}
          onClick={onClose}
        >
          ENTENDIDO, VOLVER A LA MISIÓN
        </button>
      </div>
    </div>
  );
}
