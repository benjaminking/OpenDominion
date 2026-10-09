import { describe, expect, it } from 'vitest';

import { SetupRuleType } from '../../src/setup/SetupRule';
import { SetupRules } from '../../src/setup/SetupRules';

describe('SetupRules', () => {
  it('stores initialization and game-state rules separately and returns each in LIFO order', () => {
    const rules = new SetupRules();
    const initA = { setupRuleType: SetupRuleType.GAME_INITIALIZATION, applySetupRule: () => undefined };
    const initB = { setupRuleType: SetupRuleType.GAME_INITIALIZATION, applySetupRule: () => undefined };
    const stateA = { setupRuleType: SetupRuleType.GAME_STATE, applySetupRule: () => undefined };
    const stateB = { setupRuleType: SetupRuleType.GAME_STATE, applySetupRule: () => undefined };

    rules.add(initA);
    rules.add(stateA);
    rules.add(initB);
    rules.add(stateB);

    expect(rules.hasAnyGameInitializationSetupRules()).toBe(true);
    expect(rules.hasAnyGameStateSetupRules()).toBe(true);
    expect(rules.getNextGameInitializationSetupRule()).toBe(initB);
    expect(rules.getNextGameInitializationSetupRule()).toBe(initA);
    expect(rules.getNextGameStateSetupRule()).toBe(stateB);
    expect(rules.getNextGameStateSetupRule()).toBe(stateA);
  });

  it('has no rules when new and none left after every rule has been taken', () => {
    const rules = new SetupRules();
    const initializationRule = { setupRuleType: SetupRuleType.GAME_INITIALIZATION, applySetupRule: () => undefined };
    const gameStateRule = { setupRuleType: SetupRuleType.GAME_STATE, applySetupRule: () => undefined };

    expect(rules.hasAnyGameInitializationSetupRules()).toBe(false);
    expect(rules.hasAnyGameStateSetupRules()).toBe(false);

    rules.add(initializationRule);
    expect(rules.hasAnyGameInitializationSetupRules()).toBe(true);
    expect(rules.hasAnyGameStateSetupRules()).toBe(false);

    rules.add(gameStateRule);
    rules.getNextGameInitializationSetupRule();
    expect(rules.hasAnyGameInitializationSetupRules()).toBe(false);
    expect(rules.hasAnyGameStateSetupRules()).toBe(true);

    rules.getNextGameStateSetupRule();
    expect(rules.hasAnyGameStateSetupRules()).toBe(false);
  });

  it('throws when requesting a rule from an empty list', () => {
    const rules = new SetupRules();

    expect(() => rules.getNextGameInitializationSetupRule()).toThrow(
      'Tried to get a next setup rule from an empty rule list',
    );
    expect(() => rules.getNextGameStateSetupRule()).toThrow('Tried to get a next setup rule from an empty rule list');
  });
});
