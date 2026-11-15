import test from 'node:test';
import assert from 'node:assert/strict';
import { findChallengeForAction, INITIAL_GAME_STATE, SOL_EVENTS } from '../data/gameData.js';
import {
  activateEmergencyRescue,
  advanceSolState,
  applyChoiceToState,
  beginResourceGrace,
  executeModuleAction,
  getNextSolForecast,
  prepareLaunchState,
  tickResourceGrace
} from './gameEngine.js';

function createState(overrides = {}) {
  return {
    ...JSON.parse(JSON.stringify(INITIAL_GAME_STATE)),
    ...overrides
  };
}

test('hunger depletion reduces health before ending the mission', () => {
  const state = createState({
    hunger: 0
  });

  const { nextState } = advanceSolState(state);

  assert.equal(nextState.gameOver, false);
  assert.ok(nextState.crew.health < state.crew.health);
  assert.equal(nextState.hunger, 0);
});

test('a power outage weakens life support and air filtering for the Sol', () => {
  const state = createState({
    resources: { ...INITIAL_GAME_STATE.resources, energy: 0 }
  });

  const { nextState } = advanceSolState(state);

  assert.equal(nextState.resources.oxygen, 80);
  assert.equal(nextState.resources.water, 70);
  assert.equal(nextState.resources.co2, 22);
});

test('health reaching zero ends the mission and enables one emergency rescue', () => {
  const state = createState({
    crew: { ...INITIAL_GAME_STATE.crew, health: 15 },
    resources: { ...INITIAL_GAME_STATE.resources, oxygen: 0 }
  });
  const failedState = advanceSolState(state).nextState;

  assert.equal(failedState.gameOver, true);

  const rescuedState = activateEmergencyRescue(failedState);

  assert.equal(rescuedState.gameOver, false);
  assert.equal(rescuedState.emergencyRescueUsed, true);
  assert.equal(rescuedState.crew.health, 45);
  assert.ok(rescuedState.resources.oxygen >= 25);
  assert.equal(activateEmergencyRescue(rescuedState), rescuedState);
});

test('an unprotected solar storm builds radiation dose, while the bunker prevents further exposure', () => {
  const state = createState({
    sol: 4,
    shield: 60,
    activeHazard: { type: 'solar_radiation', remainingSols: 2 },
    resources: { ...INITIAL_GAME_STATE.resources, energy: 100 }
  });
  const firstSol = advanceSolState(state).nextState;

  assert.ok(firstSol.radiationDose > 0);
  assert.ok(firstSol.crew.health < state.crew.health);
  assert.equal(firstSol.activeHazard.remainingSols, 1);
  assert.ok(getNextSolForecast(firstSol).projectedRadiationDose > firstSol.radiationDose);

  const sheltered = executeModuleAction(firstSol, 'shield_system', 'toggle_bunker').nextState;
  const secondSol = advanceSolState(sheltered).nextState;

  assert.equal(secondSol.radiationDose, firstSol.radiationDose);
  assert.equal(secondSol.activeHazard, null);
});

test('the dust storm lowers solar generation and ends after its Sol', () => {
  const stormState = createState({
    sol: 2,
    activeHazard: { type: 'dust_storm', remainingSols: 1 }
  });
  const forecast = getNextSolForecast(stormState);
  const clearForecast = getNextSolForecast({ ...stormState, activeHazard: null });
  const endedStorm = advanceSolState(stormState).nextState;

  assert.ok(forecast.solarGeneration < clearForecast.solarGeneration);
  assert.equal(endedStorm.activeHazard, null);
});

test('choosing the bunker event activates protection for the full radiation warning', () => {
  const eventState = createState({ sol: 4 });
  const nextState = applyChoiceToState(
    eventState,
    SOL_EVENTS[3].choices[0],
    SOL_EVENTS[3].hazard
  );

  assert.equal(nextState.bunkerActive, true);
  assert.equal(nextState.activeHazard.type, 'solar_radiation');
  assert.equal(nextState.activeHazard.remainingSols, 2);
  assert.equal(nextState.shield, 100);
  assert.equal(nextState.actionsRemaining, eventState.actionsRemaining - 1);

  const exposedState = applyChoiceToState(
    eventState,
    SOL_EVENTS[3].choices[1],
    SOL_EVENTS[3].hazard
  );
  assert.equal(exposedState.shield, 65);
});

test('a Sol event choice spends one order and cannot be applied without orders', () => {
  const choice = SOL_EVENTS[0].choices[0];
  const state = createState({ actionsRemaining: 1 });
  const selected = applyChoiceToState(state, choice, SOL_EVENTS[0].hazard);
  const rejected = applyChoiceToState({ ...state, actionsRemaining: 0 }, choice);

  assert.equal(selected.actionsRemaining, 0);
  assert.notEqual(selected, state);
  assert.equal(rejected.actionsRemaining, 0);
  assert.equal(rejected.resources.energy, state.resources.energy);
});

test('a zero-resource crisis gives eight seconds before the explorer collapses', () => {
  const state = createState({
    actionsRemaining: 0,
    resources: { ...INITIAL_GAME_STATE.resources, oxygen: 0 }
  });
  let crisis = beginResourceGrace(state);
  assert.equal(crisis.activeCrisis.secondsRemaining, 8);

  for (let second = 0; second < 7; second += 1) {
    crisis = tickResourceGrace(crisis);
  }
  assert.equal(crisis.crew.health, state.crew.health);
  assert.equal(crisis.activeCrisis.secondsRemaining, 1);

  crisis = tickResourceGrace(crisis);
  assert.equal(crisis.activeCrisis, null);
  assert.equal(crisis.crew.health, state.crew.health - 25);
  assert.equal(crisis.playerCollapsed, true);
  assert.equal(crisis.gameOver, false);
  assert.equal(beginResourceGrace(crisis), crisis);
});

test('an emergency order can repair a critical resource after daily orders run out', () => {
  const state = beginResourceGrace(createState({
    actionsRemaining: 0,
    resources: { ...INITIAL_GAME_STATE.resources, oxygen: 0 }
  }));
  const repaired = executeModuleAction(state, 'life_support', 'moxie').nextState;

  assert.ok(repaired.resources.oxygen > 0);
  assert.equal(repaired.actionsRemaining, 0);
  assert.equal(repaired.activeCrisis, null);
});

test('the Sol cannot advance while a critical-resource grace window is active', () => {
  const state = beginResourceGrace(createState({
    resources: { ...INITIAL_GAME_STATE.resources, water: 0 }
  }));

  assert.equal(advanceSolState(state).nextState, state);
});

test('eating consumes stored food and restores hunger', () => {
  const state = createState({ hunger: 20 });
  const result = executeModuleAction(state, 'agrodome', 'eat');

  assert.equal(result.nextState.resources.food, state.resources.food - 12);
  assert.equal(result.nextState.hunger, 60);
  assert.equal(result.nextState.actionsRemaining, state.actionsRemaining - 1);
});

test('crop plots grow independently and require manual harvest before food is added', () => {
  const state = createState();
  const planted = executeModuleAction(state, 'agrodome', 'plant', { plotIndex: 0 }).nextState;
  const secondPlant = executeModuleAction(planted, 'agrodome', 'plant', { plotIndex: 1 }).nextState;
  const firstDay = advanceSolState(secondPlant).nextState;
  const readyPlots = advanceSolState(firstDay).nextState;

  assert.equal(readyPlots.cropPlots[0].stage, 3);
  assert.equal(readyPlots.cropPlots[1].stage, 3);
  assert.equal(readyPlots.resources.food, state.resources.food);

  const harvested = executeModuleAction(readyPlots, 'agrodome', 'harvest', { plotIndex: 0 }).nextState;
  assert.equal(harvested.resources.food, state.resources.food + 25);
  assert.equal(harvested.cropPlots[0].planted, false);
  assert.equal(harvested.cropPlots[1].planted, true);
});

test('a crop dries after two Sols without water instead of granting an automatic harvest', () => {
  const planted = executeModuleAction(createState(), 'agrodome', 'plant', { plotIndex: 0 }).nextState;
  const firstDrySol = advanceSolState({
    ...planted,
    resources: { ...planted.resources, water: 0 }
  }).nextState;
  const secondDrySol = advanceSolState(firstDrySol).nextState;

  assert.equal(secondDrySol.cropPlots[0].planted, false);
  assert.equal(secondDrySol.resources.food, planted.resources.food);
});

test('launch preparation applies the selected task before Sol 1 without spending daily orders', () => {
  const state = prepareLaunchState(INITIAL_GAME_STATE, 'Ranger', 'seed-crop');

  assert.equal(state.sol, 1);
  assert.equal(state.cadetName, 'Ranger');
  assert.equal(state.actionsRemaining, state.maxActionsPerSol);
  assert.equal(state.cropPlots[0].planted, true);
  assert.equal(state.resources.water, INITIAL_GAME_STATE.resources.water - 8);
});

test('unknown launch preparation fails explicitly', () => {
  assert.throws(
    () => prepareLaunchState(INITIAL_GAME_STATE, 'Ranger', 'unknown'),
    /Preparación de lanzamiento desconocida/
  );
});

test('the rover can restore a critical power reserve with its battery', () => {
  const crisis = beginResourceGrace(createState({
    actionsRemaining: 0,
    resources: { ...INITIAL_GAME_STATE.resources, energy: 0 },
    robot: { ...INITIAL_GAME_STATE.robot, battery: 60 }
  }));
  const repaired = executeModuleAction(crisis, 'power_core', 'emergency_power').nextState;

  assert.equal(repaired.resources.energy, 18);
  assert.equal(repaired.robot.battery, 40);
  assert.equal(repaired.activeCrisis, null);
});

test('the rover can share one emergency ration when stored food is empty', () => {
  const crisis = beginResourceGrace(createState({
    actionsRemaining: 0,
    hunger: 0,
    resources: { ...INITIAL_GAME_STATE.resources, food: 0 },
    robot: { ...INITIAL_GAME_STATE.robot, emergencyRationAvailable: true }
  }));
  const fed = executeModuleAction(crisis, 'agrodome', 'eat').nextState;

  assert.equal(fed.hunger, 25);
  assert.equal(fed.robot.emergencyRationAvailable, false);
  assert.equal(fed.resources.food, 0);
  assert.equal(fed.activeCrisis, null);
});

test('the rover spends battery to clean panels and recharges between Sols', () => {
  const state = createState({
    robot: { ...INITIAL_GAME_STATE.robot, battery: 50 }
  });
  const cleaned = executeModuleAction(state, 'power_core', 'clean_panels').nextState;
  const nextSol = advanceSolState(cleaned).nextState;

  assert.equal(cleaned.robot.battery, 25);
  assert.equal(cleaned.roverTask, 'cleaning');
  assert.equal(nextSol.robot.battery, 40);
  assert.equal(nextSol.roverTask, null);
});

test('a mission minigame cannot delay emergency actions during a crisis', () => {
  const crisis = beginResourceGrace(createState({
    resources: { ...INITIAL_GAME_STATE.resources, oxygen: 0 }
  }));

  assert.equal(findChallengeForAction(crisis, 'power_core', 'clean_panels'), null);
});
