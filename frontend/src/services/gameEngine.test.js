import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_GAME_STATE, SOL_EVENTS } from '../data/gameData.js';
import {
  activateEmergencyRescue,
  advanceSolState,
  applyChoiceToState,
  executeModuleAction,
  getNextSolForecast
} from './gameEngine.js';

function createState(overrides = {}) {
  return {
    ...JSON.parse(JSON.stringify(INITIAL_GAME_STATE)),
    ...overrides
  };
}

test('resource depletion reduces health before ending the mission', () => {
  const state = createState({
    resources: { ...INITIAL_GAME_STATE.resources, food: 0 }
  });

  const { nextState } = advanceSolState(state);

  assert.equal(nextState.gameOver, false);
  assert.ok(nextState.crew.health < state.crew.health);
  assert.equal(nextState.resources.food, 0);
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

  const exposedState = applyChoiceToState(
    eventState,
    SOL_EVENTS[3].choices[1],
    SOL_EVENTS[3].hazard
  );
  assert.equal(exposedState.shield, 65);
});
