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
  const [perspective, setPerspective] = useState('third');
  const [gyroState, setGyroState] = useState('off');

  const toggleGyroscope = async () => {
    const manager = managerRef.current;
    if (!manager) return;
    if (gyroState === 'on') {
      manager.disableGyroscope();
      setGyroState('off');
      return;
    }
    setGyroState(await manager.enableGyroscope());
  };

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
    manager.onPerspectiveChange = setPerspective;
    manager.onGyroChange = setGyroState;
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

      {state.activeHazard && (
        <div
          className={`viewport-hazard-effect viewport-hazard-${state.activeHazard.type}`}
          role="status"
          aria-live="assertive"
        >
          <strong>
            {state.activeHazard.type === 'solar_radiation'
              ? '☀️ ALERTA DE RADIACIÓN'
              : '🌪️ TORMENTA DE POLVO'}
          </strong>
          <span>
            {state.activeHazard.type === 'solar_radiation'
              ? state.bunkerActive ? 'Tripulación protegida en el búnker' : 'Cierra el búnker antes de terminar el Sol'
              : 'Paneles solares afectados · Revisa el rover'}
          </span>
        </div>
      )}

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

      <div className="viewport-zoom-controls" aria-label="Controles de cámara">
        <button
          className="viewport-zoom-btn"
          onClick={() => managerRef.current?.togglePerspective()}
          aria-label={perspective === 'first' ? 'Cambiar a tercera persona' : 'Cambiar a primera persona'}
          title="Cambiar vista (P)"
        >
          {perspective === 'first' ? '🧍' : '👁'}
        </button>
        <button
          className="viewport-zoom-btn"
          onClick={toggleGyroscope}
          aria-pressed={gyroState === 'on'}
          aria-label="Activar o desactivar el giroscopio"
          title={{
            on: 'Giroscopio activado: mueve tu dispositivo para mirar',
            off: 'Activar giroscopio (mover el dispositivo para mirar)',
            denied: 'Permiso del giroscopio denegado',
            unsupported: 'Este dispositivo no tiene giroscopio'
          }[gyroState]}
          style={{ opacity: gyroState === 'denied' || gyroState === 'unsupported' ? 0.5 : 1 }}
        >
          {gyroState === 'on' ? '🧭✓' : '🧭'}
        </button>
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
      <div
        className={`touch-dpad ${state.bunkerActive ? 'touch-dpad-disabled' : ''}`}
        aria-label="Controles de movimiento"
        aria-disabled={state.bunkerActive}
      >
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
        <span className="hint-text">
          {state.bunkerActive
            ? 'Tripulación en el búnker: usa los módulos y abre el refugio cuando pase el riesgo.'
            : 'WASD o Flechas: Caminar • [E]: Entrar • [P]: Cambiar vista • Arrastra: Rotar • +/-: Zoom'}
        </span>
      </div>

      {/* Dynamic NOVA Speech Bubble Overlay */}
      {speechBubble && !state.activeHazard && Date.now() < speechBubble.timer && (
        <div className="viewport-speech-bubble">
          <span className="bubble-speaker">NOVA (ASISTENTE):</span>
          <span>{speechBubble.text}</span>
        </div>
      )}
    </div>
  );
}
