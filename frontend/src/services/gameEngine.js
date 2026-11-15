// MARS OUTPOST: Game State Engine & Calculation Logic for React

import { INITIAL_RESOURCES, SOL_EVENTS } from '../data/gameData';
import { sounds } from './audioService';

export function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(val)));
}

export function executeAction(state, actionType) {
  const next = JSON.parse(JSON.stringify(state));
  const res = next.resources;

  switch (actionType) {
    case 'plant':
      if (res.water < 10 || res.energy < 8) {
        sounds.playAlert();
        return { nextState: state, bubble: '¡Necesitamos al menos 10 de Agua y 8 de Energía para sembrar!' };
      }
      res.water = clamp(res.water - 10);
      res.energy = clamp(res.energy - 8);
      next.crops.planted = true;
      next.crops.stage = 1;
      next.crops.solsToHarvest = 2;
      sounds.playWater();
      return { nextState: next, bubble: '¡Semillas sembradas en el Agrodome! Crecerán en 2 Soles.' };

    case 'clean':
      if (res.energy < 10) {
        sounds.playAlert();
        return { nextState: state, bubble: '¡El rover necesita al menos 10 de Energía en baterías para salir!' };
      }
      res.energy = clamp(res.energy - 10);
      res.dust = 0;
      next.roverTask = 'cleaning';
      sounds.playRover();
      return { nextState: next, bubble: '¡Rover en camino! Cepillando el polvo de los paneles.' };

    case 'moxie':
      if (res.energy < 12) {
        sounds.playAlert();
        return { nextState: state, bubble: '¡MOXIE necesita 12 de Energía eléctrica para calentar el CO2!' };
      }
      res.energy = clamp(res.energy - 12);
      res.oxygen = clamp(res.oxygen + 18);
      sounds.playPower();
      return { nextState: next, bubble: '¡MOXIE encendido! Generados +18 de Oxígeno puro.' };

    case 'recycle':
      if (res.energy < 8) {
        sounds.playAlert();
        return { nextState: state, bubble: '¡El reciclador ECLSS necesita 8 de Energía para las bombas!' };
      }
      res.energy = clamp(res.energy - 8);
      res.water = clamp(res.water + 16);
      sounds.playWater();
      return { nextState: next, bubble: '¡Reciclador ECLSS purificó +16 de Agua limpia!' };

    case 'bunker':
      if (res.energy < 6) {
        sounds.playAlert();
        return { nextState: state, bubble: '¡El búnker subterráneo necesita 6 de Energía para sellarse!' };
      }
      res.energy = clamp(res.energy - 6);
      res.shield = clamp(res.shield + 20);
      sounds.playClick();
      return { nextState: next, bubble: '¡Escudo reforzado con regolito! Protección +20.' };

    case 'comms':
      sounds.playBlip();
      return { nextState: state, bubble: '📡 Mensaje enviado a la Tierra. Por la distancia de 200 millones de km, la señal tarda 20 min. ¡Llegará al próximo Sol!' };

    default:
      return { nextState: state, bubble: null };
  }
}

export function advanceSolState(state) {
  const next = JSON.parse(JSON.stringify(state));
  const res = next.resources;

  // Solar generation reduced by dust
  const dustPenalty = res.dust / 100;
  const solarGen = Math.round(25 * (1 - dustPenalty * 0.7));
  const baseCost = 15;
  res.energy = clamp(res.energy + (solarGen - baseCost));

  // Daily consumption
  res.water = clamp(res.water - 8);
  res.oxygen = clamp(res.oxygen - 6);
  res.food = clamp(res.food - 6);
  res.dust = clamp(res.dust + 4);

  let bubble = null;

  // Crops progress
  if (next.crops.planted) {
    next.crops.solsToHarvest -= 1;
    if (next.crops.solsToHarvest === 1) {
      next.crops.stage = 2;
    } else if (next.crops.solsToHarvest <= 0) {
      next.crops.stage = 3;
      res.food = clamp(res.food + 25);
      res.oxygen = clamp(res.oxygen + 8);
      next.crops.planted = false;
      sounds.playHarvest();
      bubble = '🎉 ¡Cosecha lista en el Agrodome! +25 Alimentos y +8 Oxígeno.';
    }
  }

  // Advance Sol
  next.sol += 1;

  // Check Game Over
  if (res.oxygen <= 0 || res.water <= 0 || res.energy <= 0) {
    next.gameOver = true;
    sounds.playAlert();
    return { nextState: next, nextEvent: null, bubble };
  }

  // Check Victory (End of Sol 7)
  if (next.sol > 7) {
    next.sol = 7;
    next.victory = true;
    sounds.playVictory();
    return { nextState: next, nextEvent: null, bubble };
  }

  // Next Event
  const nextEvent = SOL_EVENTS[next.sol - 1] || null;
  sounds.playAlert();

  return { nextState: next, nextEvent, bubble };
}

export function applyChoiceToState(state, choice) {
  const next = JSON.parse(JSON.stringify(state));
  const res = next.resources;
  const eff = choice.effects;

  if (eff.energy) res.energy = clamp(res.energy + eff.energy);
  if (eff.water) res.water = clamp(res.water + eff.water);
  if (eff.oxygen) res.oxygen = clamp(res.oxygen + eff.oxygen);
  if (eff.food) res.food = clamp(res.food + eff.food);
  if (eff.shield) res.shield = clamp(res.shield + eff.shield);
  if (eff.dust) res.dust = clamp(res.dust + eff.dust);

  if (choice.actionTrigger === 'clean_panels') {
    next.roverTask = 'cleaning';
  }

  return next;
}

export function generateReport(state) {
  const res = state.resources;
  const avgScore = Math.round((res.energy + res.water + res.oxygen + res.food + res.shield) / 5);

  let rank = "Cadete Espacial Junior";
  if (avgScore >= 75) {
    rank = "Comandante Supremo de Marte (Rango Oro)";
  } else if (avgScore >= 55) {
    rank = "Oficial de Sistemas del Cráter Jezero (Rango Plata)";
  }

  const badges = [];
  if (res.energy >= 40) badges.push({ name: "Maestro Solar" });
  if (res.water >= 30) badges.push({ name: "Guardián del Agua" });
  if (res.oxygen >= 40) badges.push({ name: "Pionero MOXIE" });
  if (res.food >= 35) badges.push({ name: "Botánico de Marte" });
  if (res.shield >= 50) badges.push({ name: "Escudo Inquebrantable" });

  return {
    cadetName: state.cadetName,
    avgScore,
    rank,
    badges
  };
}
