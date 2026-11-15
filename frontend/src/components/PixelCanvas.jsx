import React, { useEffect, useRef } from 'react';
import { PixelRenderer } from '../services/pixelArtRenderer';
import { sounds } from '../services/audioService';

export default function PixelCanvas({ state, onModuleClick, speechBubble }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const roverPosRef = useRef({ x: 140, targetX: 140, isMoving: false, task: null });
  const animFrameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    rendererRef.current = new PixelRenderer(canvas);

    let animationId;
    const renderLoop = () => {
      animFrameRef.current += 1;
      const r = rendererRef.current;
      if (!r) return;

      // Update Rover
      const rover = roverPosRef.current;
      if (state.roverTask && !rover.isMoving) {
        rover.isMoving = true;
        rover.task = state.roverTask;
        rover.targetX = 640; // Drive to panels
      }

      if (rover.isMoving) {
        if (Math.abs(rover.x - rover.targetX) > 3) {
          rover.x += (rover.targetX > rover.x ? 2.5 : -2.5);
        } else {
          if (rover.task === 'cleaning') {
            rover.task = 'returning';
            rover.targetX = 140;
          } else {
            rover.isMoving = false;
            rover.task = null;
          }
        }
      }

      // Update Astronauts
      state.crew.forEach(ast => {
        ast.x += ast.vx;
        if (ast.x > 720 || ast.x < 80) ast.vx = -ast.vx;
      });

      // Clear & Draw Scene
      r.clear();
      r.drawSky(state.isNight, state.resources.dust);
      r.drawCanyonMountains();
      r.drawGround();

      // Comms Tower
      r.ctx.fillStyle = '#64748B';
      r.ctx.fillRect(40, 115, 6, 45);
      r.ctx.fillStyle = (Date.now() % 800 > 400) ? '#38BDF8' : '#0284C7';
      r.ctx.fillRect(36, 110, 14, 8);

      // Habitat Central (x: 180, y: 125)
      r.drawHabitat(180, 125, state.isNight);

      // Life Support & MOXIE (x: 290, y: 135)
      r.drawLifeSupportMoxie(290, 135);

      // Shield Bunker (x: 375, y: 135)
      r.drawShieldBunker(375, 135);

      // Agrodome (x: 460, y: 125)
      r.drawAgrodome(460, 125, state.crops.stage, state.isNight);

      // Solar Array (x: 620, y: 130)
      r.drawSolarArray(620, 130, state.resources.dust, state.isNight);

      // Rover
      r.drawRover(rover.x, 192, rover.isMoving, rover.targetX >= rover.x);

      // Astronauts
      state.crew.forEach(ast => {
        r.drawAstronaut(ast.x, ast.y, ast.color, animFrameRef.current, ast.vx > 0);
      });

      // Dust overlay
      r.drawDustWeather(state.resources.dust);

      // Speech Bubble
      if (speechBubble && Date.now() < speechBubble.timer) {
        const ctx = r.ctx;
        ctx.save();
        ctx.font = '10px "Press Start 2P", monospace';
        const textW = Math.min(680, ctx.measureText(speechBubble.text).width + 30);
        const boxH = 34;
        const boxX = (canvas.width - textW) / 2;
        const boxY = 16;

        ctx.fillStyle = '#0F172A';
        ctx.fillRect(boxX, boxY, textW, boxH);
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, textW, boxH);

        ctx.fillStyle = '#F8FAFC';
        ctx.fillText(speechBubble.text, boxX + 15, boxY + 22, textW - 30);
        ctx.restore();
      }

      animationId = requestAnimationFrame(renderLoop);
    };

    animationId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationId);
  }, [state, speechBubble]);

  const handleCanvasClick = (e) => {
    sounds.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check Astronauts
    state.crew.forEach(ast => {
      if (Math.abs(x - ast.x) < 18 && Math.abs(y - ast.y) < 20) {
        onModuleClick('astronaut', `${ast.name} (${ast.role}): "${ast.phrase}"`);
      }
    });

    // Check Agrodome (440 - 530)
    if (x >= 440 && x <= 530 && y >= 120 && y <= 190) {
      onModuleClick('agrodome');
    }
    // Check Solar Array (610 - 710)
    if (x >= 610 && x <= 710 && y >= 120 && y <= 190) {
      onModuleClick('solar');
    }
    // Check MOXIE / ECLSS (290 - 370)
    if (x >= 290 && x <= 370 && y >= 130 && y <= 190) {
      onModuleClick('moxie');
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 7', border: '4px solid #000', boxShadow: '0 4px 0px #000', background: '#000', overflow: 'hidden' }}>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={350} 
        style={{ width: '100%', height: '100%', display: 'block' }}
        onClick={handleCanvasClick}
      />
      <div style={{ position: 'absolute', bottom: '8px', left: '12px', fontSize: '8px', color: '#FDE68A', background: 'rgba(15, 23, 42, 0.85)', padding: '4px 8px', border: '1px solid #000', pointerEvents: 'none' }}>
        🎮 Haz clic en los módulos, paneles o astronautas para interactuar
      </div>
    </div>
  );
}
