import React, { useState } from 'react';
import { INITIAL_RESOURCES, SOL_EVENTS } from './data/gameData';
import { sounds } from './services/audioService';
import { executeAction, advanceSolState, applyChoiceToState, generateReport } from './services/gameEngine';

import TelemetryHUD from './components/TelemetryHUD';
import PixelCanvas from './components/PixelCanvas';
import ActionControls from './components/ActionControls';
import StartModal from './components/StartModal';
import EventModal from './components/EventModal';
import NasaScienceModal from './components/NasaScienceModal';
import CertificateModal from './components/CertificateModal';

const INITIAL_STATE = {
  cadetName: 'Cadete Explorador',
  sol: 1,
  isNight: false,
  roverTask: null,
  resources: { ...INITIAL_RESOURCES },
  crops: { planted: false, stage: 0, solsToHarvest: 0 },
  crew: [
    { id: 'alex', name: 'Alex', role: 'Comandante', color: '#E24A3B', x: 220, y: 195, vx: 0.3, phrase: '¡El cráter Jezero es fascinante! Revisemos la energía.' },
    { id: 'maya', name: 'Dra. Maya', role: 'Botánica', color: '#10B981', x: 380, y: 195, vx: -0.25, phrase: 'Las lechugas espaciales necesitan luz y agua limpia.' },
    { id: 'leo', name: 'Leo', role: 'Ingeniero', color: '#F59E0B', x: 120, y: 195, vx: 0.2, phrase: 'El polvo marciano es muy fino. ¡Usemos el cepillo del rover!' },
    { id: 'sam', name: 'Sam', role: 'Soporte Vital', color: '#38BDF8', x: 290, y: 195, vx: -0.3, phrase: '¡MOXIE convierte el CO2 de Marte en oxígeno puro!' }
  ],
  gameOver: false,
  victory: false
};

export default function App() {
  const [gameState, setGameState] = useState(INITIAL_STATE);
  const [gameStarted, setGameStarted] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeNasaKey, setActiveNasaKey] = useState(null);
  const [speechBubble, setSpeechBubble] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const showBubble = (text, duration = 4500) => {
    setSpeechBubble({ text, timer: Date.now() + duration });
  };

  const handleStartGame = (name) => {
    sounds.playVictory();
    setGameState(prev => ({ ...prev, cadetName: name, sol: 1 }));
    setGameStarted(true);
    setActiveEvent(SOL_EVENTS[0]);
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleAction = (actionType) => {
    sounds.playClick();
    const { nextState, bubble } = executeAction(gameState, actionType);
    setGameState(nextState);
    if (bubble) showBubble(bubble);
  };

  const handleAdvanceSol = () => {
    sounds.playClick();
    const { nextState, nextEvent, bubble } = advanceSolState(gameState);
    setGameState(nextState);
    if (nextEvent) setActiveEvent(nextEvent);
    if (bubble) showBubble(bubble);
  };

  const handleChooseEventOption = (choice) => {
    sounds.playClick();
    const nextState = applyChoiceToState(gameState, choice);
    setGameState(nextState);
    setActiveEvent(null);
  };

  const handleModuleClick = (moduleName, message) => {
    if (message) {
      showBubble(message);
      return;
    }
    if (moduleName === 'agrodome') {
      if (!gameState.crops.planted) handleAction('plant');
      else showBubble('Invernadero Agrodome: Cultivo en proceso. Cosecha pronto.');
    } else if (moduleName === 'solar') {
      handleAction('clean');
    } else if (moduleName === 'moxie') {
      handleAction('moxie');
    }
  };

  const handleRestart = () => {
    sounds.playVictory();
    setGameState(INITIAL_STATE);
    setGameStarted(false);
    setActiveEvent(null);
    setActiveNasaKey(null);
    setSpeechBubble(null);
  };

  const report = gameState.victory ? generateReport(gameState) : null;

  return (
    <div style={{ width: '100%' }}>
      {/* HUD Telemetry Bar */}
      <TelemetryHUD 
        state={gameState} 
        isMuted={isMuted} 
        onToggleMute={handleToggleMute} 
      />

      {/* 2D Pixel Art Canvas */}
      <PixelCanvas 
        state={gameState} 
        onModuleClick={handleModuleClick} 
        speechBubble={speechBubble} 
      />

      {/* Commander Tactical Controls */}
      <ActionControls 
        onAction={handleAction} 
        onAdvanceSol={handleAdvanceSol} 
      />

      {/* Start Modal */}
      {!gameStarted && (
        <StartModal onStart={handleStartGame} />
      )}

      {/* Daily Crisis Event Modal */}
      {gameStarted && activeEvent && (
        <EventModal 
          event={activeEvent} 
          onChooseOption={handleChooseEventOption} 
          onOpenNasaModal={(key) => setActiveNasaKey(key)} 
        />
      )}

      {/* NASA Scientific Data Modal */}
      {activeNasaKey && (
        <NasaScienceModal 
          sourceKey={activeNasaKey} 
          onClose={() => setActiveNasaKey(null)} 
        />
      )}

      {/* Victory / Debriefing Certificate Modal */}
      {(gameState.victory || gameState.gameOver) && (
        <CertificateModal 
          report={report} 
          isGameOver={gameState.gameOver} 
          onRestart={handleRestart} 
        />
      )}
    </div>
  );
}
