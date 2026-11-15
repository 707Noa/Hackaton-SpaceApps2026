import React, { useState } from 'react';

export default function StartScene({ onStart }) {
  const [name, setName] = useState('Cadete Explorador');

  const handleSubmit = (e) => {
    e.preventDefault();
    onStart(name.trim() || 'Cadete Explorador');
  };

  return (
    <div className="start-scene-screen">
      <div className="start-scene-card pixel-box">
        <div className="start-badge-row">
          <span className="start-nasa-tag">NASA SPACE APPS CHALLENGE 2026</span>
          <span className="start-age-tag">CADETES 7 - 12 AÑOS</span>
        </div>

        {/* Pixel Mars Graphic Header */}
        <div className="start-hero">
          <div className="pixel-mars-orb" aria-hidden="true">
            <div className="mars-ice-cap" />
            <div className="mars-canyon" />
            <div className="mars-crater c1" />
            <div className="mars-crater c2" />
            <div className="mars-crater c3" />
          </div>
          <div className="start-titles">
            <h1 className="start-main-title">MARS OUTPOST</h1>
            <div className="start-subtitle">HORIZONTE ROJO · CRÁTER JEZERO</div>
            <p className="start-lead">
              ¡Bienvenido a Marte! Tu equipo de 4 astronautas depende de ti para sobrevivir 7 Soles.
              Camina por la base, equilibra tus recursos y cumple las misiones científicas de la NASA.
            </p>
          </div>
        </div>

        {/* Visual 3-Step Kids Guide */}
        <div className="start-guide-grid">
          <div className="guide-step-card">
            <div className="guide-step-icon">⌨️</div>
            <div className="guide-step-title">1. EXPLORA EN 3D</div>
            <div className="guide-step-text">
              Usa las teclas <strong>WASD</strong> o las <strong>Flechas</strong> para caminar con tu astronauta y presiona <strong>[E]</strong> cerca de los edificios.
            </div>
          </div>

          <div className="guide-step-card">
            <div className="guide-step-icon">⚡</div>
            <div className="guide-step-title">2. CUIDA RECURSOS</div>
            <div className="guide-step-text">
              Cada decisión cuesta energía o agua. Si limpias los paneles solares, tendrás electricidad; si siembras, tendrás comida.
            </div>
          </div>

          <div className="guide-step-card">
            <div className="guide-step-icon">🏆</div>
            <div className="guide-step-title">3. CUMPLE MISIONES</div>
            <div className="guide-step-text">
              Abre el panel de <strong>Misiones</strong> para ver tus objetivos y ganar tu Diploma Oficial de Comandante Junior.
            </div>
          </div>
        </div>

        {/* Cadet Name Form */}
        <form onSubmit={handleSubmit} className="start-form-box">
          <label className="start-input-label" htmlFor="cadet-name-input">
            ESCRIBE TU NOMBRE DE COMANDANTE JUNIOR:
          </label>
          <div className="start-form-row">
            <input
              id="cadet-name-input"
              type="text"
              className="pixel-input flex-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="Ej. Sofía, Mateo..."
            />
            <button type="submit" className="pixel-btn pixel-btn-gold start-launch-btn">
              🚀 DESPEGAR A MARTE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
