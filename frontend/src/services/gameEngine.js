// MARS OUTPOST: Core Simulation, Missions & Trade-off Engine
// Tailored for Junior Astronauts (7-12 years old)

import { SOL_EVENTS, MISSIONS_LIST } from '../data/gameData.js';
import { sounds } from './audioService.js';

export function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(val)));
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

  if (next.actionsRemaining <= 0) {
    sounds.playAlert();
    return {
      nextState: state,
      bubble: '¡Ya usaste tus 2 acciones de hoy! Presiona "Siguiente Sol" para avanzar al nuevo día.'
    };
  }

  let actionSuccess = false;
  let bubbleMessage = '';
  let unlockedMissionId = null;

  switch (moduleName) {
    case 'agrodome':
      if (actionType === 'plant') {
        if (res.water < 8 || res.energy < 6) {
          sounds.playAlert();
          return { nextState: state, bubble: '¡Faltan recursos! Necesitas 8 de Agua y 6 de Energía para sembrar.' };
        }
        res.water = clamp(res.water - 8);
        res.energy = clamp(res.energy - 6);
        next.crops.planted = true;
        next.crops.stage = 1;
        next.crops.solsToHarvest = 2;
        next.crops.cropType = payload.cropType || 'veggie_lettuce';
        sounds.playWater();
        bubbleMessage = '🌱 ¡Sembraste Lechuga Espacial! Estará lista para cosechar en 2 Soles.';
        unlockedMissionId = 'm_plant';
        actionSuccess = true;
      } else if (actionType === 'harvest') {
        if (next.crops.stage < 3) {
          sounds.playAlert();
          return { nextState: state, bubble: 'Las plantas todavía están creciendo. ¡Espera un poco más!' };
        }
        res.food = clamp(res.food + 25);
        res.oxygen = clamp(res.oxygen + 6);
        next.crops.planted = false;
        next.crops.stage = 0;
        next.crops.solsToHarvest = 0;
        sounds.playHarvest();
        bubbleMessage = '🎉 ¡Gran cosecha! Ganaste +25 Comida y +6 Oxígeno fresco.';
        actionSuccess = true;
      } else if (actionType === 'boost_light') {
        if (res.energy < 5) {
          sounds.playAlert();
          return { nextState: state, bubble: '¡Necesitas 5 de Energía para encender las luces LED!' };
        }
        res.energy = clamp(res.energy - 5);
        if (next.crops.planted && next.crops.solsToHarvest > 1) {
          next.crops.solsToHarvest = 1;
          next.crops.stage = 2;
        }
        sounds.playPower();
        bubbleMessage = '💡 ¡Luces LED encendidas! Tus lechugas crecerán mucho más rápido.';
        actionSuccess = true;
      }
      break;

    case 'power_core':
      if (actionType === 'clean_panels') {
        if (res.energy < 10) {
          sounds.playAlert();
          return { nextState: state, bubble: '¡El rover necesita 10 de Energía de batería para salir!' };
        }
        res.energy = clamp(res.energy - 10);
        next.dust = 0;
        next.roverTask = 'cleaning';
        sounds.playRover();
        bubbleMessage = '🚜 ¡Rover en marcha! Limpió todo el polvo rojo de los paneles solares.';
        unlockedMissionId = 'm_clean';
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
        bubbleMessage = '🫁 ¡MOXIE funcionó! Fabricaste +18 de Oxígeno puro para la tripulación.';
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
          bubbleMessage = '🛡️ ¡Todos en el Búnker! La tierra roja de Marte protege a los astronautas.';
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
    next.actionsRemaining -= 1;
    let missionBanner = null;
    if (unlockedMissionId) {
      missionBanner = checkAndUnlockMission(next, unlockedMissionId);
    }
    next.log.push(`Sol 0${next.sol}: ${bubbleMessage}`);
    return {
      nextState: next,
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
    food: -7,
    co2: systemsHavePower ? 5 : 10,
    dust: 5,
    solarGeneration,
    basePowerDraw
  };
}

function getCrewHealthChange(resources) {
  const vitalAtZero = resources.energy <= 0
    || resources.water <= 0
    || resources.oxygen <= 0
    || resources.food <= 0;
  if (vitalAtZero || resources.co2 >= 60) return -20;

  const systemAtRisk = resources.energy < 15
    || resources.water < 20
    || resources.oxygen < 20
    || resources.food < 20
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
    dust: clamp(state.dust + dailyChanges.dust)
  };
  const cropHarvest = state.crops.planted && state.crops.solsToHarvest <= 1;

  if (cropHarvest) {
    projectedResources.food = clamp(projectedResources.food + 25);
    projectedResources.oxygen = clamp(projectedResources.oxygen + 6);
  }

  const radiationImpact = getRadiationImpact(state);
  const projectedCrewHealth = clamp(
    state.crew.health + getCrewHealthChange(projectedResources) - radiationImpact.healthLoss
  );
  const survivalRisk = projectedCrewHealth <= 0;
  const lastMessage = state.earthComms[state.earthComms.length - 1];
  const earthReplyPending = Boolean(
    lastMessage
    && lastMessage.sender.startsWith('Comandante')
    && lastMessage.sol === state.sol
  );
  const currentResources = { ...state.resources, dust: state.dust };
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
    projectedRadiationDose: radiationImpact.dose,
    cropHarvest,
    earthReplyPending,
    survivalRisk,
    upcomingEvent: survivalRisk ? null : SOL_EVENTS[state.sol] || null
  };
}

export function advanceSolState(state) {
  if (state.gameOver || state.victory) {
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

  // Dust settles on panels
  next.dust = clamp(next.dust + dailyChanges.dust);

  // Crop progress
  let cropBubble = null;
  if (next.crops.planted) {
    next.crops.solsToHarvest -= 1;
    if (next.crops.solsToHarvest === 1) {
      next.crops.stage = 2;
    } else if (next.crops.solsToHarvest <= 0) {
      next.crops.stage = 3;
      res.food = clamp(res.food + 25);
      res.oxygen = clamp(res.oxygen + 6);
      next.crops.planted = false;
      sounds.playHarvest();
      cropBubble = '🎉 ¡Tus lechugas crecieron! Cosechaste +25 Comida y +6 Oxígeno.';
    }
  }

  // Earth auto-reply if cadet sent message on previous sol
  const lastMsg = next.earthComms[next.earthComms.length - 1];
  if (lastMsg && lastMsg.sender.startsWith('Comandante') && lastMsg.sol === next.sol) {
    next.earthComms.push({
      sol: next.sol + 1,
      sender: 'Control en Houston',
      subject: 'Respuesta de la Tierra',
      text: `¡Recibido Comandante ${next.cadetName}! Los ingenieros de la NASA revisaron tu mensaje. ¡Sigue cuidando el equilibrio entre energía y agua!`,
      latencyMin: 14.2
    });
  }

  next.actionsRemaining = next.maxActionsPerSol;
  next.sol += 1;

  const healthChange = getCrewHealthChange(res);
  next.crew.health = clamp(next.crew.health + healthChange);
  const radiationImpact = getRadiationImpact(state);
  next.radiationDose = radiationImpact.dose;
  if (radiationImpact.healthLoss > 0) {
    next.crew.health = clamp(next.crew.health - radiationImpact.healthLoss);
    cropBubble = '☀️ ¡Radiación acumulada! La tripulación perdió salud. Cierra el búnker para el próximo Sol.';
  } else if (state.activeHazard?.type === 'solar_radiation' && state.bunkerActive) {
    cropBubble = '🛡️ ¡El búnker de regolito protegió a toda la tripulación!';
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
      bubble: '🚨 ¡La salud de la tripulación llegó a cero! Puedes activar el rescate de emergencia una vez.'
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
  } else if (choice.actionTrigger === 'activate_bunker') {
    next.bunkerActive = true;
  }

  if (hazard === 'dust_storm') {
    next.activeHazard = { type: hazard, remainingSols: 1 };
  } else if (hazard === 'solar_radiation') {
    next.activeHazard = { type: hazard, remainingSols: 2 };
  }

  next.log.push(`Sol 0${next.sol}: ${choice.text}`);
  return next;
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

  let rank = 'Cadete Espacial Junior';
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
