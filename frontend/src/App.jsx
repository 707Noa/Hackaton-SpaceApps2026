import React, { useState, useEffect } from 'react';
import {
  INITIAL_GAME_STATE,
  SOL_EVENTS,
  MISSION_CHALLENGES,
  findChallengeForAction
} from './data/gameData';
import { sounds } from './services/audioService';
import {
  executeModuleAction,
  advanceSolState,
  applyChoiceToState,
  activateEmergencyRescue,
  generateReport
} from './services/gameEngine';

import StartScene from './components/StartScene';
import TelemetryHUD from './components/TelemetryHUD';
import BabylonViewport from './components/BabylonViewport';
import ResourceDistributionPanel from './components/ResourceDistributionPanel';
import NovaAdvisor from './components/NovaAdvisor';
import ActionFeedback from './components/ActionFeedback';

import AgrodomeView from './modules/agrodome/AgrodomeView';
import PowerCoreView from './modules/power-core/PowerCoreView';
import LifeSupportView from './modules/life-support/LifeSupportView';
import ShieldSystemView from './modules/shield-system/ShieldSystemView';
import MissionControlView from './modules/mission-control/MissionControlView';

import MissionsModal from './components/MissionsModal';
import MissionChallenge from './components/MissionChallenge';
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
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [speechBubble, setSpeechBubble] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(
    () => typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const hasModalOpen = Boolean(
    showMissions || activeEvent || activeNasaKey || activeChallenge || gameState.victory || gameState.gameOver
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

  const getResourceChanges = (before, after) => {
    const trackedResources = [
      { key: 'energy', label: 'Energía', icon: '⚡' },
      { key: 'water', label: 'Agua', icon: '💧' },
      { key: 'oxygen', label: 'Oxígeno', icon: 'O₂' },
      { key: 'food', label: 'Comida', icon: '🌱' },
      { key: 'co2', label: 'CO₂', icon: '💨' },
      { key: 'dust', label: 'Polvo', icon: '🌪️' },
      { key: 'shield', label: 'Escudo', icon: '🛡️' },
      { key: 'health', label: 'Salud', icon: '🧑‍🚀' },
      { key: 'radiationDose', label: 'Dosis de radiación', icon: '☢️' }
    ];

    return trackedResources
      .map(({ key, ...resource }) => ({
        ...resource,
        id: key,
        delta: getTrackedValue(after, key) - getTrackedValue(before, key)
      }))
      .filter(({ delta }) => delta !== 0);
  };

  const getTrackedValue = (state, key) => {
    if (key === 'dust' || key === 'shield' || key === 'radiationDose') return state[key] || 0;
    if (key === 'health') return state.crew.health;
    return state.resources[key];
  };

  const showActionFeedback = (before, after, message) => {
    const succeeded = before !== after;
    setActionFeedback({
      id: Date.now(),
      status: succeeded ? 'success' : 'warning',
      message: message || (succeeded ? 'La base actualizó sus sistemas.' : 'No se aplicaron cambios.'),
      changes: succeeded ? getResourceChanges(before, after) : []
    });
  };

  const handleStartGame = (name) => {
    sounds.playVictory();
    window.scrollTo(0, 0);
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

  const runModuleAction = (moduleName, actionType, payload) => {
    sounds.playClick();
    const { nextState, bubble } = executeModuleAction(gameState, moduleName, actionType, payload);
    setGameState(nextState);
    showActionFeedback(gameState, nextState, bubble);
    if (bubble) showBubble(bubble);
  };

  const handleExecuteAction = (moduleName, actionType, payload) => {
    const challenge = findChallengeForAction(gameState, moduleName, actionType);
    if (challenge) {
      sounds.playClick();
      setActiveChallenge({ ...challenge, moduleName, actionType, payload });
      return;
    }
    runModuleAction(moduleName, actionType, payload);
  };

  const handlePlayChallenge = (missionId) => {
    const config = MISSION_CHALLENGES[missionId];
    if (!config || gameState.completedMissions.includes(missionId)) return;
    if (gameState.actionsRemaining <= 0) {
      sounds.playAlert();
      showBubble('¡Ya usaste tus 2 acciones de hoy! Presiona "Siguiente Sol" para jugar el reto.');
      return;
    }
    sounds.playClick();
    setActiveChallenge({
      missionId,
      game: config.game,
      moduleName: config.module,
      actionType: config.action,
      payload: config.payload
    });
  };

  const finishChallenge = () => {
    const { moduleName, actionType, payload } = activeChallenge;
    setActiveChallenge(null);
    runModuleAction(moduleName, actionType, payload);
  };

  const handleAdvanceSol = () => {
    sounds.playClick();
    const { nextState, nextEvent, bubble } = advanceSolState(gameState);
    setGameState(nextState);
    if (nextEvent) setActiveEvent(nextEvent);
    const healthChange = nextState.crew.health - gameState.crew.health;
    const summary = healthChange < 0
      ? `Fin del Sol ${gameState.sol}: la salud bajó ${Math.abs(healthChange)} puntos. Revisa las alertas.`
      : `Sol ${gameState.sol} completado. Revisa la previsión antes de seguir.`;
    showBubble(bubble || summary);
  };

  const handleChooseEventOption = (choice) => {
    sounds.playClick();
    const nextState = applyChoiceToState(gameState, choice, activeEvent?.hazard);
    setGameState(nextState);
    showActionFeedback(gameState, nextState, choice.text);
    setActiveEvent(null);
  };

  const handleEmergencyRescue = () => {
    const nextState = activateEmergencyRescue(gameState);
    if (nextState === gameState) return;

    sounds.playPower();
    setGameState(nextState);
    setActiveEvent(nextState.victory ? null : SOL_EVENTS[nextState.sol - 1] || null);
    showBubble('🚀 ¡Protocolo de rescate! La tripulación está estable. Se usaron 25 puntos de ciencia.');
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
    setActionFeedback(null);
  };

  // ESCENARIO 1: Dedicated Start & Mission Briefing Screen
  if (!gameStarted) {
    return <StartScene onStart={handleStartGame} />;
  }

  const moduleTabs = [
    { id: 'mission_control', label: '🛰️ Control' },
    { id: 'power_core', label: '⚡ Energía' },
    { id: 'agrodome', label: '🌱 Huerta' },
    { id: 'life_support', label: 'O₂ Aire/Agua' },
    { id: 'shield_system', label: '🛡️ Escudo' }
  ];

  const report = gameState.victory || gameState.gameOver ? generateReport(gameState) : null;

  // ESCENARIO 2: Interactive Mars Outpost Survival World
  return (
    <div className={`app-container mission-interface ${isReducedMotion ? 'reduce-motion' : ''}`}>
      <TelemetryHUD
        state={gameState}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isReducedMotion={isReducedMotion}
        onToggleReducedMotion={() => setIsReducedMotion((reduced) => !reduced)}
        onOpenMissions={() => {
          sounds.playClick();
          setShowMissions(true);
        }}
        onAdvanceSol={handleAdvanceSol}
        onSelectModule={handle3DModuleSelect}
      />

      <div className="main-game-grid">
        {/* Left Column: 3D Interactive World + Navigation Tabs */}
        <div className="world-column">
          <BabylonViewport
            state={gameState}
            onModuleClick={handle3DModuleSelect}
            speechBubble={speechBubble}
            controlsEnabled={!hasModalOpen && !gameState.bunkerActive}
            reducedMotion={isReducedMotion}
          />

          {!gameState.activeHazard && (
            <NovaAdvisor
              state={gameState}
              onSelectModule={handle3DModuleSelect}
            />
          )}

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
          <ResourceDistributionPanel
            state={gameState}
            onSelectModule={handle3DModuleSelect}
          />

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
          onPlayChallenge={handlePlayChallenge}
          onClose={() => setShowMissions(false)}
        />
      )}

      {/* Interactive mission challenge */}
      {activeChallenge && (
        <MissionChallenge
          missionId={activeChallenge.missionId}
          game={activeChallenge.game}
          garden={gameState.garden}
          onGardenChange={(garden) => setGameState((prev) => ({ ...prev, garden }))}
          onComplete={finishChallenge}
          onSkip={finishChallenge}
          onClose={() => setActiveChallenge(null)}
        />
      )}

      {/* Daily Sol Event Modal */}
      {activeEvent && (
        <EventModal
          event={activeEvent}
          actionsRemaining={gameState.actionsRemaining}
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
          rescueAvailable={!gameState.emergencyRescueUsed}
          onRescue={handleEmergencyRescue}
        />
      )}

      <ActionFeedback
        feedback={actionFeedback}
        onDismiss={(feedbackId) => setActionFeedback((current) => (
          current?.id === feedbackId ? null : current
        ))}
      />
    </div>
  );
}

