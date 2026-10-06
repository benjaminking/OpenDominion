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

    rules.add(initA as never);
    rules.add(stateA as never);
    rules.add(initB as never);
    rules.add(stateB as never);

    expect(rules.hasAnyGameInitializationSetupRules()).toBe(true);
    expect(rules.hasAnyGameStateSetupRules()).toBe(true);
    expect(rules.getNextGameInitializationSetupRule()).toBe(initB);
    expect(rules.getNextGameInitializationSetupRule()).toBe(initA);
    expect(rules.getNextGameStateSetupRule()).toBe(stateB);
    expect(rules.getNextGameStateSetupRule()).toBe(stateA);
  });

  it('throws when requesting a rule from an empty list', () => {
    const rules = new SetupRules();

    expect(() => rules.getNextGameInitializationSetupRule()).toThrow(
      'Tried to get a next setup rule from an empty rule list',
    );
    expect(() => rules.getNextGameStateSetupRule()).toThrow('Tried to get a next setup rule from an empty rule list');
  });
});
