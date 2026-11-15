import React, { useState } from 'react';
import { LAUNCH_PREPARATION_TASKS } from '../data/gameData';

export default function StartScene({ onStart }) {
  const [name, setName] = useState('Explorador');
  const [preparationTask, setPreparationTask] = useState(LAUNCH_PREPARATION_TASKS[0].id);

  const handleSubmit = (e) => {
    e.preventDefault();
    onStart(name.trim() || 'Explorador', preparationTask);
  };

  return (
    <div className="start-scene-screen">
      <div className="start-scene-card pixel-box">
        <div className="start-badge-row">
          <span className="start-mission-tag">EXPLORA MARTE</span>
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
            <h1 className="start-main-title">MARS RANGERS</h1>
            <div className="start-subtitle">CRÁTER JEZERO</div>
            <p className="start-lead">
              ¡Tu rover te acompaña! Explora la base, cuida tus recursos y completa misiones durante 7 soles.
            </p>
          </div>
        </div>

        <section className="launch-preparation" aria-labelledby="launch-preparation-title">
          <h2 id="launch-preparation-title">Antes de empezar, elige una tarea</h2>
          <div className="launch-preparation-grid">
            {LAUNCH_PREPARATION_TASKS.map((task) => (
              <button
                type="button"
                key={task.id}
                className={`launch-preparation-option ${preparationTask === task.id ? 'selected' : ''}`}
                onClick={() => setPreparationTask(task.id)}
                aria-pressed={preparationTask === task.id}
              >
                <strong>{task.icon} {task.title}</strong>
                <span>{task.detail}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Quick-start guide */}
        <div className="start-guide-grid">
          <div className="guide-step-card">
            <div className="guide-step-icon">⌨️</div>
            <div className="guide-step-title">1. EXPLORA</div>
            <div className="guide-step-text">
              Muévete con <strong>WASD</strong> o las <strong>Flechas</strong>. Pulsa <strong>[E]</strong> junto a un edificio.
            </div>
          </div>

          <div className="guide-step-card">
            <div className="guide-step-icon">⚡</div>
            <div className="guide-step-title">2. CUIDA AL EXPLORADOR</div>
            <div className="guide-step-text">
              Energía, agua, aire y comida te mantienen en marcha.
            </div>
          </div>

          <div className="guide-step-card">
            <div className="guide-step-icon">🏆</div>
            <div className="guide-step-title">3. COMPLETA MISIONES</div>
            <div className="guide-step-text">
              Revisa tus objetivos y gana insignias.
            </div>
          </div>
        </div>

        {/* Explorer name form */}
        <form onSubmit={handleSubmit} className="start-form-box">
          <label className="start-input-label" htmlFor="explorer-name-input">
            ¿CÓMO TE LLAMAS, EXPLORADOR?
          </label>
          <div className="start-form-row">
            <input
              id="explorer-name-input"
              type="text"
              className="pixel-input flex-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="Escribe tu nombre"
            />
            <button type="submit" className="pixel-btn pixel-btn-gold start-launch-btn">
              🚀 INICIAR AVENTURA
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
