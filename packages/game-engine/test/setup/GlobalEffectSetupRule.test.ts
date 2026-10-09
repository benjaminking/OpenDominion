import { describe, expect, it, vi } from 'vitest';

import { Effect } from '../../src/effects/Effect';
import { SharedGameState } from '../../src/game-state/SharedGameState';
import { GlobalEffectSetupRule } from '../../src/setup/GlobalEffectSetupRule';
import { SetupRuleType } from '../../src/setup/SetupRule';
import { SetupRules } from '../../src/setup/SetupRules';

describe('GlobalEffectSetupRule', () => {
  it('is a game-state setup rule that adds its effect as a global effect', () => {
    const effect = { id: 'footpad-effect' } as unknown as Effect;
    const sharedGameState = { addGlobalEffect: vi.fn() };
    const rule = new GlobalEffectSetupRule(effect);

    rule.applySetupRule(sharedGameState as unknown as SharedGameState);

    expect(rule.setupRuleType).toBe(SetupRuleType.GAME_STATE);
    expect(sharedGameState.addGlobalEffect).toHaveBeenCalledTimes(1);
    expect(sharedGameState.addGlobalEffect).toHaveBeenCalledWith(effect);
  });

  it('is stored with the game-state setup rules', () => {
    const rules = new SetupRules();
    const rule = new GlobalEffectSetupRule({} as Effect);

    rules.add(rule);

    expect(rules.hasAnyGameStateSetupRules()).toBe(true);
    expect(rules.hasAnyGameInitializationSetupRules()).toBe(false);
    expect(rules.getNextGameStateSetupRule()).toBe(rule);
  });
});
