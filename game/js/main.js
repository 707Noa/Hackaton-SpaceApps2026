// MARS OUTPOST: Application Coordinator & UI Controller
// Seamlessly connects the Pixel Canvas, State Engine, Audio, and NASA Data.

import { GameEngine } from './gameEngine.js';
import { CanvasManager } from './canvasRenderer.js';
import { NASA_SOURCES } from './gameData.js';
import { sounds } from './audio.js';

class MarsGameApp {
  constructor() {
    this.engine = new GameEngine();
    this.canvas = document.getElementById('game-canvas');
    this.canvasManager = new CanvasManager(this.canvas, this.engine);
    
    this.initUI();
    this.engine.subscribe((state) => this.renderHUD(state));
  }

  initUI() {
    // Action buttons
    document.getElementById('btn-plant').addEventListener('click', () => this.engine.plantCrops());
    document.getElementById('btn-clean').addEventListener('click', () => this.engine.cleanPanelsWithRover());
    document.getElementById('btn-moxie').addEventListener('click', () => this.engine.activateMoxie());
    document.getElementById('btn-recycle').addEventListener('click', () => this.engine.recycleWater());
    document.getElementById('btn-bunker').addEventListener('click', () => this.engine.shelterInBunker());
    document.getElementById('btn-comms').addEventListener('click', () => this.engine.sendEarthMessage());
    document.getElementById('btn-advance').addEventListener('click', () => this.engine.advanceSol());

    // Mute button
    const muteBtn = document.getElementById('btn-mute');
    muteBtn.addEventListener('click', () => {
      const isMuted = sounds.toggleMute();
      muteBtn.innerText = isMuted ? '🔇 MUTE' : '🔊 AUDIO';
    });

    // Start Screen
    const startModal = document.getElementById('modal-start');
    const startBtn = document.getElementById('btn-start-game');
    const cadetInput = document.getElementById('input-cadet-name');

    startBtn.addEventListener('click', () => {
      const name = cadetInput.value.trim() || 'Comandante Junior';
      this.engine.startMission(name);
      startModal.style.display = 'none';
    });

    // NASA Science Modal Close
    document.getElementById('btn-close-nasa').addEventListener('click', () => {
      sounds.playClick();
      document.getElementById('modal-nasa').style.display = 'none';
    });

    // Restart buttons
    document.getElementById('btn-restart-gameover').addEventListener('click', () => {
      document.getElementById('modal-gameover').style.display = 'none';
      this.engine.restart();
    });

    document.getElementById('btn-restart-victory').addEventListener('click', () => {
      document.getElementById('modal-victory').style.display = 'none';
      this.engine.restart();
    });

    document.getElementById('btn-print-cert').addEventListener('click', () => {
      window.print();
    });

    // Initial HUD update
    this.renderHUD(this.engine.state);
  }

  renderHUD(state) {
    // Sol Counter
    document.getElementById('sol-text').innerText = `SOL 0${state.sol} / 07`;

    // Resource Values
    const res = state.resources;
    this.updateMeter('energy', res.energy, '#FBBF24');
    this.updateMeter('water', res.water, '#38BDF8');
    this.updateMeter('oxygen', res.oxygen, '#BAE6FD');
    this.updateMeter('food', res.food, '#34D399');
    this.updateMeter('shield', res.shield, '#A78BFA');
    this.updateMeter('dust', res.dust, '#F87171');

    // Handle Active Event Modal
    const eventModal = document.getElementById('modal-event');
    if (this.engine.currentEvent) {
      this.renderEventModal(this.engine.currentEvent);
      eventModal.style.display = 'flex';
    } else {
      eventModal.style.display = 'none';
    }

    // Handle Victory Modal
    const victoryModal = document.getElementById('modal-victory');
    if (state.victory) {
      this.renderVictoryModal();
      victoryModal.style.display = 'flex';
    } else {
      victoryModal.style.display = 'none';
    }

    // Handle Game Over Modal
    const gameOverModal = document.getElementById('modal-gameover');
    if (state.gameOver) {
      gameOverModal.style.display = 'flex';
    } else {
      gameOverModal.style.display = 'none';
    }
  }

  updateMeter(id, val, color) {
    const valEl = document.getElementById(`val-${id}`);
    const fillEl = document.getElementById(`fill-${id}`);
    if (valEl) valEl.innerText = `${val}%`;
    if (fillEl) {
      fillEl.style.width = `${val}%`;
      fillEl.style.backgroundColor = color;
    }
  }

  renderEventModal(event) {
    document.getElementById('event-title').innerText = event.title;
    document.getElementById('event-subtitle').innerText = event.subtitle;
    document.getElementById('event-desc').innerText = event.description;

    const choicesContainer = document.getElementById('event-choices');
    choicesContainer.innerHTML = '';

    event.choices.forEach((choice, idx) => {
      const card = document.createElement('div');
      card.className = 'choice-card';
      card.innerHTML = `
        <div class="choice-title">${choice.text}</div>
        <div class="choice-desc">${choice.detail}</div>
      `;
      card.addEventListener('click', () => {
        this.engine.applyEventChoice(choice);
      });
      choicesContainer.appendChild(card);
    });

    // NASA Science Fact Button
    const nasaBtn = document.getElementById('btn-open-nasa');
    nasaBtn.onclick = () => {
      sounds.playClick();
      this.openNasaModal(event.nasaSourceKey);
    };
  }

  openNasaModal(sourceKey) {
    const data = NASA_SOURCES[sourceKey] || NASA_SOURCES['meda'];
    document.getElementById('nasa-modal-title').innerText = data.title;
    document.getElementById('nasa-badge').innerText = data.badge;
    document.getElementById('nasa-text').innerText = data.text;
    document.getElementById('modal-nasa').style.display = 'flex';
  }

  renderVictoryModal() {
    const report = this.engine.getMissionReport();
    document.getElementById('cert-cadet-name').innerText = report.cadetName.toUpperCase();
    document.getElementById('cert-rank').innerText = report.rank;
    document.getElementById('cert-score').innerText = `Puntuación de Supervivencia: ${report.avgScore}%`;

    const badgesContainer = document.getElementById('cert-badges');
    badgesContainer.innerHTML = '';
    report.badges.forEach(b => {
      const el = document.createElement('div');
      el.className = 'badge-item';
      el.innerText = `⭐ ${b.name}`;
      badgesContainer.appendChild(el);
    });
  }
}

// Start application when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  new MarsGameApp();
});
