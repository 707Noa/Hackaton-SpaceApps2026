// MARS OUTPOST: Core Simulation, Missions & Trade-off Engine
// Tailored for Junior Astronauts (7-12 years old)

import { SOL_EVENTS, MISSIONS_LIST } from '../data/gameData';
import { sounds } from './audioService';

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

export function advanceSolState(state) {
  const next = JSON.parse(JSON.stringify(state));
  const res = next.resources;

  // Solar power generation reduced by MEDA dust
  const dustFactor = next.dust / 100;
  const solarGen = Math.round(28 * (1 - dustFactor * 0.7));
  const basePowerDraw = next.isNight ? 8 : 16;
  res.energy = clamp(res.energy + (solarGen - basePowerDraw));

  // Daily consumption
  res.water = clamp(res.water - 8);
  res.oxygen = clamp(res.oxygen - 7);
  res.food = clamp(res.food - 7);
  res.co2 = clamp(res.co2 + 5);

  // Dust settles on panels
  next.dust = clamp(next.dust + 5);

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

  // Crew health update
  if (res.oxygen < 20 || res.water < 20 || res.energy < 15 || res.co2 > 25) {
    next.crew.health = clamp(next.crew.health - 15);
    next.crew.status = 'En Alerta';
  } else {
    next.crew.health = clamp(next.crew.health + 5);
    next.crew.status = 'Muy bien';
  }

  if (res.oxygen <= 0 || res.water <= 0 || res.energy <= 0 || next.crew.health <= 0) {
    next.gameOver = true;
    sounds.playAlert();
    return { nextState: next, nextEvent: null, bubble: '⚠️ ¡Alerta! Un recurso vital llegó a cero.' };
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

export function applyChoiceToState(state, choice) {
  const next = JSON.parse(JSON.stringify(state));
  const res = next.resources;
  const eff = choice.effects || {};

  if (eff.energy) res.energy = clamp(res.energy + eff.energy);
  if (eff.water) res.water = clamp(res.water + eff.water);
  if (eff.oxygen) res.oxygen = clamp(res.oxygen + eff.oxygen);
  if (eff.co2) res.co2 = clamp(res.co2 + eff.co2);
  if (eff.food) res.food = clamp(res.food + eff.food);
  if (eff.shield) res.shield = clamp(res.shield + eff.shield);
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

  next.log.push(`Sol 0${next.sol}: ${choice.text}`);
  return next;
}

export function generateReport(state) {
  const res = state.resources;
  const avgResource = Math.round((res.energy + res.water + res.oxygen + res.food + state.shield) / 5);
  const missionsDone = state.completedMissions ? state.completedMissions.length : 0;
  const totalScore = Math.min(100, Math.round(avgResource * 0.6 + (missionsDone / 7) * 40));

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
