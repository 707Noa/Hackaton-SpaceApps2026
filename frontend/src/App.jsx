import React, { useState, useEffect } from 'react';
import { INITIAL_GAME_STATE, SOL_EVENTS } from './data/gameData';
import { sounds } from './services/audioService';
import { executeModuleAction, advanceSolState, applyChoiceToState, generateReport } from './services/gameEngine';

import StartScene from './components/StartScene';
import TelemetryHUD from './components/TelemetryHUD';
import BabylonViewport from './components/BabylonViewport';
import ResourceDistributionPanel from './components/ResourceDistributionPanel';

import AgrodomeView from './modules/agrodome/AgrodomeView';
import PowerCoreView from './modules/power-core/PowerCoreView';
import LifeSupportView from './modules/life-support/LifeSupportView';
import ShieldSystemView from './modules/shield-system/ShieldSystemView';
import MissionControlView from './modules/mission-control/MissionControlView';

import MissionsModal from './components/MissionsModal';
import EventModal from './components/EventModal';
import NasaScienceModal from './components/NasaScienceModal';
import CertificateModal from './components/CertificateModal';

export default function App() {
  const [gameState, setGameState] = useState(INITIAL_GAME_STATE);
  const [gameStarted, setGameStarted] = useState(false);
  const [activeModule, setActiveModule] = useState('mission_control');
  const [showMissions, setShowMissions] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const [activeNasaKey, setActiveNasaKey] = useState(null);
  const [speechBubble, setSpeechBubble] = useState(null);
  const [isMuted, setIsMuted] = useState(false);

  const hasModalOpen = Boolean(
    showMissions || activeEvent || activeNasaKey || gameState.victory || gameState.gameOver
  );

  // Keyboard shortcut 'M' to toggle Missions Modal
  useEffect(() => {
    if (!gameStarted) return;
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'KeyM') {
        sounds.playClick();
        setShowMissions((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameStarted]);

  const showBubble = (text, duration = 4800) => {
    setSpeechBubble({ text, timer: Date.now() + duration });
  };

  const handleStartGame = (name) => {
    sounds.playVictory();
    setGameState((prev) => ({
      ...prev,
      cadetName: name || 'Cadete Explorador',
      sol: 1
    }));
    setGameStarted(true);
    setActiveEvent(SOL_EVENTS[0]);
    showBubble(`¡Bienvenido Comandante ${name}! Muévete con WASD o Flechas por la base.`);
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleExecuteAction = (moduleName, actionType, payload) => {
    sounds.playClick();
    const { nextState, bubble } = executeModuleAction(gameState, moduleName, actionType, payload);
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

  const handle3DModuleSelect = (moduleKey, message) => {
    if (moduleKey === 'agrodome') setActiveModule('agrodome');
    else if (moduleKey === 'solar' || moduleKey === 'power_core') setActiveModule('power_core');
    else if (moduleKey === 'moxie' || moduleKey === 'life_support') setActiveModule('life_support');
    else if (moduleKey === 'bunker' || moduleKey === 'shield_system') setActiveModule('shield_system');
    else if (moduleKey === 'comms' || moduleKey === 'mission_control') setActiveModule('mission_control');

    if (message) showBubble(message);
  };

  const handleRestart = () => {
    sounds.playVictory();
    setGameState(INITIAL_GAME_STATE);
    setGameStarted(false);
    setActiveModule('mission_control');
    setShowMissions(false);
    setActiveEvent(null);
    setActiveNasaKey(null);
    setSpeechBubble(null);
  };

  // ESCENARIO 1: Dedicated Start & Mission Briefing Screen
  if (!gameStarted) {
    return <StartScene onStart={handleStartGame} />;
  }

  const moduleTabs = [
    { id: 'mission_control', label: '🛰️ Control' },
    { id: 'power_core', label: '⚡ Energía' },
    { id: 'agrodome', label: '🌱 Huerta' },
    { id: 'life_support', label: '🫁 Aire/Agua' },
    { id: 'shield_system', label: '🛡️ Escudo' }
  ];

  const report = gameState.victory || gameState.gameOver ? generateReport(gameState) : null;

  // ESCENARIO 2: Interactive Mars Outpost Survival World
  return (
    <div className="app-container">
      <TelemetryHUD
        state={gameState}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenMissions={() => {
          sounds.playClick();
          setShowMissions(true);
        }}
        onAdvanceSol={handleAdvanceSol}
      />

      <div className="main-game-grid">
        {/* Left Column: 3D Interactive World + Navigation Tabs */}
        <div className="world-column">
          <BabylonViewport
            state={gameState}
            onModuleClick={handle3DModuleSelect}
            speechBubble={speechBubble}
            controlsEnabled={!hasModalOpen}
          />

          <nav className="module-nav-tabs">
            {moduleTabs.map((tab) => (
              <button
                key={tab.id}
                className={`nav-tab-btn ${activeModule === tab.id ? 'active' : ''}`}
                onClick={() => {
                  sounds.playClick();
                  setActiveModule(tab.id);
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Column: Resource Distribution + Active Module Console */}
        <div className="dashboard-column">
          <ResourceDistributionPanel state={gameState} />

          <div className="active-module-slot">
            {activeModule === 'mission_control' && (
              <MissionControlView
                state={gameState}
                onExecuteAction={handleExecuteAction}
                onAdvanceSol={handleAdvanceSol}
                onOpenNasaModal={(key) => setActiveNasaKey(key)}
              />
            )}

            {activeModule === 'power_core' && (
              <PowerCoreView
                state={gameState}
                onExecuteAction={handleExecuteAction}
                onOpenNasaModal={(key) => setActiveNasaKey(key)}
              />
            )}

            {activeModule === 'agrodome' && (
              <AgrodomeView
                state={gameState}
                onExecuteAction={handleExecuteAction}
                onOpenNasaModal={(key) => setActiveNasaKey(key)}
              />
            )}

            {activeModule === 'life_support' && (
              <LifeSupportView
                state={gameState}
                onExecuteAction={handleExecuteAction}
                onOpenNasaModal={(key) => setActiveNasaKey(key)}
              />
            )}

            {activeModule === 'shield_system' && (
              <ShieldSystemView
                state={gameState}
                onExecuteAction={handleExecuteAction}
                onOpenNasaModal={(key) => setActiveNasaKey(key)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Missions Modal */}
      {showMissions && (
        <MissionsModal
          completedMissions={gameState.completedMissions}
          onSelectModule={(mod) => handle3DModuleSelect(mod)}
          onClose={() => setShowMissions(false)}
        />
      )}

      {/* Daily Sol Event Modal */}
      {activeEvent && (
        <EventModal
          event={activeEvent}
          onChooseOption={handleChooseEventOption}
          onOpenNasaModal={(key) => setActiveNasaKey(key)}
        />
      )}

      {/* NASA Scientific Provenance Modal */}
      {activeNasaKey && (
        <NasaScienceModal
          sourceKey={activeNasaKey}
          onClose={() => setActiveNasaKey(null)}
        />
      )}

      {/* Final Victory / Debriefing Certificate Modal */}
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
