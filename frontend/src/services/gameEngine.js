// MARS RANGERS: Core Simulation, Missions & Trade-off Engine

import { LAUNCH_PREPARATION_TASKS, SOL_EVENTS, MISSIONS_LIST } from '../data/gameData.js';
import { sounds } from './audioService.js';

export function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(val)));
}

export function prepareLaunchState(state, cadetName, taskId) {
  if (!LAUNCH_PREPARATION_TASKS.some((task) => task.id === taskId)) {
    throw new RangeError(`Preparación de lanzamiento desconocida: ${taskId}`);
  }

  const next = JSON.parse(JSON.stringify(state));
  next.cadetName = cadetName?.trim() || 'Explorador';

  if (taskId === 'seed-crop') {
    if (next.resources.water < 8 || next.resources.energy < 6) {
      throw new Error('Faltan agua y energía para preparar la primera parcela.');
    }
    next.resources.water = clamp(next.resources.water - 8);
    next.resources.energy = clamp(next.resources.energy - 6);
    next.cropPlots[0] = {
      ...next.cropPlots[0],
      cropType: 'veggie_lettuce',
      planted: true,
      stage: 1,
      solsToHarvest: 2,
      drySols: 0
    };
    next.log.push('Preparación: primera semilla plantada en el huerto.');
  } else if (taskId === 'clean-panels') {
    next.dust = 0;
    next.roverTask = 'cleaning';
    next.robot.battery = clamp(next.robot.battery - 20);
    next.log.push('Preparación: el rover limpió los paneles solares.');
  } else if (taskId === 'filter-air') {
    next.resources.energy = clamp(next.resources.energy - 5);
    next.resources.co2 = clamp(next.resources.co2 - 12);
    next.log.push('Preparación: filtros de aire revisados.');
  }

  next.actionsRemaining = next.maxActionsPerSol;
  next.sol = 1;
  return next;
}

export const RESOURCE_GRACE_SECONDS = 8;

const CRITICAL_RESOURCE_ORDER = ['energy', 'oxygen', 'water', 'hunger', 'co2'];

function isResourceCritical(state, resource) {
  if (resource === 'co2') return state.resources.co2 >= 100;
  if (resource === 'hunger') return state.hunger <= 0;
  return state.resources[resource] <= 0;
}

export function getZeroResource(state) {
  return CRITICAL_RESOURCE_ORDER.find((resource) => isResourceCritical(state, resource)) || null;
}

export function canIssueAction(state) {
  return state.actionsRemaining > 0
    || Boolean(state.activeCrisis && !state.activeCrisis.emergencyOrderUsed);
}

export function beginResourceGrace(state) {
  if (state.gameOver || state.victory || state.activeCrisis) return state;

  const failedResources = state.failedCriticalResources || [];
  const resource = CRITICAL_RESOURCE_ORDER.find((key) => (
    isResourceCritical(state, key) && !failedResources.includes(key)
  ));
  if (!resource) return state;

  return {
    ...state,
    activeCrisis: {
      resource,
      secondsRemaining: RESOURCE_GRACE_SECONDS,
      emergencyOrderUsed: false
    }
  };
}

export function reconcileResourceCrisis(state) {
  const unresolvedFailures = (state.failedCriticalResources || []).filter(
    (resource) => isResourceCritical(state, resource)
  );
  const activeCrisis = state.activeCrisis
    && isResourceCritical(state, state.activeCrisis.resource)
    ? state.activeCrisis
    : null;

  if (
    activeCrisis === state.activeCrisis
    && unresolvedFailures.length === (state.failedCriticalResources || []).length
  ) return state;

  return {
    ...state,
    activeCrisis,
    failedCriticalResources: unresolvedFailures
  };
}

export function tickResourceGrace(state) {
  const crisis = state.activeCrisis;
  if (!crisis || state.gameOver || state.victory) return state;
  if (!isResourceCritical(state, crisis.resource)) return reconcileResourceCrisis(state);
  if (crisis.secondsRemaining > 1) {
    return {
      ...state,
      activeCrisis: { ...crisis, secondsRemaining: crisis.secondsRemaining - 1 }
    };
  }

  const next = JSON.parse(JSON.stringify(state));
  next.activeCrisis = null;
  next.failedCriticalResources = [...new Set([
    ...(next.failedCriticalResources || []),
    crisis.resource
  ])];
  next.crew.health = clamp(next.crew.health - 25);
  next.crew.status = next.crew.health <= 35 ? 'Crítica' : 'En Alerta';
  next.playerCollapsed = true;
  if (next.crew.health <= 0) next.gameOver = true;
  next.log.push(
    `Sol 0${next.sol}: El sistema de ${crisis.resource} llegó a cero y el explorador se desplomó.`
  );
  sounds.playAlert();
  return next;
}

function checkAndUnlockMission(nextState, missionId) {
  if (!nextState.completedMissions) nextState.completedMissions = [];
  if (nextState.completedMissions.includes(missionId)) return null;

  const mission = MISSIONS_LIST.find((m) => m.id === missionId);
  if (!mission) return null;

  nextState.completedMissions.push(missionId);
  nextState.scienceProgress = clamp(nextState.scienceProgress + mission.rewardScience, 0, 200);
  sounds.playHarvest();
  return `🏆 ¡Misión Cumplida: ${mission.title}! (+${mission.rewardScience} Ciencia)`;
}

export function executeModuleAction(state, moduleName, actionType, payload = {}) {
  if (state.gameOver || state.victory) {
    return { nextState: state, bubble: 'La misión terminó. Inicia otra misión para continuar.' };
  }

  const next = JSON.parse(JSON.stringify(state));
  const res = next.resources;

  if (!canIssueAction(next)) {
    sounds.playAlert();
    return {
      nextState: state,
      bubble: 'Ya usaste tus órdenes de hoy. Avanza al siguiente Sol para continuar.'
    };
  }

  let actionSuccess = false;
  let bubbleMessage = '';
  let unlockedMissionId = null;

  switch (moduleName) {
    case 'agrodome':
      if (actionType === 'plant') {
        const plotIndex = Number.isInteger(payload.plotIndex)
          ? payload.plotIndex
          : next.cropPlots.findIndex((plot) => !plot.planted);
        const plot = next.cropPlots[plotIndex];
        if (!plot || plot.planted) {
          sounds.playAlert();
          return { nextState: state, bubble: 'Elige una parcela vacía para sembrar.' };
        }
        if (res.water < 8 || res.energy < 6) {
          sounds.playAlert();
          return { nextState: state, bubble: '¡Faltan recursos! Necesitas 8 de Agua y 6 de Energía para sembrar.' };
        }
        res.water = clamp(res.water - 8);
        res.energy = clamp(res.energy - 6);
        next.cropPlots[plotIndex] = {
          ...plot,
          planted: true,
          stage: 1,
          solsToHarvest: 2,
          drySols: 0,
          cropType: payload.cropType || 'veggie_lettuce'
        };
        sounds.playWater();
        bubbleMessage = `🌱 ¡Sembraste en la parcela ${plotIndex + 1}! Estará lista en unos Soles.`;
        unlockedMissionId = 'm_plant';
        actionSuccess = true;
      } else if (actionType === 'harvest') {
        const plotIndex = Number.isInteger(payload.plotIndex)
          ? payload.plotIndex
          : next.cropPlots.findIndex((plot) => plot.planted && plot.stage >= 3);
        const plot = next.cropPlots[plotIndex];
        if (!plot || !plot.planted || plot.stage < 3) {
          sounds.playAlert();
          return { nextState: state, bubble: 'Esa planta todavía no está lista para cosechar.' };
        }
        res.food = clamp(res.food + 25);
        res.oxygen = clamp(res.oxygen + 6);
        next.cropPlots[plotIndex] = {
          ...plot,
          cropType: null,
          planted: false,
          stage: 0,
          solsToHarvest: 0,
          drySols: 0
        };
        sounds.playHarvest();
        bubbleMessage = `🎉 ¡Cosechaste la parcela ${plotIndex + 1}! +25 comida y +6 oxígeno.`;
        actionSuccess = true;
      } else if (actionType === 'boost_light') {
        const plotIndex = Number.isInteger(payload.plotIndex)
          ? payload.plotIndex
          : next.cropPlots.findIndex((crop) => crop.planted && crop.stage < 3);
        const plot = next.cropPlots[plotIndex];
        if (!plot || !plot.planted || plot.stage >= 3) {
          sounds.playAlert();
          return { nextState: state, bubble: 'Elige una planta que todavía esté creciendo.' };
        }
        if (res.energy < 5) {
          sounds.playAlert();
          return { nextState: state, bubble: '¡Necesitas 5 de Energía para encender las luces LED!' };
        }
        res.energy = clamp(res.energy - 5);
        if (plot.solsToHarvest > 1) {
          next.cropPlots[plotIndex] = { ...plot, solsToHarvest: 1, stage: 2 };
        }
        sounds.playPower();
        bubbleMessage = `💡 ¡Luces LED para la parcela ${plotIndex + 1}! Crecerá más rápido.`;
        actionSuccess = true;
      } else if (actionType === 'eat') {
        if (res.food < 12) {
          if (next.hunger > 0 || !next.robot.emergencyRationAvailable) {
            sounds.playAlert();
            return { nextState: state, bubble: 'No quedan raciones. Cosecha comida en el huerto.' };
          }
          next.robot.emergencyRationAvailable = false;
          next.hunger = clamp(next.hunger + 25);
          sounds.playHarvest();
          bubbleMessage = '🤖 ¡El rover compartió su ración de emergencia! Recuperaste algo de energía.';
          actionSuccess = true;
          break;
        }
        if (next.hunger >= 95) {
          sounds.playAlert();
          return { nextState: state, bubble: '¡Ya estás satisfecho! Guarda la comida para después.' };
        }
        res.food = clamp(res.food - 12);
        next.hunger = clamp(next.hunger + 40);
        sounds.playHarvest();
        bubbleMessage = '🍽️ ¡Hora de comer! Usaste 12 raciones y recuperaste fuerzas.';
        actionSuccess = true;
      }
      break;

    case 'power_core':
      if (actionType === 'clean_panels') {
        if (res.energy < 10) {
          sounds.playAlert();
          return { nextState: state, bubble: '¡El rover necesita 10 de Energía de batería para salir!' };
        }
        if (next.robot.battery < 25) {
          sounds.playAlert();
          return { nextState: state, bubble: 'El rover necesita recargar su batería antes de salir.' };
        }
        res.energy = clamp(res.energy - 10);
        next.robot.battery = clamp(next.robot.battery - 25);
        next.dust = 0;
        next.roverTask = 'cleaning';
        sounds.playRover();
        bubbleMessage = '🚜 ¡Rover en marcha! Limpió todo el polvo rojo de los paneles solares.';
        unlockedMissionId = 'm_clean';
        actionSuccess = true;
      } else if (actionType === 'emergency_power') {
        if (next.activeCrisis?.resource !== 'energy') {
          sounds.playAlert();
          return { nextState: state, bubble: 'La batería de emergencia solo se usa cuando la energía llega a cero.' };
        }
        if (next.robot.battery < 20) {
          sounds.playAlert();
          return { nextState: state, bubble: 'El rover no tiene carga suficiente para compartir energía.' };
        }
        res.energy = clamp(res.energy + 18);
        next.robot.battery = clamp(next.robot.battery - 20);
        bubbleMessage = '🔋 ¡El rover compartió su batería! Recuperaste 18% de energía.';
        actionSuccess = true;
      } else if (actionType === 'night_saver') {
        next.isNight = !next.isNight;
        sounds.playClick();
        bubbleMessage = next.isNight
          ? '🌙 Modo Ahorro Nocturno activado: Gastaremos la mitad de electricidad.'
          : '☀️ Modo Día normal activado: Toda la base iluminada.';
        actionSuccess = true;
      }
      break;

    case 'life_support':
      if (actionType === 'moxie') {
        if (res.energy < 12) {
          sounds.playAlert();
          return { nextState: state, bubble: '¡MOXIE necesita 12 de Energía para calentar el aire de Marte!' };
        }
        res.energy = clamp(res.energy - 12);
        res.oxygen = clamp(res.oxygen + 18);
        res.co2 = clamp(res.co2 - 4);
        sounds.playPower();
        bubbleMessage = 'O₂ ¡MOXIE funcionó! Fabricaste +18 de oxígeno para el explorador.';
        unlockedMissionId = 'm_moxie';
        actionSuccess = true;
      } else if (actionType === 'recycle_water') {
        if (res.energy < 8) {
          sounds.playAlert();
          return { nextState: state, bubble: '¡Las bombas del reciclador ECLSS necesitan 8 de Energía!' };
        }
        res.energy = clamp(res.energy - 8);
        res.water = clamp(res.water + 16);
        sounds.playWater();
        bubbleMessage = '💧 ¡Agua purificada con éxito! Recuperaste +16 de Agua limpia.';
        unlockedMissionId = 'm_recycle';
        actionSuccess = true;
      } else if (actionType === 'scrub_co2') {
        if (res.energy < 4) {
          sounds.playAlert();
          return { nextState: state, bubble: '¡Falta 4 de Energía para limpiar los filtros de aire!' };
        }
        res.energy = clamp(res.energy - 4);
        res.co2 = clamp(res.co2 - 12);
        sounds.playClick();
        bubbleMessage = '🍃 ¡Filtros renovados! El aire dentro de la base vuelve a estar fresco.';
        actionSuccess = true;
      }
      break;

    case 'shield_system':
      if (actionType === 'toggle_bunker') {
        if (
          next.bunkerActive
          && next.activeHazard?.type === 'solar_radiation'
          && next.activeHazard.remainingSols > 0
        ) {
          sounds.playAlert();
          return {
            nextState: state,
            bubble: 'La tormenta solar sigue activa. Mantén cerrado el búnker hasta que pase.'
          };
        }
        if (res.energy < 6 && !next.bunkerActive) {
          sounds.playAlert();
          return { nextState: state, bubble: '¡Necesitas 6 de Energía para cerrar la puerta del búnker!' };
        }
        if (!next.bunkerActive) {
          res.energy = clamp(res.energy - 6);
          next.bunkerActive = true;
          next.shield = clamp(next.shield + 20);
          sounds.playClick();
          bubbleMessage = '🛡️ ¡Al búnker! La tierra marciana protege al explorador.';
          unlockedMissionId = 'm_bunker';
        } else {
          next.bunkerActive = false;
          sounds.playClick();
          bubbleMessage = '🔓 ¡Búnker abierto! Ya pueden volver a caminar por la base.';
        }
        actionSuccess = true;
      } else if (actionType === 'eva_expedition') {
        if (res.oxygen < 6 || res.water < 6) {
          sounds.playAlert();
          return { nextState: state, bubble: '¡Los trajes espaciales necesitan 6 de Oxígeno y 6 de Agua!' };
        }
        res.oxygen = clamp(res.oxygen - 6);
        res.water = clamp(res.water - 6);
        res.energy = clamp(res.energy - 5);
        next.scienceProgress = clamp(next.scienceProgress + 18, 0, 200);
        sounds.playRover();
        bubbleMessage = '🥾 ¡Exploración completada! Encontraron rocas del antiguo lago de Jezero (+18 Ciencia).';
        unlockedMissionId = 'm_eva';
        actionSuccess = true;
      } else if (actionType === 'reinforce_regolith') {
        if (res.energy < 8) {
          sounds.playAlert();
          return { nextState: state, bubble: '¡Se necesita 8 de Energía para mover la tierra marciana!' };
        }
        res.energy = clamp(res.energy - 8);
        next.shield = clamp(next.shield + 15);
        sounds.playClick();
        bubbleMessage = '🧱 ¡Escudo reforzado! Agregaste más tierra marciana protectora (+15 Escudo).';
        unlockedMissionId = 'm_bunker';
        actionSuccess = true;
      }
      break;

    case 'mission_control':
      if (actionType === 'ask_earth') {
        sounds.playBlip();
        next.earthComms.push({
          sol: next.sol,
          sender: `Comandante ${next.cadetName}`,
          subject: `Reporte Sol ${next.sol}`,
          text: payload.question || 'Todo bajo control en el cráter Jezero, Houston.',
          latencyMin: 14.2
        });
        bubbleMessage = '📡 ¡Mensaje enviado a la Tierra! Tardará 14 minutos en llegar por la distancia.';
        unlockedMissionId = 'm_comms';
        actionSuccess = true;
      }
      break;

    default:
      break;
  }

  if (actionSuccess) {
    if (next.actionsRemaining > 0) {
      next.actionsRemaining -= 1;
    } else {
      next.activeCrisis.emergencyOrderUsed = true;
    }
    let missionBanner = null;
    if (unlockedMissionId) {
      missionBanner = checkAndUnlockMission(next, unlockedMissionId);
    }
    next.log.push(`Sol 0${next.sol}: ${bubbleMessage}`);
    return {
      nextState: reconcileResourceCrisis(next),
      bubble: missionBanner || bubbleMessage
    };
  }

  return { nextState: state, bubble: null };
}

export function getDailyResourceChanges(state) {
  const dustFactor = state.dust / 100;
  const stormFactor = state.activeHazard?.type === 'dust_storm' ? 0.65 : 1;
  const solarGeneration = Math.round(28 * (1 - dustFactor * 0.7) * stormFactor);
  const basePowerDraw = state.isNight ? 8 : 16;
  const systemsHavePower = state.resources.energy >= 10;

  return {
    energy: solarGeneration - basePowerDraw,
    water: systemsHavePower ? -8 : -10,
    oxygen: systemsHavePower ? -7 : -10,
    food: 0,
    hunger: -18,
    co2: systemsHavePower ? 5 : 10,
    dust: 5,
    solarGeneration,
    basePowerDraw
  };
}

function getCrewHealthChange(resources, hunger) {
  const vitalAtZero = resources.energy <= 0
    || resources.water <= 0
    || resources.oxygen <= 0
    || hunger <= 0;
  if (vitalAtZero || resources.co2 >= 60) return -20;

  const systemAtRisk = resources.energy < 15
    || resources.water < 20
    || resources.oxygen < 20
    || hunger < 20
    || resources.co2 > 25;
  return systemAtRisk ? -10 : 3;
}

function getRadiationImpact(state) {
  if (state.activeHazard?.type !== 'solar_radiation' || state.bunkerActive) {
    return { dose: state.radiationDose || 0, healthLoss: 0 };
  }

  const doseIncrease = Math.max(8, Math.ceil((100 - state.shield) / 5));
  const dose = clamp((state.radiationDose || 0) + doseIncrease);
  const healthLoss = dose >= 40 ? 16 : dose >= 20 ? 10 : 5;
  return { dose, healthLoss };
}

export function getNextSolForecast(state) {
  if (state.gameOver || state.victory || state.sol >= state.totalSols) return null;

  const dailyChanges = getDailyResourceChanges(state);
  const projectedResources = {
    energy: clamp(state.resources.energy + dailyChanges.energy),
    water: clamp(state.resources.water + dailyChanges.water),
    oxygen: clamp(state.resources.oxygen + dailyChanges.oxygen),
    food: clamp(state.resources.food + dailyChanges.food),
    co2: clamp(state.resources.co2 + dailyChanges.co2),
    dust: clamp(state.dust + dailyChanges.dust),
    hunger: clamp(state.hunger + dailyChanges.hunger)
  };
  let waterRemaining = projectedResources.water;
  let cropReadyCount = 0;
  (state.cropPlots || []).forEach((plot) => {
    if (!plot.planted || plot.stage >= 3 || waterRemaining < 2) return;
    waterRemaining -= 2;
    if (plot.solsToHarvest <= 1) cropReadyCount += 1;
  });
  projectedResources.water = clamp(waterRemaining);
  const projectedHunger = projectedResources.hunger;

  const radiationImpact = getRadiationImpact(state);
  const projectedCrewHealth = clamp(
    state.crew.health + getCrewHealthChange(projectedResources, projectedHunger) - radiationImpact.healthLoss
  );
  const survivalRisk = projectedCrewHealth <= 0;
  const lastMessage = state.earthComms[state.earthComms.length - 1];
  const earthReplyPending = Boolean(
    lastMessage
    && lastMessage.sender.startsWith('Comandante')
    && lastMessage.sol === state.sol
  );
  const currentResources = {
    ...state.resources,
    dust: state.dust,
    hunger: state.hunger
  };
  const resourceDeltas = Object.fromEntries(
    Object.keys(projectedResources).map((key) => [
      key,
      projectedResources[key] - currentResources[key]
    ])
  );

  return {
    nextSol: state.sol + 1,
    solarGeneration: dailyChanges.solarGeneration,
    basePowerDraw: dailyChanges.basePowerDraw,
    projectedResources,
    resourceDeltas,
    projectedCrewHealth,
    projectedHunger,
    projectedRadiationDose: radiationImpact.dose,
    cropHarvest: cropReadyCount > 0,
    cropReadyCount,
    earthReplyPending,
    survivalRisk,
    upcomingEvent: survivalRisk ? null : SOL_EVENTS[state.sol] || null
  };
}

export function advanceSolState(state) {
  if (state.gameOver || state.victory || state.activeCrisis) {
    return { nextState: state, nextEvent: null, bubble: null };
  }

  const next = JSON.parse(JSON.stringify(state));
  const res = next.resources;

  const dailyChanges = getDailyResourceChanges(state);
  res.energy = clamp(res.energy + dailyChanges.energy);

  // Daily consumption
  res.water = clamp(res.water + dailyChanges.water);
  res.oxygen = clamp(res.oxygen + dailyChanges.oxygen);
  res.food = clamp(res.food + dailyChanges.food);
  res.co2 = clamp(res.co2 + dailyChanges.co2);
  next.hunger = clamp(next.hunger + dailyChanges.hunger);

  // Dust settles on panels
  next.dust = clamp(next.dust + dailyChanges.dust);
  next.robot.battery = clamp(next.robot.battery + 15);
  next.roverTask = null;

  // Crop progress
  let cropBubble = null;
  const cropPlots = next.cropPlots.map((plot, index) => {
    if (!plot.planted || plot.stage >= 3) return plot;
    if (res.water >= 2) {
      res.water = clamp(res.water - 2);
      const solsToHarvest = Math.max(0, plot.solsToHarvest - 1);
      const stage = solsToHarvest <= 0 ? 3 : solsToHarvest === 1 ? 2 : 1;
      if (stage === 3 && !cropBubble) {
        cropBubble = `🌱 ¡La parcela ${index + 1} está lista! Ve al huerto para cosecharla.`;
      }
      return { ...plot, stage, solsToHarvest, drySols: 0 };
    }

    const drySols = (plot.drySols || 0) + 1;
    if (drySols >= 2) {
      if (!cropBubble) cropBubble = `🥀 La planta de la parcela ${index + 1} se secó por falta de agua.`;
      return {
        ...plot,
        cropType: null,
        planted: false,
        stage: 0,
        solsToHarvest: 0,
        drySols: 0
      };
    }
    if (!cropBubble) cropBubble = `💧 La parcela ${index + 1} necesita agua o la planta se secará.`;
    return { ...plot, drySols };
  });
  next.cropPlots = cropPlots;

  // Earth auto-reply if cadet sent message on previous sol
  const lastMsg = next.earthComms[next.earthComms.length - 1];
  if (lastMsg && lastMsg.sender.startsWith('Comandante') && lastMsg.sol === next.sol) {
    next.earthComms.push({
      sol: next.sol + 1,
      sender: 'Control en Houston',
      subject: 'Respuesta de la Tierra',
      text: `¡Mensaje recibido, ${next.cadetName}! La NASA dice: ¡sigue cuidando la energía y el agua!`,
      latencyMin: 14.2
    });
  }

  next.actionsRemaining = next.maxActionsPerSol;
  next.sol += 1;

  const healthChange = getCrewHealthChange(res, next.hunger);
  next.crew.health = clamp(next.crew.health + healthChange);
  const radiationImpact = getRadiationImpact(state);
  next.radiationDose = radiationImpact.dose;
  if (radiationImpact.healthLoss > 0) {
    next.crew.health = clamp(next.crew.health - radiationImpact.healthLoss);
    cropBubble = '☀️ ¡Radiación acumulada! El explorador perdió salud. Cierra el búnker.';
  } else if (state.activeHazard?.type === 'solar_radiation' && state.bunkerActive) {
    cropBubble = '🛡️ ¡El búnker de regolito protegió al explorador!';
  }

  if (state.activeHazard?.remainingSols > 1) {
    next.activeHazard = {
      ...state.activeHazard,
      remainingSols: state.activeHazard.remainingSols - 1
    };
  } else {
    next.activeHazard = null;
  }

  const crewAtRisk = healthChange < 0 || radiationImpact.healthLoss > 0;
  next.crew.status = next.crew.health <= 35
    ? 'Crítica'
    : crewAtRisk ? 'En Alerta' : 'Muy bien';

  if (next.crew.health <= 0) {
    next.gameOver = true;
    sounds.playAlert();
    return {
      nextState: next,
      nextEvent: null,
      bubble: '🚨 ¡La salud del explorador llegó a cero! Puedes activar el rescate una vez.'
    };
  }

  if (next.sol > next.totalSols) {
    next.sol = next.totalSols;
    next.victory = true;
    sounds.playVictory();
    return { nextState: next, nextEvent: null, bubble: '🏆 ¡Felicidades! Completaste los 7 Soles en Marte.' };
  }

  const nextEvent = SOL_EVENTS[next.sol - 1] || null;
  sounds.playAlert();

  return { nextState: next, nextEvent, bubble: cropBubble };
}

export function applyChoiceToState(state, choice, hazard = null) {
  if (state.gameOver || state.victory || !canIssueAction(state)) {
    sounds.playAlert();
    return state;
  }

  const next = JSON.parse(JSON.stringify(state));
  const res = next.resources;
  const eff = choice.effects || {};

  if (eff.energy) res.energy = clamp(res.energy + eff.energy);
  if (eff.water) res.water = clamp(res.water + eff.water);
  if (eff.oxygen) res.oxygen = clamp(res.oxygen + eff.oxygen);
  if (eff.co2) res.co2 = clamp(res.co2 + eff.co2);
  if (eff.food) res.food = clamp(res.food + eff.food);
  if (eff.shield) next.shield = clamp(next.shield + eff.shield);
  if (eff.dust) next.dust = clamp(next.dust + eff.dust);

  if (choice.scienceBoost) {
    next.scienceProgress = clamp(next.scienceProgress + choice.scienceBoost, 0, 200);
  }

  if (choice.actionTrigger === 'clean_panels') {
    next.roverTask = 'cleaning';
    next.dust = 0;
    next.robot.battery = clamp(next.robot.battery - 25);
  } else if (choice.actionTrigger === 'activate_bunker') {
    next.bunkerActive = true;
  }

  if (hazard === 'dust_storm') {
    next.activeHazard = { type: hazard, remainingSols: 1 };
  } else if (hazard === 'solar_radiation') {
    next.activeHazard = { type: hazard, remainingSols: 2 };
  }

  if (next.actionsRemaining > 0) {
    next.actionsRemaining -= 1;
  } else {
    next.activeCrisis.emergencyOrderUsed = true;
  }
  next.log.push(`Sol 0${next.sol}: ${choice.text}`);
  return reconcileResourceCrisis(next);
}

export function activateEmergencyRescue(state) {
  if (!state.gameOver || state.emergencyRescueUsed) return state;

  const next = JSON.parse(JSON.stringify(state));
  next.gameOver = false;
  next.emergencyRescueUsed = true;
  next.crew.health = 45;
  next.crew.status = 'En Alerta';
  next.resources.energy = Math.max(next.resources.energy, 25);
  next.resources.water = Math.max(next.resources.water, 25);
  next.resources.oxygen = Math.max(next.resources.oxygen, 25);
  next.resources.food = Math.max(next.resources.food, 25);
  next.resources.co2 = Math.min(next.resources.co2, 35);
  next.scienceProgress = clamp(next.scienceProgress - 25, 0, 200);
  next.actionsRemaining = next.maxActionsPerSol;
  if (next.activeHazard?.type === 'solar_radiation') next.bunkerActive = true;
  next.log.push(`Sol 0${next.sol}: Protocolo de rescate activado. Se usaron 25 puntos de ciencia.`);

  if (next.sol > next.totalSols) {
    next.sol = next.totalSols;
    next.victory = true;
  }

  return next;
}

export function generateReport(state) {
  const res = state.resources;
  const avgResource = Math.round((res.energy + res.water + res.oxygen + res.food + state.shield) / 5);
  const missionsDone = state.completedMissions ? state.completedMissions.length : 0;
  const rescuePenalty = state.emergencyRescueUsed ? 10 : 0;
  const totalScore = Math.max(
    0,
    Math.min(100, Math.round(avgResource * 0.6 + (missionsDone / 7) * 40) - rescuePenalty)
  );

  let rank = 'Ranger de Marte';
  if (totalScore >= 80) {
    rank = 'Comandante Supremo de Marte (Oro)';
  } else if (totalScore >= 60) {
    rank = 'Oficial de Misión Jezero (Plata)';
  } else {
    rank = 'Explorador Espacial (Bronce)';
  }

  const badges = [];
  if (res.energy >= 40) badges.push({ name: 'Maestro Solar' });
  if (res.water >= 40) badges.push({ name: 'Guardián del Agua' });
  if (res.oxygen >= 40) badges.push({ name: 'Ingeniero MOXIE' });
  if (res.food >= 35) badges.push({ name: 'Botánico de Marte' });
  if (state.shield >= 50) badges.push({ name: 'Escudo de Regolito' });
  if (missionsDone >= 4) badges.push({ name: 'Cumplidor de Misiones' });

  return {
    cadetName: state.cadetName,
    avgScore: totalScore,
    rank,
    badges,
    missionsDone,
    solReached: state.sol,
    crewHealth: state.crew.health
  };
}



