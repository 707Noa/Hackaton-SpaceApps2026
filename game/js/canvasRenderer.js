// MARS OUTPOST: Canvas Animation & Interactive Viewport Manager
// Keeps 60 FPS smooth pixelated animations with interactive click detection.

import { PixelRenderer } from './pixelArt.js';
import { sounds } from './audio.js';

export class CanvasManager {
  constructor(canvas, gameEngine) {
    this.canvas = canvas;
    this.engine = gameEngine;
    this.renderer = new PixelRenderer(canvas);
    this.animFrame = 0;
    this.roverX = 140;
    this.roverTargetX = 140;

    this.bindEvents();
    this.startLoop();
  }

  bindEvents() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      this.handleClick(x, y);
    });
  }

  handleClick(x, y) {
    sounds.playClick();

    // Check click on Astronauts
    this.engine.state.crew.forEach(ast => {
      const dx = Math.abs(x - ast.x);
      const dy = Math.abs(y - ast.y);
      if (dx < 18 && dy < 20) {
        this.engine.showBubble(`${ast.name} (${ast.role}): "${ast.phrase}"`);
      }
    });

    // Check click on Agrodome (around x: 450, y: 140)
    if (x >= 440 && x <= 530 && y >= 120 && y <= 190) {
      if (!this.engine.state.crops.planted) {
        this.engine.plantCrops();
      } else {
        this.engine.showBubble("Invernadero Agrodome: Cultivo en proceso. Cosecha pronto.");
      }
    }

    // Check click on Solar Panels (around x: 620, y: 140)
    if (x >= 610 && x <= 710 && y >= 120 && y <= 190) {
      this.engine.cleanPanelsWithRover();
    }

    // Check click on MOXIE / ECLSS (around x: 300, y: 140)
    if (x >= 290 && x <= 370 && y >= 130 && y <= 190) {
      this.engine.activateMoxie();
    }
  }

  startLoop() {
    const loop = () => {
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update() {
    this.animFrame += 1;
    const state = this.engine.state;

    // Update Astronauts wandering
    state.crew.forEach(ast => {
      ast.x += ast.vx;
      if (ast.x > 720 || ast.x < 80) {
        ast.vx = -ast.vx;
      }
    });

    // Update Rover movement
    if (this.engine.roverAnim.isMoving) {
      const target = this.engine.roverAnim.targetX;
      if (Math.abs(this.roverX - target) > 3) {
        this.roverX += (target > this.roverX ? 2.5 : -2.5);
      } else {
        // Arrived at target
        if (this.engine.roverAnim.task === 'cleaning') {
          this.engine.roverAnim.task = 'returning';
          this.engine.roverAnim.targetX = 140; // Return home
        } else {
          this.engine.roverAnim.isMoving = false;
          this.engine.roverAnim.task = null;
        }
      }
    }
  }

  render() {
    const state = this.engine.state;
    const r = this.renderer;

    r.clear();

    // 1. Sky & Mountains
    r.drawSky(state.isNight, state.resources.dust);
    r.drawCanyonMountains();
    r.drawGround();

    // 2. Base Modules
    // Comms Tower on left cliff
    r.ctx.fillStyle = '#64748B';
    r.ctx.fillRect(40, 115, 6, 45);
    r.ctx.fillStyle = (Date.now() % 800 > 400) ? '#38BDF8' : '#0284C7';
    r.ctx.fillRect(36, 110, 14, 8); // Dish

    // Habitat Central (x: 180, y: 125)
    r.drawHabitat(180, 125, state.isNight);

    // Life Support & MOXIE (x: 290, y: 135)
    r.drawLifeSupportMoxie(290, 135);

    // Shield Bunker (x: 375, y: 135)
    r.drawShieldBunker(375, 135);

    // Agrodome Greenhouse (x: 460, y: 125)
    r.drawAgrodome(460, 125, state.crops.stage, state.isNight);

    // Solar Array (x: 620, y: 130)
    r.drawSolarArray(620, 130, state.resources.dust, state.isNight);

    // 3. Rover
    const isMovingRover = this.engine.roverAnim.isMoving;
    const roverFacingRight = this.engine.roverAnim.targetX >= this.roverX;
    r.drawRover(this.roverX, 192, isMovingRover, roverFacingRight);

    // 4. Astronauts Walking
    state.crew.forEach(ast => {
      r.drawAstronaut(ast.x, ast.y, ast.color, this.animFrame, ast.vx > 0);
    });

    // 5. Dust Weather Particles
    r.drawDustWeather(state.resources.dust);

    // 6. Speech Bubble Render (if active)
    if (this.engine.speechBubble && Date.now() < this.engine.speechBubble.timer) {
      this.drawBubble(this.engine.speechBubble.text);
    }
  }

  drawBubble(text) {
    const ctx = this.renderer.ctx;
    ctx.save();
    ctx.font = '10px "Press Start 2P", monospace';
    
    // Measure text
    const textW = Math.min(680, ctx.measureText(text).width + 30);
    const boxH = 34;
    const boxX = (this.canvas.width - textW) / 2;
    const boxY = 16;

    // Pixelated bubble background
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(boxX, boxY, textW, boxH);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, textW, boxH);

    // Text content
    ctx.fillStyle = '#F8FAFC';
    ctx.fillText(text, boxX + 15, boxY + 22, textW - 30);
    ctx.restore();
  }
}
