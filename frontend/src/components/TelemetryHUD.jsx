import React from 'react';
import { sounds } from '../services/audioService';

export default function TelemetryHUD({ state, isMuted, onToggleMute }) {
  const { sol, resources } = state;

  const meters = [
    { id: 'energy', label: '⚡ ENERGÍA', val: resources.energy, color: '#FBBF24' },
    { id: 'water', label: '💧 AGUA', val: resources.water, color: '#38BDF8' },
    { id: 'oxygen', label: '🫁 OXÍGENO', val: resources.oxygen, color: '#BAE6FD' },
    { id: 'food', label: '🌱 COMIDA', val: resources.food, color: '#34D399' },
    { id: 'shield', label: '🛡️ ESCUDO', val: resources.shield, color: '#A78BFA' },
    { id: 'dust', label: '🧹 POLVO', val: resources.dust, color: '#F87171' }
  ];

  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
      {/* Top Header Bar */}
      <div className="pixel-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
        <div style={{ fontSize: '13px', color: '#FBBF24', fontWeight: 'bold' }}>
          🪐 MARS OUTPOST: HORIZONTE ROJO
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', background: '#7C2D12', color: '#FEF08A', padding: '4px 8px', border: '2px solid #000' }}>
            SOL 0{sol} / 07
          </span>
          <button 
            className="pixel-btn" 
            style={{ fontSize: '8px', padding: '4px 6px' }}
            onClick={onToggleMute}
          >
            {isMuted ? '🔇 MUTE' : '🔊 AUDIO'}
          </button>
        </div>
      </div>

      {/* 6 Resources Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px' }}>
        {meters.map(m => (
          <div key={m.id} style={{ background: '#0F172A', border: '2px solid #000', padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: '#94A3B8' }}>
              <span>{m.label}</span>
              <span style={{ fontSize: '10px', color: '#FFF', fontWeight: 'bold' }}>{m.val}%</span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#1E293B', border: '1px solid #000', overflow: 'hidden' }}>
              <div style={{ width: `${m.val}%`, height: '100%', backgroundColor: m.color, transition: 'width 0.3s ease' }}></div>
            </div>
          </div>
        ))}
      </div>
    </header>
  );
}
