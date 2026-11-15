// MARS OUTPOST: Game State & Trade-off Simulation Logic
// Educational systems engineering made simple and rewarding for kids.

import { INITIAL_GAME_STATE, SOL_EVENTS, NASA_SOURCES } from './gameData.js';
import { sounds } from './audio.js';

export class GameEngine {
  constructor() {
    this.state = JSON.parse(JSON.stringify(INITIAL_GAME_STATE));
    this.currentEvent = null;
    this.roverAnim = { x: 50, targetX: 50, isMoving: false, task: null };
    this.speechBubble = null;
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify() {
    this.listeners.forEach(fn => fn(this.state));
  }

  clamp(val, min = 0, max = 100) {
    return Math.max(min, Math.min(max, Math.round(val)));
  }

  startMission(name) {
    this.state.cadetName = name || "Comandante Junior";
    this.state.sol = 1;
    this.state.isNight = false;
    this.currentEvent = SOL_EVENTS[0];
    sounds.playVictory();
    this.notify();
  }

  // --- Commander Tactical Actions ---

  plantCrops() {
    if (this.state.resources.water < 10 || this.state.resources.energy < 8) {
      sounds.playAlert();
      this.showBubble("¡Necesitamos al menos 10 de Agua y 8 de Energía para sembrar!");
      return false;
    }
    this.state.resources.water = this.clamp(this.state.resources.water - 10);
    this.state.resources.energy = this.clamp(this.state.resources.energy - 8);
    this.state.crops.planted = true;
    this.state.crops.stage = 1; // Sprouts
    this.state.crops.solsToHarvest = 2;
    sounds.playWater();
    this.showBubble("¡Semillas sembradas en el Agrodome! Crecerán en 2 Soles.");
    this.notify();
    return true;
  }

  cleanPanelsWithRover() {
    if (this.state.resources.energy < 10) {
      sounds.playAlert();
      this.showBubble("¡El rover necesita al menos 10 de Energía en baterías para salir!");
      return false;
    }
    this.state.resources.energy = this.clamp(this.state.resources.energy - 10);
    this.state.resources.dust = 0; // Completely clean!
    this.roverAnim.targetX = 640; // Drive to panels
    this.roverAnim.isMoving = true;
    this.roverAnim.task = "cleaning";
    sounds.playRover();
    this.showBubble("¡Rover en camino! Cepillando el polvo de los paneles.");
    this.notify();
    return true;
  }

  activateMoxie() {
    if (this.state.resources.energy < 12) {
      sounds.playAlert();
      this.showBubble("¡MOXIE necesita 12 de Energía eléctrica para calentar el CO2!");
      return false;
    }
    this.state.resources.energy = this.clamp(this.state.resources.energy - 12);
    this.state.resources.oxygen = this.clamp(this.state.resources.oxygen + 18);
    sounds.playPower();
    this.showBubble("¡MOXIE encendido! Generados +18 de Oxígeno puro.");
    this.notify();
    return true;
  }

  recycleWater() {
    if (this.state.resources.energy < 8) {
      sounds.playAlert();
      this.showBubble("¡El reciclador ECLSS necesita 8 de Energía para las bombas!");
      return false;
    }
    this.state.resources.energy = this.clamp(this.state.resources.energy - 8);
    this.state.resources.water = this.clamp(this.state.resources.water + 16);
    sounds.playWater();
    this.showBubble("¡Reciclador ECLSS purificó +16 de Agua limpia!");
    this.notify();
    return true;
  }

  shelterInBunker() {
    if (this.state.resources.energy < 6) {
      sounds.playAlert();
      this.showBubble("¡El búnker subterráneo necesita 6 de Energía para sellarse!");
      return false;
    }
    this.state.resources.energy = this.clamp(this.state.resources.energy - 6);
    this.state.resources.shield = this.clamp(this.state.resources.shield + 20);
    sounds.playClick();
    this.showBubble("¡Escudo reforzado con regolito! Protección +20.");
    this.notify();
    return true;
  }

  sendEarthMessage() {
    this.state.earthResponsePending = true;
    sounds.playBlip();
    this.showBubble("📡 Mensaje enviado a la Tierra. Por la distancia de 200 millones de km, la señal tarda 20 min. ¡Llegará al próximo Sol!");
    this.notify();
  }

  // --- Turn Progression (Sol Loop) ---

  advanceSol() {
    if (this.state.gameOver || this.state.victory) return;

    sounds.playBlip();

    // 1. Natural daily consumption
    const dustPenalty = this.state.resources.dust / 100;
    const solarGeneration = Math.round(25 * (1 - dustPenalty * 0.7));
    const baseEnergyCost = 15;
    
    // Net energy change
    this.state.resources.energy = this.clamp(this.state.resources.energy + (solarGeneration - baseEnergyCost));

    // Daily water & oxygen consumption
    this.state.resources.water = this.clamp(this.state.resources.water - 8);
    this.state.resources.oxygen = this.clamp(this.state.resources.oxygen - 6);
    this.state.resources.food = this.clamp(this.state.resources.food - 6);

    // Natural dust accumulation (+4% per Sol)
    this.state.resources.dust = this.clamp(this.state.resources.dust + 4);

    // Crop growth progress
    if (this.state.crops.planted) {
      this.state.crops.solsToHarvest -= 1;
      if (this.state.crops.solsToHarvest === 1) {
        this.state.crops.stage = 2; // Lush plant
      } else if (this.state.crops.solsToHarvest <= 0) {
        // Harvest ready!
        this.state.crops.stage = 3;
        this.state.resources.food = this.clamp(this.state.resources.food + 25);
        this.state.resources.oxygen = this.clamp(this.state.resources.oxygen + 8);
        this.state.crops.planted = false;
        sounds.playHarvest();
        this.showBubble("🎉 ¡Cosecha lista en el Agrodome! +25 Alimentos y +8 Oxígeno.");
      }
    }

    // Advance to next Sol
    this.state.sol += 1;

    // Check Victory (End of Sol 7)
    if (this.state.sol > this.state.maxSols) {
      this.state.sol = 7;
      this.state.victory = true;
      sounds.playVictory();
      this.notify();
      return;
    }

    // Check Emergency GameOver
    if (this.state.resources.oxygen <= 0 || this.state.resources.water <= 0 || this.state.resources.energy <= 0) {
      this.state.gameOver = true;
      sounds.playAlert();
      this.notify();
      return;
    }

    // Trigger Day's Event
    const eventIndex = this.state.sol - 1;
    if (eventIndex < SOL_EVENTS.length) {
      this.currentEvent = SOL_EVENTS[eventIndex];
      sounds.playAlert();
    }

    this.notify();
  }

  applyEventChoice(choice) {
    if (!choice) return;

    sounds.playClick();
    const eff = choice.effects;
    const res = this.state.resources;

    if (eff.energy) res.energy = this.clamp(res.energy + eff.energy);
    if (eff.water) res.water = this.clamp(res.water + eff.water);
    if (eff.oxygen) res.oxygen = this.clamp(res.oxygen + eff.oxygen);
    if (eff.food) res.food = this.clamp(res.food + eff.food);
    if (eff.shield) res.shield = this.clamp(res.shield + eff.shield);
    if (eff.dust) res.dust = this.clamp(res.dust + eff.dust);

    // Save decision in history
    this.state.decisionsHistory.push({
      sol: this.state.sol,
      eventTitle: this.currentEvent ? this.currentEvent.title : "Evento",
      choiceText: choice.text
    });

    this.currentEvent = null; // Close event modal
    this.notify();
  }

  showBubble(text, duration = 4500) {
    this.speechBubble = { text, timer: Date.now() + duration };
    this.notify();
  }

  getMissionReport() {
    const res = this.state.resources;
    const avgScore = Math.round((res.energy + res.water + res.oxygen + res.food + res.shield) / 5);

    let rank = "Cadete Espacial Junior";
    let titleBadge = "Insignia de Explorador";
    if (avgScore >= 75) {
      rank = "Comandante Supremo de Marte (Rango Oro)";
      titleBadge = "Medalla al Mérito Espacial";
    } else if (avgScore >= 55) {
      rank = "Oficial de Sistemas del Cráter Jezero (Rango Plata)";
      titleBadge = "Medalla de Supervivencia";
    }

    const badges = [];
    if (res.energy >= 40) badges.push({ name: "Maestro Solar", desc: "Gestionaste el polvo marciano y la energía con éxito." });
    if (res.water >= 30) badges.push({ name: "Guardián del Agua", desc: "Cuidaste cada gota usando reciclaje ECLSS." });
    if (res.oxygen >= 40) badges.push({ name: "Pionero MOXIE", desc: "Mantuviste el aire respirable en Jezero." });
    if (res.food >= 35) badges.push({ name: "Botánico de Marte", desc: "Cosechaste alimentos frescos en el Agrodome." });
    if (res.shield >= 50) badges.push({ name: "Escudo Inquebrantable", desc: "Protegiste a la tripulación de la radiación." });

    return {
      cadetName: this.state.cadetName,
      avgScore,
      rank,
      titleBadge,
      badges,
      solCompleted: 7
    };
  }

  restart() {
    this.state = JSON.parse(JSON.stringify(INITIAL_GAME_STATE));
    this.currentEvent = null;
    this.speechBubble = null;
    sounds.playVictory();
    this.notify();
  }
}
