// MARS OUTPOST: Procedural 2D Pixel Art Sprite & Scenery Engine
// Creates crisp, authentic 16-bit space aesthetics without external image lag.

export class PixelRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.stars = [];
    this.dustMotes = [];
    this.initEnvironment();
  }

  initEnvironment() {
    this.stars = [];
    for (let i = 0; i < 45; i++) {
      this.stars.push({
        x: Math.random() * 800,
        y: Math.random() * 110,
        size: Math.random() > 0.8 ? 2 : 1,
        alpha: 0.3 + Math.random() * 0.7,
        blinkSpeed: 0.02 + Math.random() * 0.04
      });
    }

    this.dustMotes = [];
    for (let i = 0; i < 30; i++) {
      this.dustMotes.push({
        x: Math.random() * 800,
        y: 80 + Math.random() * 180,
        vx: 0.5 + Math.random() * 1.5,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() > 0.7 ? 2 : 1
      });
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawSky(isNight, dustLevel) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = 140;

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (isNight) {
      grad.addColorStop(0, '#060814');
      grad.addColorStop(1, '#1A1024');
    } else {
      // Martian Day: butterscotch ochre to pinkish salmon
      if (dustLevel > 40) {
        grad.addColorStop(0, '#7C3418');
        grad.addColorStop(1, '#B8532A');
      } else {
        grad.addColorStop(0, '#9A4624');
        grad.addColorStop(0.6, '#C46D3F');
        grad.addColorStop(1, '#DC8B56');
      }
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Stars at night or light stars by day
    this.stars.forEach(s => {
      s.alpha += s.blinkSpeed;
      if (s.alpha > 1 || s.alpha < 0.2) s.blinkSpeed = -s.blinkSpeed;
      ctx.fillStyle = isNight 
        ? `rgba(255, 255, 255, ${Math.abs(s.alpha)})` 
        : `rgba(255, 220, 180, ${Math.abs(s.alpha) * 0.25})`;
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
    });

    // Phobos / Sun in Martian sky
    if (isNight) {
      // Phobos (small pixel moon)
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(660, 25, 10, 8);
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(662, 27, 4, 3);
    } else {
      // Small whitish-blue Martian sun (smaller than on Earth!)
      ctx.fillStyle = '#FFF8EB';
      ctx.fillRect(670, 30, 12, 12);
      ctx.fillStyle = 'rgba(255, 240, 200, 0.4)';
      ctx.fillRect(668, 28, 16, 16);
    }
  }

  drawCanyonMountains() {
    const ctx = this.ctx;
    const w = this.canvas.width;

    // Distant mountain rim (Jezero Crater walls)
    ctx.fillStyle = '#6E2A18';
    ctx.beginPath();
    ctx.moveTo(0, 140);
    ctx.lineTo(0, 110);
    ctx.lineTo(80, 95);
    ctx.lineTo(160, 115);
    ctx.lineTo(240, 88);
    ctx.lineTo(330, 108);
    ctx.lineTo(440, 92);
    ctx.lineTo(540, 112);
    ctx.lineTo(650, 96);
    ctx.lineTo(740, 105);
    ctx.lineTo(w, 98);
    ctx.lineTo(w, 140);
    ctx.closePath();
    ctx.fill();

    // Midground dunes
    ctx.fillStyle = '#9C4124';
    ctx.beginPath();
    ctx.moveTo(0, 140);
    ctx.lineTo(0, 125);
    ctx.lineTo(120, 118);
    ctx.lineTo(280, 130);
    ctx.lineTo(480, 118);
    ctx.lineTo(680, 126);
    ctx.lineTo(w, 120);
    ctx.lineTo(w, 140);
    ctx.closePath();
    ctx.fill();
  }

  drawGround() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Martian terrain base
    ctx.fillStyle = '#BD552E';
    ctx.fillRect(0, 140, w, h - 140);

    // Pixel rocks and layered soil textures
    ctx.fillStyle = '#873418';
    for (let x = 10; x < w; x += 36) {
      ctx.fillRect(x, 144, 14, 3);
      ctx.fillRect(x + 18, 175, 10, 3);
      ctx.fillRect(x + 6, 210, 16, 4);
    }

    // Pathway connecting domes
    ctx.fillStyle = '#A34624';
    ctx.fillRect(50, 190, w - 100, 12);
    ctx.fillStyle = '#732A15';
    ctx.fillRect(50, 202, w - 100, 2);
  }

  drawHabitat(x, y, isNight) {
    const ctx = this.ctx;

    // Foundation
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 5, y + 40, 90, 8);

    // Geodesic Dome Outer Wall
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.arc(x + 40, y + 40, 42, Math.PI, 0);
    ctx.fill();

    // Dome Frame / Ribs
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 40, y + 40, 42, Math.PI, 0);
    ctx.stroke();

    // Hexagonal Panels
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 22, y + 10, 36, 18);
    ctx.strokeRect(x + 10, y + 25, 60, 15);

    // Window / Airlock with glowing lights
    ctx.fillStyle = isNight ? '#FBBF24' : '#38BDF8';
    ctx.fillRect(x + 30, y + 26, 20, 14);

    // Airlock Door
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 34, y + 36, 12, 12);
    ctx.fillStyle = '#10B981'; // Green indicator light
    ctx.fillRect(x + 39, y + 34, 2, 2);

    // Antenna Beacon on top
    ctx.fillStyle = '#64748B';
    ctx.fillRect(x + 39, y - 8, 2, 8);
    ctx.fillStyle = (Date.now() % 1000 > 500) ? '#EF4444' : '#7F1D1D';
    ctx.fillRect(x + 38, y - 11, 4, 3);
  }

  drawAgrodome(x, y, cropStage, isNight) {
    const ctx = this.ctx;

    // Base
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 4, y + 40, 78, 8);

    // Glass Dome (semi-transparent green/cyan)
    ctx.fillStyle = isNight ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.35)';
    ctx.beginPath();
    ctx.arc(x + 35, y + 40, 36, Math.PI, 0);
    ctx.fill();

    // Structural Dome Frame
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + 35, y + 40, 36, Math.PI, 0);
    ctx.stroke();

    // Purple LED Grow Lights inside
    ctx.fillStyle = 'rgba(217, 70, 239, 0.4)';
    ctx.fillRect(x + 15, y + 15, 40, 8);

    // Hydroponic Trays
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 8, y + 34, 54, 6);

    // Crops inside
    if (cropStage === 1) {
      // Tiny sprouts
      ctx.fillStyle = '#86EFAC';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(x + 12 + i * 10, y + 30, 3, 4);
      }
    } else if (cropStage >= 2) {
      // Full leafy plants + tomatoes/potatoes
      ctx.fillStyle = '#22C55E';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(x + 10 + i * 10, y + 26, 6, 8);
        ctx.fillStyle = '#EF4444'; // Red fruit/crop
        ctx.fillRect(x + 12 + i * 10, y + 28, 2, 2);
        ctx.fillStyle = '#22C55E';
      }
    }
  }

  drawSolarArray(x, y, dustLevel, isNight) {
    const ctx = this.ctx;

    // Array Mount Poles
    ctx.fillStyle = '#64748B';
    ctx.fillRect(x + 10, y + 20, 4, 28);
    ctx.fillRect(x + 50, y + 20, 4, 28);

    // Solar Panel 1 (Angled towards the Sun)
    ctx.fillStyle = isNight ? '#0F172A' : '#1E3A8A';
    ctx.fillRect(x, y + 5, 28, 18);
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y + 5, 28, 18);
    // Photovoltaic Grid lines
    ctx.beginPath();
    ctx.moveTo(x + 9, y + 5); ctx.lineTo(x + 9, y + 23);
    ctx.moveTo(x + 19, y + 5); ctx.lineTo(x + 19, y + 23);
    ctx.moveTo(x, y + 14); ctx.lineTo(x + 28, y + 14);
    ctx.stroke();

    // Solar Panel 2
    ctx.fillStyle = isNight ? '#0F172A' : '#1E3A8A';
    ctx.fillRect(x + 36, y + 5, 28, 18);
    ctx.strokeRect(x + 36, y + 5, 28, 18);
    ctx.beginPath();
    ctx.moveTo(x + 45, y + 5); ctx.lineTo(x + 45, y + 23);
    ctx.moveTo(x + 55, y + 5); ctx.lineTo(x + 55, y + 23);
    ctx.moveTo(x + 36, y + 14); ctx.lineTo(x + 64, y + 14);
    ctx.stroke();

    // Dust Layer Coating (Visible red dust if dust > 20%)
    if (dustLevel > 20) {
      const alpha = Math.min(0.75, dustLevel / 100);
      ctx.fillStyle = `rgba(184, 83, 42, ${alpha})`;
      ctx.fillRect(x, y + 5, 28, 18);
      ctx.fillRect(x + 36, y + 5, 28, 18);
    }

    // Battery Bank underneath with LED levels
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(x + 16, y + 36, 32, 12);
    ctx.fillStyle = '#10B981'; // Green energy light
    ctx.fillRect(x + 19, y + 40, 4, 4);
    ctx.fillStyle = '#38BDF8'; // Battery charge light
    ctx.fillRect(x + 26, y + 40, 4, 4);
  }

  drawLifeSupportMoxie(x, y) {
    const ctx = this.ctx;

    // Water Recycler Cylindrical Tank
    ctx.fillStyle = '#334155';
    ctx.fillRect(x, y + 10, 26, 36);
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(x + 3, y + 14, 20, 30);
    // Animated bubbles in water
    const bubbleOff = (Date.now() / 200) % 15;
    ctx.fillStyle = '#BAE6FD';
    ctx.fillRect(x + 8, y + 38 - bubbleOff, 2, 2);
    ctx.fillRect(x + 16, y + 30 - bubbleOff, 3, 3);

    // Pipe connection
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(x + 26, y + 25, 12, 4);

    // MOXIE Gold Box Unit (Real MOXIE is a shiny gold thermal box)
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(x + 38, y + 16, 28, 30);
    ctx.fillStyle = '#FDE68A';
    ctx.fillRect(x + 40, y + 18, 24, 6);
    // MOXIE exhaust / intake valve
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(x + 46, y + 32, 12, 8);
    // Oxygen stream particles
    ctx.fillStyle = '#38BDF8';
    ctx.fillRect(x + 51, y + 10, 3, 4);
  }

  drawShieldBunker(x, y) {
    const ctx = this.ctx;

    // Regolith Shield Sandbags Mound
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.ellipse(x + 30, y + 38, 32, 16, 0, Math.PI, 0);
    ctx.fill();

    // Armored Bunker Hatch
    ctx.fillStyle = '#475569';
    ctx.fillRect(x + 18, y + 32, 24, 16);
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(x + 22, y + 36, 16, 10);
    // Radiation Symbol on door
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(x + 28, y + 39, 4, 4);
  }

  drawRover(x, y, isMoving, isFacingRight = true) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    if (!isFacingRight) {
      ctx.scale(-1, 1);
    }

    // Rocker-Bogie Suspension arms
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-12, 6); ctx.lineTo(0, 0); ctx.lineTo(12, 6);
    ctx.stroke();

    // 4 Wheels (with rotating tread if moving)
    const wheelAngle = isMoving ? (Date.now() / 60) : 0;
    const wheels = [-14, -4, 6, 16];
    wheels.forEach(wx => {
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(wx - 3, 5, 6, 8);
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(wx - 1, 7, 2, 4);
    });

    // Rover Body Chassis (like Perseverance / Curiosity)
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(-10, -8, 24, 12);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-6, -6, 16, 4);

    // Mastcam Camera Head & Neck
    ctx.fillStyle = '#475569';
    ctx.fillRect(8, -18, 3, 10);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(6, -23, 8, 6);
    ctx.fillStyle = '#38BDF8'; // Camera lens
    ctx.fillRect(11, -21, 2, 3);

    // Robot Arm with brush
    ctx.fillStyle = '#64748B';
    ctx.fillRect(-14, -3, 8, 3);
    ctx.fillStyle = '#F59E0B'; // Cleaning brush tip
    ctx.fillRect(-16, -1, 4, 5);

    ctx.restore();
  }

  drawAstronaut(x, y, color, animFrame, isFacingRight) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    if (!isFacingRight) ctx.scale(-1, 1);

    // Walking bounce offset
    const bounce = Math.sin(animFrame * 0.15) * 2;

    // Spacesuit Legs
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(-3, 6 + bounce, 3, 7);
    ctx.fillRect(2, 6 - bounce, 3, 7);
    // Boots
    ctx.fillStyle = '#475569';
    ctx.fillRect(-4, 13 + bounce, 4, 3);
    ctx.fillRect(2, 13 - bounce, 4, 3);

    // Torso / Life Support Backpack
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-6, -4, 3, 10); // Backpack
    ctx.fillStyle = '#F8FAFC'; // White Suit
    ctx.fillRect(-3, -5, 9, 12);

    // Mission Specialist Badge (Color-coded)
    ctx.fillStyle = color;
    ctx.fillRect(-1, -1, 5, 4);

    // Helmet
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(-3, -15, 9, 10);
    // Reflective Gold Visor
    ctx.fillStyle = '#FBBF24';
    ctx.fillRect(1, -13, 6, 6);
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(3, -12, 2, 2);

    ctx.restore();
  }

  drawDustWeather(dustLevel) {
    if (dustLevel < 10) return;
    const ctx = this.ctx;
    const w = this.canvas.width;

    ctx.fillStyle = `rgba(184, 83, 42, ${Math.min(0.45, dustLevel / 120)})`;
    ctx.fillRect(0, 0, w, this.canvas.height);

    // Blowing dust particles
    ctx.fillStyle = '#E27848';
    this.dustMotes.forEach(m => {
      m.x += m.vx * (dustLevel / 20);
      m.y += m.vy;
      if (m.x > w) m.x = -10;
      if (m.y < 80 || m.y > 280) m.vy = -m.vy;
      ctx.fillRect(Math.floor(m.x), Math.floor(m.y), m.size, m.size);
    });
  }
}
