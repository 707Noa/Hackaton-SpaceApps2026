import React, { useEffect, useRef, useState } from 'react';
import { BabylonSceneManager } from '../services/babylonSceneManager';
import { sounds } from '../services/audioService';

export default function BabylonViewport({ 
  state, 
  onModuleClick, 
  speechBubble, 
  controlsEnabled = true,
  reducedMotion = false
}) {
  const canvasRef = useRef(null);
  const managerRef = useRef(null);
  const [nearbyZone, setNearbyZone] = useState(null);
  const [mapTarget, setMapTarget] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const manager = new BabylonSceneManager(
      canvas,
      (moduleKey, message) => {
        sounds.playClick();
        onModuleClick(moduleKey, message);
      },
      (zone) => {
        setNearbyZone(zone);
      },
      (target) => {
        setMapTarget(target);
      }
    );
    managerRef.current = manager;
    manager.setReducedMotion(reducedMotion);

    return () => {
      if (managerRef.current) {
        managerRef.current.dispose();
        managerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.syncGameState(state);
    }
  }, [state]);

  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.setControlsEnabled(controlsEnabled);
    }
  }, [controlsEnabled]);

  useEffect(() => {
    if (managerRef.current) {
      managerRef.current.setReducedMotion(reducedMotion);
    }
  }, [reducedMotion]);

  const bindVirtualKey = (code) => ({
    onMouseDown: () => managerRef.current?.setVirtualKey(code, true),
    onMouseUp: () => managerRef.current?.setVirtualKey(code, false),
    onMouseLeave: () => managerRef.current?.setVirtualKey(code, false),
    onTouchStart: (e) => { e.preventDefault(); managerRef.current?.setVirtualKey(code, true); },
    onTouchEnd: (e) => { e.preventDefault(); managerRef.current?.setVirtualKey(code, false); },
    onTouchCancel: () => managerRef.current?.setVirtualKey(code, false),
    onBlur: () => managerRef.current?.setVirtualKey(code, false)
  });

  return (
    <div className="pixel-viewport-frame pixel-box">
      <canvas ref={canvasRef} className="pixel-canvas-element" />

      {mapTarget && (
        <div className="map-target-card" aria-live="polite">
          <strong>{mapTarget.title}</strong>
          {mapTarget.severity && (
            <span className={`map-target-status map-target-${mapTarget.severity}`}>
              {mapTarget.severity === 'nominal' ? '✅ Sistema estable' : mapTarget.severity === 'warning' ? '🟠 Conviene revisar' : '🔴 Atención necesaria'}
            </span>
          )}
          {mapTarget.description && <span>{mapTarget.description}</span>}
          <small>Haz clic en el edificio para abrir su módulo</small>
        </div>
      )}

      <div className="viewport-zoom-controls" aria-label="Controles de zoom">
        <button
          className="viewport-zoom-btn"
          onClick={() => managerRef.current?.zoomCamera(-1)}
          aria-label="Acercar cámara"
          title="Acercar"
        >
          +
        </button>
        <button
          className="viewport-zoom-btn"
          onClick={() => managerRef.current?.zoomCamera(1)}
          aria-label="Alejar cámara"
          title="Alejar"
        >
          -
        </button>
      </div>

      {/* Proximity Action Prompt when walking near a building */}
      {nearbyZone && (
        <button
          className="proximity-prompt-btn"
          onClick={() => {
            sounds.playClick();
            onModuleClick(nearbyZone.module, `Abriendo ${nearbyZone.title}...`);
          }}
        >
          <span className="key-cap">E</span>
          <span>Abrir {nearbyZone.title}</span>
        </button>
      )}

      {/* Touch / On-screen D-Pad for Tablets & Kids */}
      <div className="touch-dpad" aria-label="Controles de movimiento">
        <button className="dpad-btn dpad-up" {...bindVirtualKey('ArrowUp')} title="Arriba (W)" aria-label="Mover hacia arriba">▲</button>
        <div className="dpad-mid">
          <button className="dpad-btn dpad-left" {...bindVirtualKey('ArrowLeft')} title="Izquierda (A)" aria-label="Mover hacia la izquierda">◀</button>
          <button className="dpad-btn dpad-down" {...bindVirtualKey('ArrowDown')} title="Abajo (S)" aria-label="Mover hacia abajo">▼</button>
          <button className="dpad-btn dpad-right" {...bindVirtualKey('ArrowRight')} title="Derecha (D)" aria-label="Mover hacia la derecha">▶</button>
        </div>
      </div>

      {/* Retro Interactive Hint Bar */}
      <div className="viewport-hint-bar">
        <span className="badge-pixel-engine">CONTROLES</span>
        <span className="hint-text">WASD o Flechas: Caminar • [E]: Entrar • Arrastra: Rotar • +/-: Zoom</span>
      </div>

      {/* Dynamic NOVA Speech Bubble Overlay */}
      {speechBubble && Date.now() < speechBubble.timer && (
        <div className="viewport-speech-bubble">
          <span className="bubble-speaker">NOVA (ASISTENTE):</span>
          <span>{speechBubble.text}</span>
        </div>
      )}
    </div>
  );
}
