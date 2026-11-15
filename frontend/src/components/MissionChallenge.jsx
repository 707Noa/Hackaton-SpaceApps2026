import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MISSIONS_LIST, GARDEN_SIZE } from '../data/gameData';
import { sounds } from '../services/audioService';
import MissionIcon from './MissionIcon';

/* ---------- 1. Paneles con polvo: frotar con la almohadilla ---------- */
const DUST_W = 240;
const DUST_H = 180;
const DUST_CELL = 20;
const DUST_BRUSH = 22;
const DUST_COLS = DUST_W / DUST_CELL;
const DUST_ROWS = DUST_H / DUST_CELL;

function DustPanel({ onCleaned }) {
  const canvasRef = useRef(null);
  const cellsRef = useRef(new Set());
  const lastRef = useRef(null);
  const [clean, setClean] = useState(false);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = 'rgba(205, 160, 125, 0.88)';
    ctx.fillRect(0, 0, DUST_W, DUST_H);
    ctx.strokeStyle = 'rgba(238, 186, 142, 0.96)';
    ctx.lineWidth = 30;
    for (let s = 0; s < 2; s++) {
      const y0 = 40 + s * 70 + Math.random() * 16;
      ctx.beginPath();
      ctx.moveTo(10, y0);
      for (let x = 50; x <= DUST_W + 40; x += 40) {
        ctx.lineTo(x, y0 + (((x / 40) | 0) % 2 === 0 ? -22 : 22) + Math.random() * 10);
      }
      ctx.stroke();
    }
  }, []);

  const toCanvas = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * DUST_W) / rect.width,
      y: ((e.clientY - rect.top) * DUST_H) / rect.height
    };
  };

  const erase = (point) => {
    if (clean) return;
    const ctx = canvasRef.current.getContext('2d');
    const last = lastRef.current || point;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineWidth = DUST_BRUSH * 2;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';

    const steps = Math.max(1, Math.ceil(Math.hypot(point.x - last.x, point.y - last.y) / 6));
    for (let i = 0; i <= steps; i++) {
      const px = last.x + ((point.x - last.x) * i) / steps;
      const py = last.y + ((point.y - last.y) * i) / steps;
      for (let cx = 0; cx < DUST_COLS; cx++) {
        for (let cy = 0; cy < DUST_ROWS; cy++) {
          const centerX = cx * DUST_CELL + DUST_CELL / 2;
          const centerY = cy * DUST_CELL + DUST_CELL / 2;
          if (Math.hypot(centerX - px, centerY - py) <= DUST_BRUSH - 2) {
            cellsRef.current.add(cx * DUST_ROWS + cy);
          }
        }
      }
    }
    lastRef.current = point;

    if (cellsRef.current.size / (DUST_COLS * DUST_ROWS) >= 0.85) {
      ctx.clearRect(0, 0, DUST_W, DUST_H);
      setClean(true);
      sounds.playPower();
      onCleaned();
    }
  };

  return (
    <div className={`dust-panel ${clean ? 'dust-panel-clean' : ''}`}>
      <div className="dust-solar" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => <span key={i} />)}
      </div>
      <canvas
        ref={canvasRef}
        width={DUST_W}
        height={DUST_H}
        className="dust-canvas"
        aria-label={clean ? 'Panel limpio' : 'Panel con polvo, frótalo'}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          const point = toCanvas(e);
          lastRef.current = null;
          erase(point);
        }}
        onPointerMove={(e) => {
          if (e.buttons & 1) erase(toCanvas(e));
        }}
        onPointerUp={() => { lastRef.current = null; }}
        onPointerCancel={() => { lastRef.current = null; }}
      />
      <span className="dust-label">{clean ? 'Limpio ✓' : 'Polvo'}</span>
    </div>
  );
}

function DustCleaningGame({ onProgress }) {
  const TOTAL = 3;
  const [cleaned, setCleaned] = useState(0);
  const padRef = useRef(null);

  useEffect(() => { onProgress(cleaned, TOTAL); }, [cleaned, onProgress]);

  const movePad = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    padRef.current.style.display = 'block';
    padRef.current.style.transform = `translate(${e.clientX - rect.left - 24}px, ${e.clientY - rect.top - 24}px)`;
  };

  return (
    <div
      className="dust-field"
      onPointerMove={movePad}
      onPointerDown={() => padRef.current?.classList.add('pressed')}
      onPointerUp={() => padRef.current?.classList.remove('pressed')}
      onPointerLeave={() => { if (padRef.current) padRef.current.style.display = 'none'; }}
    >
      {Array.from({ length: TOTAL }).map((_, i) => (
        <DustPanel key={i} onCleaned={() => setCleaned((c) => c + 1)} />
      ))}
      <div ref={padRef} className="sponge-pad" aria-hidden="true">🧽</div>
    </div>
  );
}

/* ---------- 2. Invernadero: recoge agua y siembra distintas plantas ---------- */
const PLANTS = [
  { id: 'lettuce', icon: '🥬', name: 'Lechuga' },
  { id: 'kale', icon: '🥦', name: 'Col rizada' },
  { id: 'zinnia', icon: '🌼', name: 'Zinnia' },
  { id: 'tomato', icon: '🍅', name: 'Tomate' },
  { id: 'pepper', icon: '🌶️', name: 'Chile' },
  { id: 'potato', icon: '🥔', name: 'Papa' }
];
const PLANT_BY_ID = Object.fromEntries(PLANTS.map((p) => [p.id, p]));
const SEEDS_REQUIRED = 3;

function PlantGame({ onProgress, garden = [], onGardenChange }) {
  const slots = Array.from({ length: GARDEN_SIZE }, (_, i) => garden[i] || null);
  const planted = slots.filter(Boolean).length;
  const [selected, setSelected] = useState('lettuce');
  const [cooling, setCooling] = useState({});
  const [freshSlot, setFreshSlot] = useState(-1);

  useEffect(() => {
    onProgress(Math.min(planted, SEEDS_REQUIRED), SEEDS_REQUIRED);
  }, [planted, onProgress]);

  const plantAt = (index) => {
    const plant = PLANT_BY_ID[selected];
    if (!plant || slots[index] || cooling[plant.id]) return;
    const next = [...slots];
    next[index] = plant.id;
    onGardenChange?.(next);
    setFreshSlot(index);
    sounds.playWater();
    setCooling((c) => ({ ...c, [plant.id]: true }));
    setTimeout(() => setCooling((c) => ({ ...c, [plant.id]: false })), 1200);
  };

  return (
    <div className="garden-game">
      <div className="garden-packets">
        {PLANTS.map((p) => (
          <button
            key={p.id}
            type="button"
            className={[
              'seed-packet',
              selected === p.id ? 'seed-packet-active' : '',
              cooling[p.id] ? 'seed-packet-cooling' : ''
            ].join(' ')}
            onClick={() => { sounds.playClick(); setSelected(p.id); }}
            title={p.name}
            aria-pressed={selected === p.id}
            aria-label={`Semilla de ${p.name}`}
          >
            <span className="seed-packet-icon">{p.icon}</span>
            <small>{p.name}</small>
          </button>
        ))}
      </div>

      <div
        className="garden-count"
        role="img"
        aria-label={`${planted} plantas sembradas y ${GARDEN_SIZE - planted} huecos libres`}
      >
        {slots.map((id, i) => (
          <span key={i} className={id ? 'garden-chip garden-chip-full' : 'garden-chip'}>
            {id ? PLANT_BY_ID[id].icon : '🌰'}
          </span>
        ))}
      </div>

      <div className="garden-bed" tabIndex={0} aria-label="Invernadero: desplázate para ver todos los huecos">
        {slots.map((id, i) => (
          <button
            key={i}
            type="button"
            className={`garden-slot ${id ? 'garden-slot-full' : ''}`}
            onClick={() => plantAt(i)}
            disabled={Boolean(id)}
            aria-label={id ? `Hueco ${i + 1}: ${PLANT_BY_ID[id].name}` : `Hueco ${i + 1} libre, toca para sembrar`}
          >
            {id ? (
              <span
                className={`garden-plant ${freshSlot === i ? 'garden-plant-new' : ''}`}
                style={{ animationDelay: `${(i % 5) * 0.35}s` }}
              >
                {PLANT_BY_ID[id].icon}
              </span>
            ) : (
              <span className="garden-slot-ghost">{PLANT_BY_ID[selected]?.icon}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
/* ---------- 3. MOXIE: caza de medusas de CO₂ con una red ---------- */
const MOXIE_W = 640;
const MOXIE_H = 300;
const NET_RADIUS = 46;
const NET_SWING_MS = 380;

function drawCloud(ctx, c, time) {
  const bob = Math.sin(time * 2 + c.phase) * 5;
  const scale = c.state === 'flying' ? 1 - Math.min(1, c.t) * 0.6 : 1;
  ctx.save();
  ctx.translate(c.x, c.y + bob);
  ctx.scale(scale, scale);
  ctx.globalAlpha = c.state === 'flying' ? 1 - Math.min(1, c.t) * 0.3 : 1;
  ctx.strokeStyle = 'rgba(245, 232, 226, 0.8)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const x0 = -c.r * 0.6 + i * c.r * 0.4;
    ctx.beginPath();
    ctx.moveTo(x0, 6);
    for (let k = 1; k <= 5; k++) {
      ctx.lineTo(x0 + Math.sin(time * 3 + c.phase + k + i) * 5, 6 + k * 7);
    }
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(245, 232, 226, 0.95)';
  ctx.beginPath();
  ctx.arc(0, 0, c.r, Math.PI, 0);
  ctx.lineTo(c.r, 6);
  ctx.quadraticCurveTo(0, 14, -c.r, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#4b5563';
  ctx.beginPath();
  ctx.arc(-c.r * 0.35, -c.r * 0.45, 3, 0, Math.PI * 2);
  ctx.arc(c.r * 0.35, -c.r * 0.45, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CO₂', 0, 0);
  ctx.restore();
}

function drawNet(ctx, net, now) {
  const age = now - net.swingAt;
  const swinging = age < NET_SWING_MS;
  const wave = swinging ? Math.sin((age / NET_SWING_MS) * Math.PI) : 0;
  const radius = NET_RADIUS * (1 + wave * 0.3);
  ctx.save();
  ctx.translate(net.x, net.y);
  ctx.rotate(-wave * 0.5);
  ctx.strokeStyle = '#d6b27a';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(NET_RADIUS * 0.7, NET_RADIUS * 0.7);
  ctx.lineTo(NET_RADIUS * 1.6, NET_RADIUS * 1.6);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  for (let i = -2; i <= 2; i++) {
    const offset = i * radius * 0.4;
    const half = Math.sqrt(Math.max(0, radius * radius - offset * offset));
    ctx.beginPath();
    ctx.moveTo(offset, -half);
    ctx.lineTo(offset, half);
    ctx.moveTo(-half, offset);
    ctx.lineTo(half, offset);
    ctx.stroke();
  }
  ctx.lineWidth = 5;
  ctx.strokeStyle = swinging && net.hit ? '#FDE047' : '#f5f5f5';
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawMoxieMachine(ctx, machine, time) {
  const cx = MOXIE_W / 2;
  const { flash, cog } = machine;
  ctx.save();

  ctx.fillStyle = '#56627d';
  ctx.fillRect(cx - 98, 24, 24, 9);
  ctx.fillRect(cx + 74, 24, 24, 9);
  ctx.fillStyle = '#3d485f';
  ctx.fillRect(cx - 98, 24, 24, 3);
  ctx.fillRect(cx + 74, 24, 24, 3);

  ctx.fillStyle = '#2b3a58';
  ctx.strokeStyle = '#8fb0ea';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 36, 56);
  ctx.lineTo(cx + 36, 56);
  ctx.lineTo(cx + 20, 74);
  ctx.lineTo(cx - 20, 74);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const body = ctx.createLinearGradient(0, 4, 0, 58);
  body.addColorStop(0, '#4a5d84');
  body.addColorStop(1, '#1d2b45');
  ctx.fillStyle = body;
  ctx.strokeStyle = '#8fb0ea';
  ctx.lineWidth = 3;
  roundRectPath(ctx, cx - 75, 4, 150, 54, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0f1a2e';
  roundRectPath(ctx, cx - 66, 10, 68, 17, 4);
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MOXIE', cx - 32, 23);

  for (let i = 0; i < 3; i++) {
    const idle = i === Math.floor(time * 2) % 3;
    ctx.fillStyle = flash > 0.1 ? '#34D399' : idle ? '#86efac' : '#2f4a3f';
    ctx.beginPath();
    ctx.arc(cx + 14 + i * 14, 18, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#9fb4dd';
  [[-68, 10], [68, 10], [-68, 50], [68, 50]].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(cx + dx, dy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.shadowColor = flash > 0.1 ? '#67e8f9' : '#f59e0b';
  ctx.shadowBlur = 8 + flash * 16;
  ctx.fillStyle = flash > 0.1 ? '#a5f3fc' : '#f59e0b';
  ctx.beginPath();
  ctx.arc(cx, 42, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#0f1a2e';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.save();
  ctx.translate(cx, 42);
  ctx.rotate(cog);
  ctx.strokeStyle = 'rgba(15, 26, 46, 0.85)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 3; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(9, 0);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

function drawOxygenBubbles(ctx, bubbles) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 9px system-ui, sans-serif';
  bubbles.forEach((b) => {
    ctx.globalAlpha = Math.max(0, b.life);
    ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e0f2fe';
    ctx.fillText('O₂', b.x, b.y + 3);
  });
  ctx.restore();
}

function MoxieGame({ onProgress }) {
  const TOTAL = 6;
  const canvasRef = useRef(null);
  const [caught, setCaught] = useState(0);

  useEffect(() => { onProgress(caught, TOTAL); }, [caught, onProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const clouds = [];
    const net = { x: MOXIE_W / 2, y: MOXIE_H / 2, active: false, swingAt: -1000, swingUntil: 0, hit: false };
    let caughtCount = 0;
    let spawnTimer = 0;
    let last = performance.now();
    let frameId = 0;
    const machine = { flash: 0, cog: 0, bubbles: [] };

    const spawn = () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 35;
      clouds.push({
        x: 40 + Math.random() * (MOXIE_W - 80),
        y: 90 + Math.random() * (MOXIE_H - 150),
        bvx: Math.cos(angle) * speed,
        bvy: Math.sin(angle) * speed,
        fvx: 0,
        fvy: 0,
        phase: Math.random() * 6,
        r: 26 + Math.random() * 6,
        state: 'free',
        t: 0,
        sx: 0,
        sy: 0
      });
    };
    for (let i = 0; i < 3; i++) spawn();

    const toCanvas = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) * MOXIE_W) / rect.width,
        y: ((e.clientY - rect.top) * MOXIE_H) / rect.height
      };
    };

    const onMove = (e) => {
      const p = toCanvas(e);
      net.x = p.x;
      net.y = p.y;
      net.active = true;
    };

    const swing = () => {
      const now = performance.now();
      if (now < net.swingUntil) return;
      net.swingAt = now;
      net.swingUntil = now + NET_SWING_MS;
      net.hit = false;
      clouds.forEach((c) => {
        if (c.state === 'free' && Math.hypot(c.x - net.x, c.y - net.y) < NET_RADIUS + c.r * 0.4) {
          c.state = 'flying';
          c.sx = c.x;
          c.sy = c.y;
          c.t = 0;
          net.hit = true;
        }
      });
      sounds.playClick();
    };

    const onDown = (e) => {
      onMove(e);
      swing();
    };
    const onLeave = () => { net.active = false; };

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerleave', onLeave);

    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const time = now / 1000;

      clouds.forEach((c) => {
        if (c.state === 'free') {
          if (net.active) {
            const dx = c.x - net.x;
            const dy = c.y - net.y;
            const d = Math.hypot(dx, dy);
            if (d < 120 && d > 0.1) {
              const push = (1 - d / 120) * 260;
              c.fvx += (dx / d) * push * dt;
              c.fvy += (dy / d) * push * dt;
            }
          }
          const decay = 1 - Math.min(1, 2.2 * dt);
          c.fvx *= decay;
          c.fvy *= decay;
          c.bvx += (Math.random() - 0.5) * 30 * dt;
          c.bvy += (Math.random() - 0.5) * 30 * dt;
          const speed = Math.hypot(c.bvx, c.bvy);
          if (speed > 60) {
            c.bvx = (c.bvx / speed) * 60;
            c.bvy = (c.bvy / speed) * 60;
          }
          c.x += (c.bvx + c.fvx) * dt;
          c.y += (c.bvy + c.fvy) * dt;
          if (c.x < c.r) { c.x = c.r; c.bvx = Math.abs(c.bvx); c.fvx = Math.abs(c.fvx); }
          if (c.x > MOXIE_W - c.r) { c.x = MOXIE_W - c.r; c.bvx = -Math.abs(c.bvx); c.fvx = -Math.abs(c.fvx); }
          if (c.y < 80) { c.y = 80; c.bvy = Math.abs(c.bvy); c.fvy = Math.abs(c.fvy); }
          if (c.y > MOXIE_H - 50) { c.y = MOXIE_H - 50; c.bvy = -Math.abs(c.bvy); c.fvy = -Math.abs(c.fvy); }
        } else if (c.state === 'flying') {
          c.t += dt / 0.6;
          const k = Math.min(1, c.t);
          c.x = c.sx + (MOXIE_W / 2 - c.sx) * k;
          c.y = c.sy + (68 - c.sy) * k;
          if (k >= 1) {
            c.state = 'done';
            caughtCount += 1;
            setCaught(caughtCount);
            sounds.playBlip();
            machine.flash = 1;
            for (let i = 0; i < 3; i++) {
              machine.bubbles.push({
                x: MOXIE_W / 2 + 100 + i * 6,
                y: 30 - i * 4,
                vx: 22 + Math.random() * 18,
                vy: -(18 + Math.random() * 14),
                life: 1 + i * 0.15
              });
            }
          }
        }
      });
      for (let i = clouds.length - 1; i >= 0; i--) {
        if (clouds[i].state === 'done') clouds.splice(i, 1);
      }

      spawnTimer += dt;
      if (spawnTimer > 1.2) {
        spawnTimer = 0;
        const free = clouds.filter((c) => c.state === 'free').length;
        const flying = clouds.length - free;
        if (free < 3 && caughtCount + flying < TOTAL) spawn();
      }

      const sky = ctx.createLinearGradient(0, 0, 0, MOXIE_H);
      sky.addColorStop(0, '#7e3720');
      sky.addColorStop(1, '#b85c38');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, MOXIE_W, MOXIE_H);
      ctx.fillStyle = 'rgba(255, 220, 180, 0.35)';
      for (let i = 0; i < 18; i++) {
        const x = (i * 97 + time * 8 * (1 + (i % 3))) % MOXIE_W;
        ctx.fillRect(x, (i * 53) % MOXIE_H, 2, 2);
      }
      machine.flash = Math.max(0, machine.flash - dt * 1.6);
      machine.cog += dt * (1.2 + machine.flash * 9);
      machine.bubbles.forEach((b) => {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt * 0.55;
      });
      machine.bubbles = machine.bubbles.filter((b) => b.life > 0);
      drawMoxieMachine(ctx, machine, time);
      drawOxygenBubbles(ctx, machine.bubbles);
      clouds.forEach((c) => drawCloud(ctx, c, time));
      if (net.active || now - net.swingAt < NET_SWING_MS) drawNet(ctx, net, now);

      frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frameId);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div className="moxie-field">
      <canvas
        ref={canvasRef}
        width={MOXIE_W}
        height={MOXIE_H}
        className="moxie-canvas"
        aria-label="Zona de captura: mueve la red y haz clic para atrapar las nubes de CO2"
      />
    </div>
  );
}
/* ---------- 4. Agua: atrapa las gotas que caen con un cubo ---------- */
const WATER_W = 640;
const WATER_H = 300;
const BUCKET_W = 84;
const BUCKET_H = 54;
const BUCKET_TOP = WATER_H - 76;
const NOZZLES = [70, 170, 270, 370, 470, 570];

function drawWaterScene(ctx, time) {
  const sky = ctx.createLinearGradient(0, 0, 0, WATER_H);
  sky.addColorStop(0, '#14304d');
  sky.addColorStop(1, '#1f4f78');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WATER_W, WATER_H);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 6; i++) ctx.fillRect(i * 110 + 20, 30, 60, WATER_H - 60);

  ctx.fillStyle = '#6b7a99';
  ctx.fillRect(0, 0, WATER_W, 16);
  ctx.fillStyle = '#45516b';
  ctx.fillRect(0, 12, WATER_W, 4);
  NOZZLES.forEach((x, i) => {
    ctx.fillStyle = '#8693b3';
    ctx.beginPath();
    ctx.moveTo(x - 9, 16);
    ctx.lineTo(x + 9, 16);
    ctx.lineTo(x + 4, 26);
    ctx.lineTo(x - 4, 26);
    ctx.closePath();
    ctx.fill();
    const swell = 2 + ((time * 0.8 + i * 0.37) % 1) * 4;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.beginPath();
    ctx.arc(x, 28 + swell * 0.3, swell, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#0d2236';
  ctx.fillRect(0, WATER_H - 14, WATER_W, 14);
  ctx.fillStyle = '#2d5b85';
  ctx.fillRect(0, WATER_H - 14, WATER_W, 3);
}

function drawDrop(ctx, x, y) {
  ctx.fillStyle = '#38bdf8';
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y - 12);
  ctx.quadraticCurveTo(x + 10, y + 2, x, y + 8);
  ctx.quadraticCurveTo(x - 10, y + 2, x, y - 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.ellipse(x - 3, y, 1.8, 3, 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawBucket(ctx, x, level, glow, time) {
  const left = x - BUCKET_W / 2;
  const topW = BUCKET_W;
  const botW = BUCKET_W - 20;
  ctx.save();
  if (glow) {
    ctx.shadowColor = '#7DD3FC';
    ctx.shadowBlur = 18;
  }

  ctx.strokeStyle = '#9aa5b8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, BUCKET_TOP + 4, BUCKET_W / 2 - 4, Math.PI, 0);
  ctx.stroke();

  const path = () => {
    ctx.beginPath();
    ctx.moveTo(left, BUCKET_TOP);
    ctx.lineTo(left + topW, BUCKET_TOP);
    ctx.lineTo(x + botW / 2, BUCKET_TOP + BUCKET_H);
    ctx.lineTo(x - botW / 2, BUCKET_TOP + BUCKET_H);
    ctx.closePath();
  };

  path();
  ctx.fillStyle = 'rgba(15, 30, 50, 0.85)';
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.save();
  path();
  ctx.clip();
  const waterTop = BUCKET_TOP + BUCKET_H - BUCKET_H * 0.92 * level;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
  ctx.beginPath();
  ctx.moveTo(left - 4, BUCKET_TOP + BUCKET_H + 4);
  for (let i = 0; i <= topW + 8; i += 6) {
    ctx.lineTo(left - 4 + i, waterTop + Math.sin(time * 4 + i * 0.2) * 1.8);
  }
  ctx.lineTo(left + topW + 4, BUCKET_TOP + BUCKET_H + 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  path();
  ctx.strokeStyle = '#c5ccd8';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = '#8693b3';
  ctx.fillRect(left - 3, BUCKET_TOP - 3, topW + 6, 6);
  ctx.fillStyle = '#c5ccd8';
  ctx.fillRect(x - botW / 2 + 6, BUCKET_TOP + 18, botW - 12, 3);
  ctx.restore();
}

function WaterGame({ onProgress }) {
  const TOTAL = 8;
  const canvasRef = useRef(null);
  const [caught, setCaught] = useState(0);

  useEffect(() => { onProgress(caught, TOTAL); }, [caught, onProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const drops = [];
    const rings = [];
    const bucket = { x: WATER_W / 2, target: WATER_W / 2 };
    const keys = {};
    let caughtCount = 0;
    let spawnTimer = 0.4;
    let glowUntil = 0;
    let last = performance.now();
    let frameId = 0;

    const toCanvasX = (e) => {
      const rect = canvas.getBoundingClientRect();
      return ((e.clientX - rect.left) * WATER_W) / rect.width;
    };
    const onPointer = (e) => { bucket.target = toCanvasX(e); };
    const onKeyDown = (e) => {
      if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) {
        keys[e.code] = true;
        e.preventDefault();
      }
    };
    const onKeyUp = (e) => { keys[e.code] = false; };

    canvas.addEventListener('pointermove', onPointer);
    canvas.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const time = now / 1000;

      const dir = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
      if (dir !== 0) bucket.target = Math.max(0, Math.min(WATER_W, bucket.target + dir * 380 * dt));
      bucket.x += (bucket.target - bucket.x) * Math.min(1, 14 * dt);
      bucket.x = Math.max(BUCKET_W / 2, Math.min(WATER_W - BUCKET_W / 2, bucket.x));

      spawnTimer -= dt;
      if (spawnTimer <= 0 && caughtCount < TOTAL) {
        spawnTimer = 0.55 + Math.random() * 0.6;
        const x = NOZZLES[Math.floor(Math.random() * NOZZLES.length)];
        drops.push({ x, y: 30, vy: 20 });
      }

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.vy += 340 * dt;
        d.y += d.vy * dt;
        const inMouth = d.y >= BUCKET_TOP - 4 && d.y <= BUCKET_TOP + 16
          && Math.abs(d.x - bucket.x) < BUCKET_W / 2 - 4;
        if (inMouth) {
          drops.splice(i, 1);
          rings.push({ x: d.x, y: BUCKET_TOP + 2, age: 0 });
          if (caughtCount < TOTAL) {
            caughtCount += 1;
            setCaught(caughtCount);
            sounds.playWater();
            glowUntil = now + 350;
          }
        } else if (d.y >= WATER_H - 16) {
          drops.splice(i, 1);
          rings.push({ x: d.x, y: WATER_H - 12, age: 0 });
        }
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        rings[i].age += dt;
        if (rings[i].age > 0.5) rings.splice(i, 1);
      }

      drawWaterScene(ctx, time);
      drops.forEach((d) => drawDrop(ctx, d.x, d.y));
      rings.forEach((r) => {
        ctx.strokeStyle = `rgba(186, 230, 253, ${1 - r.age / 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, 4 + r.age * 40, 2 + r.age * 10, 0, 0, Math.PI * 2);
        ctx.stroke();
      });
      drawBucket(ctx, bucket.x, caughtCount / TOTAL, now < glowUntil || caughtCount >= TOTAL, time);

      frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frameId);
      canvas.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  return (
    <div className="water-field">
      <canvas
        ref={canvasRef}
        width={WATER_W}
        height={WATER_H}
        className="water-canvas"
        aria-label="Zona de captura: mueve el cubo para atrapar las gotas que caen"
      />
    </div>
  );
}
/* ---------- 5. Escudo: sella los huecos del búnker con un soplete ---------- */
const SHIELD_W = 640;
const SHIELD_H = 300;
const DOME = { cx: 320, base: 262, rx: 215, ry: 165 };
const SHIELD_HOLES = [
  { x: 222, y: 206 }, { x: 300, y: 152 }, { x: 392, y: 160 },
  { x: 448, y: 218 }, { x: 330, y: 224 }, { x: 266, y: 244 }
];
const SEAL_SECONDS = 1.8;
const TORCH_REACH = 28;
const SPECKLES = Array.from({ length: 70 }, (_, i) => {
  const angle = Math.PI + ((i * 0.6180339887) % 1) * Math.PI;
  const rad = Math.sqrt((i * 0.7548776662) % 1) * 0.95;
  return {
    x: DOME.cx + Math.cos(angle) * DOME.rx * rad,
    y: DOME.base + Math.sin(angle) * DOME.ry * rad,
    size: 2 + (i % 3),
    light: i % 2 === 0
  };
});

function drawShieldScene(ctx, time, allSealed) {
  const bg = ctx.createLinearGradient(0, 0, 0, SHIELD_H);
  bg.addColorStop(0, '#a8512f');
  bg.addColorStop(1, '#c8683f');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SHIELD_W, SHIELD_H);

  ctx.save();
  ctx.shadowColor = '#fde047';
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(570, 50, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#fde68a';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6 + time * 0.3;
    const r0 = 30;
    const r1 = 40 + Math.sin(time * 3 + i) * 4;
    ctx.beginPath();
    ctx.moveTo(570 + Math.cos(a) * r0, 50 + Math.sin(a) * r0);
    ctx.lineTo(570 + Math.cos(a) * r1, 50 + Math.sin(a) * r1);
    ctx.stroke();
  }

  ctx.fillStyle = '#7a3820';
  ctx.fillRect(0, DOME.base, SHIELD_W, SHIELD_H - DOME.base);
  ctx.fillStyle = '#5a2815';
  ctx.fillRect(0, DOME.base, SHIELD_W, 4);

  const body = ctx.createLinearGradient(0, DOME.base - DOME.ry, 0, DOME.base);
  body.addColorStop(0, '#80838f');
  body.addColorStop(1, '#5b5e69');
  ctx.save();
  if (allSealed) {
    ctx.shadowColor = '#7DD3FC';
    ctx.shadowBlur = 22;
  }
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(DOME.cx, DOME.base, DOME.rx, DOME.ry, 0, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  SPECKLES.forEach((s) => {
    ctx.fillStyle = s.light ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });
  ctx.strokeStyle = allSealed ? '#7DD3FC' : '#3b3d45';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(DOME.cx, DOME.base, DOME.rx, DOME.ry, 0, Math.PI, 0);
  ctx.stroke();

  ctx.fillStyle = 'rgba(15, 26, 46, 0.78)';
  roundRectPath(ctx, DOME.cx - 118, DOME.base + 12, 236, 24, 6);
  ctx.fill();
  ctx.fillStyle = '#F8E7D4';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Tierra marciana (regolito)', DOME.cx, DOME.base + 29);
}

function drawOpenHole(ctx, h, time) {
  ctx.strokeStyle = 'rgba(253, 224, 71, 0.75)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(h.x + i * 8, h.y + 8);
    for (let k = 1; k <= 4; k++) {
      ctx.lineTo(h.x + i * 8 + Math.sin(time * 6 + k + i) * 4 + i * k * 3, h.y + 8 + k * 7);
    }
    ctx.stroke();
  }
  ctx.fillStyle = '#15151c';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const r = 15 + (i % 2 === 0 ? 3 : -2);
    const px = h.x + Math.cos(a) * r;
    const py = h.y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawSealedHole(ctx, h, now) {
  const heat = Math.max(0, 1 - (now - h.sealedAt) / 1500);
  const mix = (a, b) => Math.round(a + (b - a) * heat);
  ctx.save();
  if (heat > 0) {
    ctx.shadowColor = '#ff8a3d';
    ctx.shadowBlur = heat * 18;
  }
  ctx.fillStyle = `rgb(${mix(154, 255)}, ${mix(160, 138)}, ${mix(173, 61)})`;
  ctx.strokeStyle = '#5d606b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(h.x, h.y, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(60, 60, 70, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(h.x - 12, h.y - 3);
  ctx.quadraticCurveTo(h.x, h.y + 4, h.x + 12, h.y - 3);
  ctx.stroke();
  ctx.fillStyle = '#4b4e58';
  [[-11, -11], [11, -11], [-11, 11], [11, 11]].forEach(([dx, dy]) => {
    ctx.beginPath();
    ctx.arc(h.x + dx * 0.8, h.y + dy * 0.8, 1.6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawTorch(ctx, x, y, pressed, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 6);

  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -120);
  ctx.bezierCurveTo(0, -150, 60, -130, 90, -175);
  ctx.stroke();

  ctx.fillStyle = '#374151';
  roundRectPath(ctx, -8, -122, 16, 44, 5);
  ctx.fill();
  ctx.fillStyle = '#6b7280';
  roundRectPath(ctx, -6, -80, 12, 56, 3);
  ctx.fill();
  ctx.fillStyle = '#f97316';
  ctx.fillRect(-6, -58, 12, 6);
  ctx.fillStyle = '#9ca3af';
  ctx.beginPath();
  ctx.moveTo(-5, -24);
  ctx.lineTo(5, -24);
  ctx.lineTo(3, -18);
  ctx.lineTo(-3, -18);
  ctx.closePath();
  ctx.fill();

  const flicker = Math.sin(time * 40) * 2 + Math.random() * 2;
  const len = pressed ? 16 + flicker : 5;
  const width = pressed ? 6 : 2.5;
  ctx.save();
  if (pressed) {
    ctx.shadowColor = '#fb923c';
    ctx.shadowBlur = 16;
  }
  const flame = (w, l, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-w, -18);
    ctx.quadraticCurveTo(-w * 1.2, -18 + l * 0.6, 0, -18 + l);
    ctx.quadraticCurveTo(w * 1.2, -18 + l * 0.6, w, -18);
    ctx.closePath();
    ctx.fill();
  };
  if (pressed) flame(width, len, 'rgba(251, 146, 60, 0.95)');
  flame(width * 0.65, len * 0.8, '#60a5fa');
  if (pressed) flame(width * 0.3, len * 0.5, '#f8fafc');
  ctx.restore();

  ctx.restore();
}

function RegolithGame({ onProgress }) {
  const TOTAL = SHIELD_HOLES.length;
  const canvasRef = useRef(null);
  const [sealed, setSealed] = useState(0);

  useEffect(() => { onProgress(sealed, TOTAL); }, [sealed, TOTAL, onProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const holes = SHIELD_HOLES.map((h) => ({ ...h, progress: 0, sealed: false, sealedAt: 0 }));
    const sparks = [];
    const torch = { x: SHIELD_W / 2, y: SHIELD_H / 2, pressed: false, active: false };
    let sealedCount = 0;
    let last = performance.now();
    let frameId = 0;

    const toCanvas = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) * SHIELD_W) / rect.width,
        y: ((e.clientY - rect.top) * SHIELD_H) / rect.height
      };
    };
    const onMove = (e) => {
      const p = toCanvas(e);
      torch.x = p.x;
      torch.y = p.y;
      torch.active = true;
    };
    const onDown = (e) => {
      canvas.setPointerCapture(e.pointerId);
      onMove(e);
      torch.pressed = true;
      sounds.playClick();
    };
    const onUp = () => { torch.pressed = false; };
    const onLeave = () => { if (!torch.pressed) torch.active = false; };

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('pointerleave', onLeave);

    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const time = now / 1000;

      let target = null;
      if (torch.pressed) {
        let best = TORCH_REACH;
        holes.forEach((h) => {
          const d = Math.hypot(h.x - torch.x, h.y - torch.y);
          if (!h.sealed && d < best) { best = d; target = h; }
        });
      }
      holes.forEach((h) => {
        if (h.sealed) return;
        if (h === target) {
          h.progress += dt / SEAL_SECONDS;
          for (let i = 0; i < 2; i++) {
            sparks.push({
              x: torch.x,
              y: torch.y,
              vx: (Math.random() - 0.5) * 140,
              vy: -40 - Math.random() * 110,
              life: 0.5 + Math.random() * 0.3
            });
          }
          if (h.progress >= 1) {
            h.progress = 1;
            h.sealed = true;
            h.sealedAt = now;
            sealedCount += 1;
            setSealed(sealedCount);
            sounds.playBlip();
          }
        } else {
          h.progress = Math.max(0, h.progress - dt * 0.6);
        }
      });
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.vy += 360 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
        if (s.life <= 0) sparks.splice(i, 1);
      }

      drawShieldScene(ctx, time, sealedCount >= TOTAL);
      holes.forEach((h) => {
        if (h.sealed) {
          drawSealedHole(ctx, h, now);
        } else {
          drawOpenHole(ctx, h, time);
          if (h.progress > 0) {
            ctx.strokeStyle = `hsl(${45 - h.progress * 30}, 95%, 55%)`;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(h.x, h.y, 25, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * h.progress);
            ctx.stroke();
          }
        }
      });
      sparks.forEach((s) => {
        ctx.fillStyle = `rgba(253, 224, 71, ${Math.min(1, s.life * 2.5)})`;
        ctx.fillRect(s.x, s.y, 3, 3);
      });
      if (torch.active) drawTorch(ctx, torch.x, torch.y, torch.pressed, time);

      frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frameId);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div className="regolith-field">
      <canvas
        ref={canvasRef}
        width={SHIELD_W}
        height={SHIELD_H}
        className="regolith-canvas"
        aria-label="Búnker con huecos: mantén presionado el soplete sobre cada hueco para sellarlo"
      />
    </div>
  );
}
/* ---------- 6. EVA: detector de muestras ---------- */
function randomSamples() {
  const points = [];
  while (points.length < 3) {
    const p = { x: 12 + Math.random() * 76, y: 18 + Math.random() * 64 };
    if (points.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > 28)) points.push(p);
  }
  return points.map((p, id) => ({ ...p, id }));
}

function EvaGame({ onProgress }) {
  const samples = useMemo(randomSamples, []);
  const [collected, setCollected] = useState([]);
  const [pointer, setPointer] = useState(null);
  const fieldRef = useRef(null);
  const SCAN_RADIUS = 70;

  useEffect(() => { onProgress(collected.length, samples.length); }, [collected, samples, onProgress]);

  const trackPointer = (e) => {
    const rect = fieldRef.current.getBoundingClientRect();
    setPointer({ x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height });
  };

  const distanceTo = (sample) => {
    if (!pointer) return Infinity;
    return Math.hypot(pointer.x - (sample.x / 100) * pointer.w, pointer.y - (sample.y / 100) * pointer.h);
  };

  const remaining = samples.filter((s) => !collected.includes(s.id));
  const nearest = remaining.length ? Math.min(...remaining.map(distanceTo)) : Infinity;
  let heat = '🥶 Frío: sigue buscando';
  if (nearest < SCAN_RADIUS) heat = '🔥 ¡Caliente! Toca la muestra';
  else if (nearest < 160) heat = '🙂 Tibio: te acercas';

  return (
    <div
      ref={fieldRef}
      className="eva-field"
      onPointerMove={trackPointer}
      onPointerDown={trackPointer}
      onPointerLeave={() => setPointer(null)}
    >
      <span className="eva-rock" style={{ left: '8%', top: '70%' }}>🪨</span>
      <span className="eva-rock" style={{ left: '88%', top: '24%' }}>🪨</span>
      <span className="eva-rock" style={{ left: '52%', top: '88%' }}>🪨</span>
      {remaining.map((s) => {
        const near = distanceTo(s) < SCAN_RADIUS;
        return (
          <button
            key={s.id}
            type="button"
            className={`eva-sample ${near ? 'eva-sample-near' : ''}`}
            style={{ left: `${s.x}%`, top: `${s.y}%` }}
            onClick={() => {
              if (!near) return;
              sounds.playHarvest();
              setCollected((c) => [...c, s.id]);
            }}
            aria-label="Muestra de roca escondida"
          >
            🧪
          </button>
        );
      })}
      {pointer && (
        <span
          className="eva-scanner"
          style={{ left: pointer.x, top: pointer.y, width: SCAN_RADIUS * 2, height: SCAN_RADIUS * 2 }}
          aria-hidden="true"
        />
      )}
      <span className="eva-heat">{heat}</span>
    </div>
  );
}

/* ---------- 7. Antena: apunta a la Tierra ---------- */
function AntennaGame({ onProgress }) {
  const target = useMemo(() => 20 + Math.round(Math.random() * 60), []);
  const [value, setValue] = useState(50);
  const [locked, setLocked] = useState(false);
  const diff = Math.abs(value - target);
  const strong = diff <= 5;
  const strength = Math.max(0, 1 - diff / 40);

  useEffect(() => { onProgress(locked ? 1 : 0, 1); }, [locked, onProgress]);

  return (
    <div className="antenna-field">
      <div className="antenna-track">
        <span className="antenna-earth" style={{ left: `${target}%` }}>🌍</span>
        <span className="antenna-dish" style={{ left: `${value}%`, transform: `translateX(-50%) rotate(${(value - 50) * 0.9}deg)` }}>📡</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        disabled={locked}
        onChange={(e) => setValue(Number(e.target.value))}
        className="antenna-slider"
        aria-label="Girar la antena"
      />
      <div className="antenna-signal" aria-live="polite">
        <span>Señal</span>
        <span className="antenna-signal-track">
          <span style={{ width: `${strength * 100}%`, background: strong ? '#34D399' : '#F59E0B' }} />
        </span>
        <strong>{strong ? '¡Fuerte!' : diff <= 15 ? 'Débil' : 'Sin señal'}</strong>
      </div>
      <button
        type="button"
        className="pixel-btn pixel-btn-cyan"
        disabled={!strong || locked}
        onClick={() => {
          sounds.playBlip();
          setLocked(true);
        }}
      >
        {locked ? 'Señal bloqueada ✓' : 'Bloquear señal'}
      </button>
    </div>
  );
}

/* ---------- Marco común del reto ---------- */
const CHALLENGES = {
  clean: {
    title: '¡PANELES CON POLVO!',
    nova: 'El polvo reduce la energía que conseguimos del Sol. ¡Ayuda a limpiar los paneles con la almohadilla!',
    label: 'Paneles limpios',
    hint: 'Mantén presionado el mouse (o el dedo) y frota cada panel para quitarle el polvo.',
    Game: DustCleaningGame
  },
  plant: {
    title: '¡SIEMBRA EN EL INVERNADERO!',
    nova: 'El invernadero tiene 10 huecos. Elige una semilla y siembra 3 plantas distintas. ¡Lo que siembres se queda en el invernadero y puedes seguir otro día!',
    label: 'Semillas sembradas',
    hint: 'Elige una semilla de arriba y toca un hueco libre. Desplázate dentro del invernadero para ver todos los huecos.',
    saves: true,
    Game: PlantGame
  },
  moxie: {
    title: '¡FÁBRICA DE OXÍGENO!',
    nova: 'Las nubes de CO₂ flotan por el cráter como medusas. ¡Atrápalas con tu red y MOXIE las convertirá en oxígeno!',
    label: 'Oxígeno fabricado',
    hint: 'Mueve la red con el mouse (o el dedo) y haz clic para atrapar. ¡Se asustan si te acercas, sorpréndelas!',
    Game: MoxieGame
  },
  water: {
    title: '¡CUIDANDO CADA GOTA!',
    nova: 'En el espacio se recicla casi toda el agua. ¡Atrapa con tu cubo las gotas que caen de las tuberías y no desperdicies ninguna!',
    label: 'Gotas recogidas',
    hint: 'Mueve el cubo con el mouse (o desliza el dedo, o usa ← →) y colócalo bajo las gotas que caen.',
    Game: WaterGame
  },
  regolith: {
    title: '¡ESCUDO DE TIERRA MARCIANA!',
    nova: 'La radiación del Sol se cuela por los huecos del búnker. ¡Usa el soplete para derretir la tierra marciana y sellarlos!',
    label: 'Huecos sellados',
    hint: 'Acerca el soplete a un hueco y mantén presionado unos segundos hasta que se selle.',
    Game: RegolithGame
  },
  eva: {
    title: '¡EXPLORADOR DEL CRÁTER!',
    nova: 'En Jezero hubo un lago antiguo. ¡Usa el detector para encontrar tres muestras de roca escondidas!',
    label: 'Muestras recogidas',
    hint: 'Mueve el detector por el terreno. Cuando una muestra brille, tócala.',
    Game: EvaGame
  },
  antenna: {
    title: '¡MENSAJE A HOUSTON!',
    nova: 'Para hablar con la Tierra la antena debe apuntar al planeta azul. ¡Gírala hasta tener señal fuerte!',
    label: 'Antena apuntando',
    hint: 'Mueve el control hasta que la señal sea fuerte y pulsa "Bloquear señal".',
    Game: AntennaGame
  }
};

export default function MissionChallenge({
  missionId,
  game,
  garden,
  onGardenChange,
  onComplete,
  onSkip,
  onClose
}) {
  const config = CHALLENGES[game];
  const mission = MISSIONS_LIST.find((m) => m.id === missionId);
  const missionNumber = MISSIONS_LIST.findIndex((m) => m.id === missionId) + 1;
  const [progress, setProgress] = useState({ done: 0, total: 1 });
  const report = useCallback((done, total) => setProgress({ done, total }), []);
  const complete = progress.total > 0 && progress.done >= progress.total;

  useEffect(() => {
    const onKey = (e) => { if (e.code === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (complete) sounds.playVictory();
  }, [complete]);

  if (!config || !mission) return null;
  const { Game } = config;

  return (
    <div className="modal-overlay challenge-overlay">
      <div className="challenge-panel" role="dialog" aria-modal="true" aria-labelledby="challenge-title">
        <div className="challenge-head">
          <h2 id="challenge-title" className="challenge-title">
            RETO 0{missionNumber} · {config.title}
          </h2>
          <span className="challenge-icon" aria-hidden="true"><MissionIcon icon={mission.icon} /></span>
        </div>

        <p className="challenge-nova"><strong>NOVA:</strong> «{config.nova}»</p>

        <div className={`challenge-stage challenge-stage-${game}`}>
          <Game onProgress={report} garden={garden} onGardenChange={onGardenChange} />
        </div>

        <div className="challenge-progress-row">
          <span>{config.label}</span>
          <strong>{progress.done} / {progress.total}</strong>
        </div>
        <div className="challenge-progress-track" aria-hidden="true">
          <span style={{ width: `${(progress.done / progress.total) * 100}%` }} />
        </div>

        {complete ? (
          <div className="challenge-success">
            <strong>¡Reto superado!</strong>
            <button type="button" className="pixel-btn pixel-btn-green" onClick={onComplete}>
              CONTINUAR ✓
            </button>
          </div>
        ) : (
          <p className="challenge-hint">{config.hint}</p>
        )}

        <div className="challenge-footer">
          <button type="button" className="challenge-link" onClick={onClose}>{config.saves ? '💾 Continuar más tarde' : 'Salir'}</button>
          {!complete && (
            <button type="button" className="challenge-link" onClick={onSkip}>Omitir reto</button>
          )}
        </div>
      </div>
    </div>
  );
}





