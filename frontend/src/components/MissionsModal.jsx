import React from 'react';
import { MISSIONS_LIST } from '../data/gameData';

export default function MissionsModal({ completedMissions = [], onSelectModule, onClose }) {
  const completedCount = completedMissions.length;

  return (
    <div className="modal-overlay">
      <div className="modal-content missions-modal-content">
        <div className="flex-between pb-2 border-b border-rose-900">
          <div>
            <span className="text-xs text-cyan">TABLERO DE OBJETIVOS · CRÁTER JEZERO</span>
            <h2 style={{ fontSize: '13px', color: '#FBBF24', marginTop: '4px' }}>
              MISIONES DEL COMANDANTE ({completedCount} / {MISSIONS_LIST.length})
            </h2>
          </div>
          <button className="pixel-btn text-xs" onClick={onClose}>
            ✕ CERRAR
          </button>
        </div>

        <p className="text-xs text-muted" style={{ lineHeight: '1.6' }}>
          Camina por la base marciana hasta el edificio indicado o haz clic en "Ir al Módulo" para completar cada misión y ganar puntos de ciencia.
        </p>

        <div className="missions-list-scroll">
          {MISSIONS_LIST.map((mission) => {
            const isDone = completedMissions.includes(mission.id);
            return (
              <div 
                key={mission.id} 
                className={`mission-row-card ${isDone ? 'mission-done' : ''}`}
              >
                <div className="mission-icon-badge">{mission.icon}</div>
                <div className="mission-row-body">
                  <div className="mission-row-top">
                    <strong className="mission-row-title">{mission.title}</strong>
                    <span className={`mission-status-pill ${isDone ? 'done' : 'pending'}`}>
                      {isDone ? '✓ COMPLETADA' : `+${mission.rewardScience} CIENCIA`}
                    </span>
                  </div>
                  <div className="mission-row-goal">{mission.goal}</div>
                  <div className="mission-row-tip">💡 Dato NASA: {mission.tip}</div>
                </div>
                {!isDone && (
                  <button
                    className="pixel-btn pixel-btn-cyan text-xs"
                    style={{ whiteSpace: 'nowrap', alignSelf: 'center' }}
                    onClick={() => {
                      onSelectModule(mission.module);
                      onClose();
                    }}
                  >
                    Ir a {mission.moduleLabel.split(' ')[0]}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex-between mt-2">
          <span className="text-xs text-gold">
            Progreso Total: {Math.round((completedCount / MISSIONS_LIST.length) * 100)}%
          </span>
          <button className="pixel-btn pixel-btn-green" onClick={onClose}>
            VOLVER A LA BASE
          </button>
        </div>
      </div>
    </div>
  );
}
