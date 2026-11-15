// Procedural 16-bit Pixel Art Texture Factory for Babylon.js
// Generates crisp NEAREST_SAMPLINGMODE textures so 3D meshes look like authentic pixel art.

export function createMarsGroundTexture(BAB, scene) {
  const size = 256;
  const tex = new BAB.DynamicTexture('marsGroundTex', size, scene, false, BAB.Texture.NEAREST_SAMPLINGMODE);
  tex.anisotropicFilteringLevel = 1;
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;

  // Base Martian terracotta ground
  ctx.fillStyle = '#B83F20';
  ctx.fillRect(0, 0, size, size);

  // Pixel soil speckles & variation (deterministic pseudo-random)
  const soilColors = ['#A23216', '#C94B29', '#8E2610', '#D15430'];
  for (let i = 0; i < 900; i++) {
    const x = (i * 73 + 17) % size;
    const y = (i * 139 + 31) % size;
    const w = (i % 3) + 1;
    ctx.fillStyle = soilColors[i % soilColors.length];
    ctx.fillRect(x, y, w, w);
  }

  // Winding sandy footpaths matching outpost layout (world X/Z mapped to 0..256)
  // Helper to paint chunky pixel path segments
  const paintPath = (x1, y1, x2, y2, thickness) => {
    const steps = 40;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const cx = Math.round(x1 + (x2 - x1) * t);
      const cy = Math.round(y1 + (y2 - y1) * t);
      // Dark pixel outline border
      ctx.fillStyle = '#8F3619';
      ctx.fillRect(cx - thickness / 2 - 2, cy - thickness / 2 - 2, thickness + 4, thickness + 4);
    }
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const cx = Math.round(x1 + (x2 - x1) * t);
      const cy = Math.round(y1 + (y2 - y1) * t);
      // Warm sandy path fill
      ctx.fillStyle = '#E07D48';
      ctx.fillRect(cx - thickness / 2, cy - thickness / 2, thickness, thickness);
      // Highlight inner pixels
      if (s % 2 === 0) {
        ctx.fillStyle = '#EB9260';
        ctx.fillRect(cx - 2, cy - 2, 4, 4);
      }
    }
  };

  // Central N-S spine
  paintPath(122, 70, 122, 215, 22);
  // Branch to North Agrodome (left-top)
  paintPath(75, 80, 122, 80, 18);
  // Branch to South Agrodome (left-bottom)
  paintPath(75, 200, 122, 200, 18);
  // Branch to Habitat & Lab (right)
  paintPath(122, 110, 195, 110, 18);
  paintPath(122, 175, 195, 175, 18);
  // Central plaza junction
  ctx.fillStyle = '#E07D48';
  ctx.fillRect(108, 115, 32, 32);

  tex.update();
  return tex;
}

export function createSolarPanelTexture(BAB, scene) {
  const size = 32;
  const tex = new BAB.DynamicTexture('solarPanelTex', size, scene, false, BAB.Texture.NEAREST_SAMPLINGMODE);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;

  // Dark metallic frame
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(0, 0, size, size);

  // Silver inner border
  ctx.fillStyle = '#94A3B8';
  ctx.fillRect(2, 2, size - 4, size - 4);

  // Deep cobalt photovoltaic cells (2x4 grid)
  for (let gx = 0; gx < 2; gx++) {
    for (let gy = 0; gy < 4; gy++) {
      const px = 4 + gx * 13;
      const py = 4 + gy * 6;
      ctx.fillStyle = '#1D4E89';
      ctx.fillRect(px, py, 11, 5);
      // Bright pixel highlight on top-left of cell
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(px, py, 11, 1);
      ctx.fillRect(px, py, 2, 2);
    }
  }

  tex.update();
  return tex;
}

export function createHabitatWallTexture(BAB, scene, isLab = false) {
  const w = 64;
  const h = 32;
  const tex = new BAB.DynamicTexture(isLab ? 'labWallTex' : 'habWallTex', { width: w, height: h }, scene, false, BAB.Texture.NEAREST_SAMPLINGMODE);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;

  // Metallic module cladding
  ctx.fillStyle = '#9CA3AF';
  ctx.fillRect(0, 0, w, h);

  // Top highlight strip & bottom shadow strip
  ctx.fillStyle = '#D1D5DB';
  ctx.fillRect(0, 0, w, 4);
  ctx.fillStyle = '#4B5563';
  ctx.fillRect(0, h - 5, w, 5);

  // Pixel panel seams
  ctx.fillStyle = '#374151';
  ctx.fillRect(0, 0, 2, h);
  ctx.fillRect(w - 2, 0, 2, h);
  ctx.fillRect(20, 4, 2, h - 9);
  ctx.fillRect(42, 4, 2, h - 9);

  // Airlock door on left section
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(5, 8, 12, h - 10);
  ctx.fillStyle = '#64748B';
  ctx.fillRect(7, 10, 8, h - 12);
  ctx.fillStyle = '#10B981'; // Green airlock keypad
  ctx.fillRect(16, 15, 2, 3);

  // Glowing pixel windows
  const winColor = isLab ? '#38BDF8' : '#FDE047';
  const winGlow = isLab ? '#BAE6FD' : '#FEF9C3';

  // Window 1
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(25, 10, 13, 11);
  ctx.fillStyle = winColor;
  ctx.fillRect(27, 12, 9, 7);
  ctx.fillStyle = winGlow;
  ctx.fillRect(27, 12, 4, 3);

  // Window 2
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(47, 10, 12, 11);
  ctx.fillStyle = winColor;
  ctx.fillRect(49, 12, 8, 7);
  ctx.fillStyle = winGlow;
  ctx.fillRect(49, 12, 3, 3);

  tex.update();
  return tex;
}

export function createEarthTexture(BAB, scene) {
  const size = 32;
  const tex = new BAB.DynamicTexture('earthPixelTex', size, scene, false, BAB.Texture.NEAREST_SAMPLINGMODE);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;

  // Transparent background
  ctx.clearRect(0, 0, size, size);

  // Pixel circle for Earth
  const cx = 16;
  const cy = 16;
  const r = 13;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist <= r) {
        if (dist > r - 1.2) {
          ctx.fillStyle = '#0F172A'; // crisp pixel outline
        } else {
          ctx.fillStyle = '#1D4ED8'; // deep ocean blue
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  // Green pixel continents
  ctx.fillStyle = '#22C55E';
  ctx.fillRect(10, 9, 6, 5);
  ctx.fillRect(12, 14, 4, 6);
  ctx.fillRect(19, 11, 5, 7);
  ctx.fillRect(18, 18, 4, 4);

  // White cloud swirls
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(8, 12, 5, 2);
  ctx.fillRect(15, 7, 6, 2);
  ctx.fillRect(14, 21, 7, 2);

  tex.update();
  return tex;
}

export function createRockTexture(BAB, scene) {
  const size = 16;
  const tex = new BAB.DynamicTexture('marsRockTex', size, scene, false, BAB.Texture.NEAREST_SAMPLINGMODE);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = '#7C2514';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#A43418';
  ctx.fillRect(1, 1, 10, 8);
  ctx.fillStyle = '#C94B29';
  ctx.fillRect(2, 2, 5, 4);
  ctx.fillStyle = '#4A1208';
  ctx.fillRect(0, 12, size, 4);

  tex.update();
  return tex;
}
