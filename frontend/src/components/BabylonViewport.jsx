import React, { useEffect, useRef, useState } from 'react';
import { BabylonSceneManager } from '../services/babylonSceneManager';
import { sounds } from '../services/audioService';

export default function BabylonViewport({ 
  state, 
  onModuleClick, 
  speechBubble, 
  controlsEnabled = true 
}) {
  const canvasRef = useRef(null);
  const managerRef = useRef(null);
  const [nearbyZone, setNearbyZone] = useState(null);

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
      }
    );
    managerRef.current = manager;

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

  const bindVirtualKey = (code) => ({
    onMouseDown: () => managerRef.current?.setVirtualKey(code, true),
    onMouseUp: () => managerRef.current?.setVirtualKey(code, false),
    onMouseLeave: () => managerRef.current?.setVirtualKey(code, false),
    onTouchStart: (e) => { e.preventDefault(); managerRef.current?.setVirtualKey(code, true); },
    onTouchEnd: (e) => { e.preventDefault(); managerRef.current?.setVirtualKey(code, false); }
  });

  return (
    <div className="pixel-viewport-frame pixel-box">
      <canvas ref={canvasRef} className="pixel-canvas-element" />

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
        <button className="dpad-btn dpad-up" {...bindVirtualKey('ArrowUp')} title="Arriba (W)">▲</button>
        <div className="dpad-mid">
          <button className="dpad-btn dpad-left" {...bindVirtualKey('ArrowLeft')} title="Izquierda (A)">◀</button>
          <button className="dpad-btn dpad-down" {...bindVirtualKey('ArrowDown')} title="Abajo (S)">▼</button>
          <button className="dpad-btn dpad-right" {...bindVirtualKey('ArrowRight')} title="Derecha (D)">▶</button>
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
